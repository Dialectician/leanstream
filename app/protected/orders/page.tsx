import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
// Correctly import workOrders (camelCase) instead of work_orders
import { workOrders } from "@/lib/db/schema"; 
import { WorkOrdersClient } from "@/components/work-orders-client";
import { desc } from "drizzle-orm";

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Use the correct camelCase variable name
  const orders = await db.select().from(workOrders).orderBy(desc(workOrders.createdAt));

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-4xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Work Orders</h1>
        <WorkOrdersClient orders={orders} />
      </div>
    </div>
  );
}