import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trello, Link as LinkIcon, CaseUpper } from "lucide-react";

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const order = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, Number(id)),
    with: {
        client: true,
        workOrderItems: {
            with: {
                item: true,
                selectedAssemblies: {
                    with: {
                        assembly: true
                    }
                }
            }
        }
    }
  });

  if (!order) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold">Work Order not found.</h1>
        <p className="text-muted-foreground">The requested order does not exist.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl px-4 md:px-6 mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Order: {order.orderNumber}</h1>
            <p className="text-muted-foreground">
                For: <span className="font-semibold text-foreground">{order.client?.name ?? 'N/A'}</span>
            </p>
        </div>
        <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'} className="text-lg">
            {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                    The complete list of items and selected assemblies for this work order.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-6">
                    {order.workOrderItems.map((orderItem) => (
                    <div key={orderItem.id} className="p-4 border rounded-lg bg-muted/20">
                        <h3 className="font-bold text-lg mb-2">{orderItem.item.name} (Qty: {orderItem.quantity})</h3>
                        {orderItem.selectedAssemblies.length > 0 ? (
                        <ul className="space-y-1 pl-4">
                            {orderItem.selectedAssemblies.map(selectedAssembly => (
                            <li key={selectedAssembly.id} className="text-sm list-disc list-inside">
                                {selectedAssembly.assembly.name}
                            </li>
                            ))}
                        </ul>
                        ) : (
                        <p className="text-sm text-muted-foreground pl-4">No specific assemblies selected for this item.</p>
                        )}
                    </div>
                    ))}
                    {order.workOrderItems.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                            There are no items associated with this work order yet.
                        </p>
                    )}
                </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-1 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>External Links</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    {order.trelloLink ? (
                        <Button asChild>
                            <Link href={order.trelloLink} target="_blank" rel="noopener noreferrer">
                                <Trello className="mr-2 h-4 w-4" /> View on Trello
                            </Link>
                        </Button>
                    ) : <p className="text-sm text-muted-foreground">No Trello link.</p> }
                    {order.fusionLink ? (
                         <Button asChild variant="secondary">
                            <Link href={order.fusionLink} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4" /> View on Fusion 360
                            </Link>
                        </Button>
                    ) : <p className="text-sm text-muted-foreground">No Fusion 360 link.</p> }
                    {order.katanaLink ? (
                         <Button asChild variant="secondary">
                            <Link href={order.katanaLink} target="_blank" rel="noopener noreferrer">
                                <CaseUpper className="mr-2 h-4 w-4" /> View on Katana
                            </Link>
                        </Button>
                    ) : <p className="text-sm text-muted-foreground">No Katana link.</p> }
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
