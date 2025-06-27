// app/protected/orders/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { WorkOrdersClient } from "@/components/work-orders-client";
import type {
  items,
  assemblies,
  itemAssemblies,
  workOrders,
  clients,
  workOrderItems,
  workOrderItemAssemblies,
} from "@/lib/db/schema";

// Type definitions to match what WorkOrdersClient expects
type Assembly = typeof assemblies.$inferSelect;
type ItemWithAssemblies = typeof items.$inferSelect & {
  itemAssemblies: (typeof itemAssemblies.$inferSelect & {
    assembly: Assembly;
  })[];
};
type WorkOrderItemWithDetails = typeof workOrderItems.$inferSelect & {
  item: typeof items.$inferSelect;
  selectedAssemblies: (typeof workOrderItemAssemblies.$inferSelect & {
    assembly: Assembly;
  })[];
};
type OrderWithDetails = typeof workOrders.$inferSelect & {
  client:
    | (typeof clients.$inferSelect & {
        firstName?: string | null;
        lastName?: string | null;
      })
    | null;
  workOrderItems: WorkOrderItemWithDetails[];
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch all data needed for the orders page and the "Add/Edit" dialogs
  const [allOrdersRaw, allClients, availableItems] = await Promise.all([
    db.query.workOrders.findMany({
      // Explicitly select all columns to ensure dueDate and startDate are included
      columns: {
        id: true,
        orderNumber: true,
        status: true,
        dueDate: true,
        startDate: true,
        createdAt: true,
        clientId: true,
        trelloLink: true,
        fusionLink: true,
        katanaLink: true,
        notes: true,
        quantity: true,
      },
      with: {
        client: true,
        workOrderItems: {
          with: {
            item: true,
            selectedAssemblies: {
              with: {
                assembly: true,
              },
            },
          },
        },
      },
      orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
    }),
    db.query.clients.findMany({
      orderBy: (clients, { asc }) => [
        asc(clients.lastName),
        asc(clients.firstName),
      ],
    }),
    db.query.items.findMany({
      with: {
        itemAssemblies: {
          with: {
            assembly: true,
          },
        },
      },
    }),
  ]);

  // Type assertion to match the expected OrderWithDetails type
  const allOrders = allOrdersRaw as OrderWithDetails[];

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-6xl px-4 md:px-6">
        <WorkOrdersClient
          initialOrders={allOrders}
          allClients={allClients}
          availableItems={availableItems as ItemWithAssemblies[]}
        />
      </div>
    </div>
  );
}
