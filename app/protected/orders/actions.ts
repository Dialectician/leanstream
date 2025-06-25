"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addWorkOrder(formData: FormData) {
  console.log("SERVER ACTION: addWorkOrder triggered.");
  const supabase = await createClient();

  const newOrder = {
    order_number: formData.get("order_number") as string,
    quantity: Number(formData.get("quantity")) || null,
    client_id: Number(formData.get("client_id")) || null,
  };

  console.log("Adding order:", newOrder);

  const { error } = await supabase.from("work_orders").insert(newOrder);

  if (error) {
    console.error("Error adding work order:", error);
    return { success: false, message: error.message };
  }

  console.log("Successfully added work order.");
  revalidatePath("/protected/orders"); // This tells Next.js to refresh the data on the orders page
  return { success: true, message: "Order added successfully." };
}

export async function deleteWorkOrderAction(orderId: number) {
  console.log(`SERVER ACTION: deleteWorkOrder triggered for ID: ${orderId}`);
  const supabase = await createClient();

  if (!orderId) {
    return { success: false, message: "Invalid Order ID." };
  }

  const { error } = await supabase.rpc('delete_work_order', {
    order_id_to_delete: orderId
  });

  if (error) {
    console.error("Error deleting work order:", error);
    return { success: false, message: error.message };
  }

  console.log(`Successfully deleted work order ID: ${orderId}`);
  revalidatePath("/protected/orders"); // Refresh the page data
  return { success: true, message: "Order deleted successfully." };
}