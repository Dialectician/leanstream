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
import Link from "next/link";
// Correctly import workOrders (camelCase)
import type { workOrders } from "@/lib/db/schema"; 

// Use the Drizzle-generated type for a work order
type Order = typeof workOrders.$inferSelect;

interface WorkOrdersClientProps {
  orders: Order[];
}

export function WorkOrdersClient({
  orders: initialOrders,
}: WorkOrdersClientProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [newOrderNumber, setNewOrderNumber] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // The type from .select() might not match Drizzle's exactly, so we cast it.
      // This is safe because it's coming directly from the same table.
      setOrders([newOrder as Order, ...orders]);
      setNewOrderNumber("");
      setNewQuantity("");
      setNewNotes("");
    }
    setIsLoading(false);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Work Order</CardTitle>
          <CardDescription>
            Create a new job to track.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddOrder} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="order_number">Order Number</Label>
              <Input
                id="order_number"
                placeholder="e.g., WO-1001"
                value={newOrderNumber}
                onChange={(e) => setNewOrderNumber(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 50"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes about the order"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading ? "Adding..." : "Add Work Order"}
            </Button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Work Orders</CardTitle>
          <CardDescription>
            A list of all jobs in the system. Click one to see details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {orders.length > 0 ? (
              orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/protected/orders/${order.id}`}>
                    <div className="flex justify-between items-center p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer">
                      <div>
                        <p className="font-bold text-lg">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {order.quantity ?? "N/A"}
                        </p>
                      </div>
                      <span className="text-sm font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                        {order.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-muted-foreground">No work orders found.</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}