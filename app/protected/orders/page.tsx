import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
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

  // Updated Drizzle query to fetch orders with their related client
  const orders = await db.query.workOrders.findMany({
    with: {
      client: true, // This uses the relationship we defined
    },
    orderBy: [desc(workOrders.createdAt)],
  });

  // Also fetch the list of all clients for the dropdown
  const clients = await db.query.clients.findMany({
    orderBy: (clients) => [desc(clients.name)],
  });

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-4xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Work Orders</h1>
        {/* Pass both orders and clients to the client component */}
        <WorkOrdersClient initialOrders={orders} allClients={clients} />
      </div>
    </div>
  );
}