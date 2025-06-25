"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { workOrders } from "@/lib/db/schema";

// Use the Drizzle-generated type
type Order = typeof workOrders.$inferSelect;

interface WorkOrdersClientProps {
  orders: Order[];
}

export function WorkOrdersClient({
  orders: initialOrders,
}: WorkOrdersClientProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the "Add New" form
  const [newOrderNumber, setNewOrderNumber] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // State for the "Edit" dialog
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data: newOrder, error: insertError } = await supabase
      .from("work_orders")
      .insert({
        order_number: newOrderNumber,
        quantity: newQuantity ? parseInt(newQuantity, 10) : null,
        notes: newNotes,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (newOrder) {
      setOrders([newOrder as Order, ...orders]);
      setNewOrderNumber("");
      setNewQuantity("");
      setNewNotes("");
    }
    setIsLoading(false);
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm("Are you sure you want to delete this work order?")) {
      const { error } = await supabase.from("work_orders").delete().eq("id", orderId);
      if (error) {
        alert(error.message);
      } else {
        setOrders(orders.filter((order) => order.id !== orderId));
      }
    }
  };
  
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
  
    setIsLoading(true);
    setError(null);
  
    const { data: updatedOrder, error } = await supabase
      .from("work_orders")
      .update({
        order_number: editingOrder.orderNumber,
        quantity: editingOrder.quantity,
        notes: editingOrder.notes,
        status: editingOrder.status
      })
      .eq("id", editingOrder.id)
      .select()
      .single();
  
    if (error) {
      setError(error.message);
    } else if (updatedOrder) {
      setOrders(
        orders.map((order) => (order.id === updatedOrder.id ? (updatedOrder as Order) : order))
      );
      setEditingOrder(null); // Close the dialog
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Work Order</CardTitle>
            <CardDescription>Create a new job to track.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddOrder} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="order_number">Order Number</Label>
                <Input id="order_number" placeholder="e.g., WO-1001" value={newOrderNumber} onChange={(e) => setNewOrderNumber(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" placeholder="e.g., 50" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" placeholder="Optional notes" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
              </div>
              <Button type="submit" disabled={isLoading} className="mt-2">
                {isLoading ? "Adding..." : "Add Work Order"}
              </Button>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </form>
          </CardContent>
        </Card>

        {/* List Card with Edit/Delete Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Work Orders</CardTitle>
            <CardDescription>A list of all jobs in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id} className="flex justify-between items-center p-3 border rounded-md">
                  <Link href={`/protected/orders/${order.id}`} className="flex-grow">
                    <div className="hover:bg-accent -m-3 p-3 rounded-l-md transition-colors">
                      <p className="font-bold text-lg">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {order.quantity ?? "N/A"}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 pl-2">
                     <Button variant="ghost" size="icon" onClick={() => setEditingOrder(order)}>
                       <Pencil className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order.id)}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(isOpen) => !isOpen && setEditingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Work Order</DialogTitle>
            <DialogDescription>Update the details for this work order.</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <form onSubmit={handleUpdateOrder} className="flex flex-col gap-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_order_number">Order Number</Label>
                <Input id="edit_order_number" value={editingOrder.orderNumber} onChange={(e) => setEditingOrder({...editingOrder, orderNumber: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_quantity">Quantity</Label>
                <Input id="edit_quantity" type="number" value={editingOrder.quantity || ''} onChange={(e) => setEditingOrder({...editingOrder, quantity: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_status">Status</Label>
                <Input id="edit_status" value={editingOrder.status || ''} onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Input id="edit_notes" value={editingOrder.notes || ''} onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}