import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

// Type definition for the data returned by our new SQL function
type DivisionHours = {
  division_id: number;
  division_name: string;
  parent_id: number | null;
  depth: number;
  direct_hours: number;
  total_hours: number;
  children?: DivisionHours[];
};

// A recursive component to render each division and its children
const DivisionRow = ({ division }: { division: DivisionHours }) => {
  const hasChildren = division.children && division.children.length > 0;
  const directHours = Number(division.direct_hours || 0);

  return (
    <details open className="group">
      <summary className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent list-none">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <>
              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
            </>
          )}
          <span className={`font-medium ${!hasChildren && 'ml-6'}`}>{division.division_name}</span>
        </div>
        <span className="text-lg font-bold">{Number(division.total_hours).toFixed(2)} hrs</span>
      </summary>
      
      <div className="pl-6 border-l ml-3">
        {directHours > 0 && (
          <div className="flex items-center justify-between p-2 text-sm">
            <span className="text-muted-foreground italic">Hours logged directly to {division.division_name}</span>
            <span className="font-semibold">{directHours.toFixed(2)} hrs</span>
          </div>
        )}
        {hasChildren && division.children?.map(child => (
          <DivisionRow key={child.division_id} division={child} />
        ))}
      </div>
    </details>
  );
};

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: order, error: orderError } = await supabase
    .from("work_orders")
    .select("*")
    .eq("id", id)
    .single();
    
  // Call our RPC function
  const { data: hoursData, error: rpcError } = await supabase
    .rpc('get_order_hours_breakdown', { p_work_order_id: parseInt(id) })
    .returns<DivisionHours[]>();

  // **IMPROVED ERROR HANDLING**
  if (orderError || rpcError) {
    console.error("Error fetching order details:", orderError || rpcError);
    const errorMessage = (orderError?.message || rpcError?.message) || "An unknown error occurred.";
    return <div className="p-4 text-red-500">Error: {errorMessage}</div>;
  }

  if (!order) return <div>Work Order not found.</div>;

  const buildTree = (list: DivisionHours[]): DivisionHours[] => {
    const map: Record<number, DivisionHours> = {};
    const roots: DivisionHours[] = [];

    list.forEach(node => {
      map[node.division_id] = { ...node, children: [] };
    });

    list.forEach(node => {
      if (node.parent_id !== null && map[node.parent_id]) {
        map[node.parent_id].children?.push(map[node.division_id]);
      } else {
        roots.push(map[node.division_id]);
      }
    });

    return roots;
  };

  const divisionTree = buildTree(hoursData || []);
  const totalHours = divisionTree.reduce((sum, root) => sum + Number(root.total_hours), 0);

  return (
    <div className="w-full max-w-4xl px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Order: {order.order_number}</h1>
        <p className="text-muted-foreground">Status: {order.status}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hours Breakdown</CardTitle>
          <div className="flex justify-between items-baseline">
             <CardDescription>Total hours per division, including sub-divisions.</CardDescription>
             <p className="text-sm">Total Order Hours: <span className="font-bold text-lg">{totalHours.toFixed(2)}</span></p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {divisionTree.map(rootDivision => (
              <DivisionRow key={rootDivision.division_id} division={rootDivision} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}