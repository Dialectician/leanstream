"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { workOrders, workOrderItems, workOrderItemAssemblies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// The new, more powerful server action
export async function createWorkOrderWithItems(formData: FormData) {
  const rawFormData = {
    orderNumber: formData.get('orderNumber') as string,
    clientId: Number(formData.get('clientId')) || null,
    items: JSON.parse(formData.get('items') as string) as { itemId: number; quantity: number; selectedAssemblies: number[] }[]
  };

  if (!rawFormData.orderNumber || !rawFormData.items || rawFormData.items.length === 0) {
    return { success: false, message: "Order number and at least one item are required." };
  }

  try {
    // Drizzle doesn't have transactions that span multiple queries out-of-the-box with Supabase driver.
    // In a real-world scenario, you would wrap this in a database transaction (e.g., using a custom RPC function).
    // For now, we'll proceed step-by-step.

    // 1. Create the Work Order
    const [newWorkOrder] = await db.insert(workOrders).values({
      orderNumber: rawFormData.orderNumber,
      clientId: rawFormData.clientId,
      status: 'Planned',
    }).returning();

    // 2. Create the Work Order Items and their selected Assemblies
    for (const item of rawFormData.items) {
      const [newWorkOrderItem] = await db.insert(workOrderItems).values({
        workOrderId: newWorkOrder.id,
        itemId: item.itemId,
        quantity: item.quantity,
      }).returning();

      if (item.selectedAssemblies && item.selectedAssemblies.length > 0) {
        const assemblyLinks = item.selectedAssemblies.map(assemblyId => ({
          workOrderItemId: newWorkOrderItem.id,
          assemblyId: assemblyId,
        }));
        await db.insert(workOrderItemAssemblies).values(assemblyLinks);
      }
    }

    revalidatePath("/protected/orders");
    return { success: true, message: "Work order created successfully." };
  } catch (error: any) {
    console.error("Error creating work order:", error);
    return { success: false, message: `Failed to create work order: ${error.message}` };
  }
}


export async function deleteWorkOrderAction(orderId: number) {
  console.log(`SERVER ACTION: deleteWorkOrder triggered for ID: ${orderId}`);

  if (!orderId) {
    return { success: false, message: "Invalid Order ID." };
  }

  // Use a transaction to delete the work order and its related items
  const { error } = await db.delete(workOrders).where(eq(workOrders.id, orderId));

  if (error) {
    console.error("Error deleting work order:", error);
    return { success: false, message: error.message };
  }

  console.log(`Successfully deleted work order ID: ${orderId}`);
  revalidatePath("/protected/orders"); // Refresh the page data
  return { success: true, message: "Order deleted successfully." };
}
