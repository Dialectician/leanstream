"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { addWorkOrder, deleteWorkOrderAction } from "@/app/protected/orders/actions";
import type { workOrders, clients } from "@/lib/db/schema";

// Drizzle-generated types
type OrderWithClient = typeof workOrders.$inferSelect & { client: typeof clients.$inferSelect | null };
type Client = typeof clients.$inferSelect;

interface WorkOrdersClientProps {
  initialOrders: OrderWithClient[];
  allClients: Client[];
}

export function WorkOrdersClient({ initialOrders, allClients }: WorkOrdersClientProps) {
  const [orders, setOrders] = useState<OrderWithClient[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const addFormRef = useRef<HTMLFormElement>(null);

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    return orders.filter(order => {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        (order.client && order.client.name.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, orders]);

  const handleDeleteClick = (orderId: number) => {
    if (window.confirm("Are you sure? This will permanently delete the order and all its time entries.")) {
      startTransition(async () => {
        const result = await deleteWorkOrderAction(orderId);
        if (result.success) {
          // This will update the UI immediately
          setOrders(currentOrders => currentOrders.filter(order => order.id !== orderId));
        } else {
          alert(`Error: ${result.message}`);
        }
      });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* --- ADD ORDER FORM IS NOW RESTORED --- */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Work Order</CardTitle>
          <CardDescription>This form now uses a Server Action for reliability.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={addFormRef}
            action={async (formData) => {
              const result = await addWorkOrder(formData);
              if (result.success) {
                addFormRef.current?.reset();
                // We will rely on revalidation to show the new order
              } else {
                alert(`Error: ${result.message}`);
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="order_number">Order Number</Label>
              <Input name="order_number" id="order_number" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input name="quantity" id="quantity" type="number" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_id">Client</Label>
              <div className="flex gap-2">
                <select name="client_id" id="client_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                  <option value="">Select a client...</option>
                  {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button type="button" variant="outline" size="icon" disabled>
                  <PlusCircle className="h-4 w-4"/>
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Work Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* List and Search Card */}
      <Card>
        <CardHeader><CardTitle>Existing Work Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 mb-4">
            <Label htmlFor="search">Search by Order # or Client</Label>
            <Input id="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <ul className="space-y-2">
            {filteredOrders.map((order) => (
              <li key={order.id} className="flex justify-between items-center p-3 border rounded-md">
                <Link href={`/protected/orders/${order.id}`} className="flex-grow">
                  <div className="hover:bg-accent -m-3 p-3 rounded-l-md transition-colors">
                    <p className="font-bold text-lg">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.client?.name || "No Client"}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 pl-2">
                   <Button variant="ghost" size="icon" disabled>
                     <Pencil className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(order.id)} disabled={isPending}>
                     <Trash2 className="h-4 w-4 text-destructive" />
                   </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}