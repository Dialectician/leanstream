import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkOrdersClient } from "@/components/work-orders-client";

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch work orders, ordering by the most recently created
  const { data: orders, error } = await supabase
    .from("work_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching work orders:", error);
    // You might want to display an error message to the user
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-4xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Work Orders</h1>
        <WorkOrdersClient orders={orders || []} />
      </div>
    </div>
  );
}
