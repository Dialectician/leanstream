"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { workOrders, workOrderItems, workOrderItemAssemblies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createWorkOrderWithItems(formData: FormData) {
  const rawFormData = {
    orderNumber: formData.get('orderNumber') as string,
    clientId: formData.get('clientId') ? Number(formData.get('clientId')) : null,
    items: JSON.parse(formData.get('items') as string) as { itemId: number; quantity: number; selectedAssemblies: number[] }[]
  };

  if (!rawFormData.orderNumber || !rawFormData.items || rawFormData.items.length === 0) {
    return { success: false, message: "Order number and at least one item are required." };
  }

  try {
    const [newWorkOrder] = await db.insert(workOrders).values({
      orderNumber: rawFormData.orderNumber,
      clientId: rawFormData.clientId,
      status: 'Planned',
    }).returning();

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

export async function updateWorkOrder(orderId: number, formData: FormData) {
  const rawFormData = {
    orderNumber: formData.get('orderNumber') as string,
    clientId: formData.get('clientId') ? Number(formData.get('clientId')) : null,
    status: formData.get('status') as string,
    items: JSON.parse(formData.get('items') as string) as { itemId: number; quantity: number; selectedAssemblies: number[] }[]
  };

  if (!rawFormData.orderNumber || !orderId) {
    return { success: false, message: "Order number and Order ID are required." };
  }

  try {
    await db.update(workOrders).set({
        orderNumber: rawFormData.orderNumber,
        clientId: rawFormData.clientId,
        status: rawFormData.status,
      }).where(eq(workOrders.id, orderId));

    await db.delete(workOrderItems).where(eq(workOrderItems.workOrderId, orderId));
    
    for (const item of rawFormData.items) {
      const [newWorkOrderItem] = await db.insert(workOrderItems).values({
        workOrderId: orderId,
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
    const updatedOrder = await db.query.workOrders.findFirst({
        where: eq(workOrders.id, orderId),
        with: { client: true }
    });

    return { success: true, message: "Work order updated successfully.", data: updatedOrder };

  } catch (error: any) {
    console.error("Error updating work order:", error);
    return { success: false, message: `Failed to update work order: ${error.message}` };
  }
}

export async function updateWorkOrderStatus(orderId: number, newStatus: string) {
  try {
    const [updatedOrder] = await db
      .update(workOrders)
      .set({ status: newStatus })
      .where(eq(workOrders.id, orderId))
      .returning();

    if (!updatedOrder) {
      return { success: false, message: "Order not found." };
    }

    revalidatePath("/protected/orders");
    return { success: true, message: "Order status updated.", data: updatedOrder };
  } catch (error: any) {
    return { success: false, message: `Failed to update status: ${error.message}` };
  }
}

export async function deleteWorkOrderAction(orderId: number) {
  if (!orderId) {
    return { success: false, message: "Invalid Order ID." };
  }

  try {
    await db.delete(workOrders).where(eq(workOrders.id, orderId));
    revalidatePath("/protected/orders");
    return { success: true, message: "Order deleted successfully." };
  } catch (error: any) {
      console.error("Error deleting work order:", error);
      return { success: false, message: `Failed to delete order: ${error.message}` };
  }
}
