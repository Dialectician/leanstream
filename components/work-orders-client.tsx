"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, ArrowRight, Library } from "lucide-react";
import { createWorkOrderWithItems } from "@/app/protected/orders/actions";
import type { workOrders, clients, items, assemblies, itemAssemblies } from "@/lib/db/schema";

// --- TYPE DEFINITIONS ---
type OrderWithClient = typeof workOrders.$inferSelect & { client: typeof clients.$inferSelect | null };
type Client = typeof clients.$inferSelect;
type Assembly = typeof assemblies.$inferSelect;
type ItemWithAssemblies = typeof items.$inferSelect & {
  itemAssemblies: (typeof itemAssemblies.$inferSelect & { assembly: Assembly })[]
};
type StagedItem = {
    itemId: number;
    itemName: string;
    quantity: number;
    selectedAssemblies: number[];
}

// --- COMPONENT PROPS ---
interface WorkOrdersClientProps {
  initialOrders: OrderWithClient[];
  allClients: Client[];
  availableItems: ItemWithAssemblies[];
}

// --- MAIN COMPONENT ---
export function WorkOrdersClient({ initialOrders, allClients, availableItems }: WorkOrdersClientProps) {
  const [orders, setOrders] = useState<OrderWithClient[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);

  // --- State for the multi-step "Add Order" dialog ---
  const [dialogStep, setDialogStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ItemWithAssemblies | null>(null);
  const [currentAssemblies, setCurrentAssemblies] = useState<number[]>([]);

  const resetDialog = () => {
    setDialogStep(1);
    setOrderNumber("");
    setClientId(null);
    setStagedItems([]);
    setCurrentItem(null);
    setCurrentAssemblies([]);
  }

  const handleAddItemToStage = () => {
    if (!currentItem) return;
    const newItem: StagedItem = {
        itemId: currentItem.id,
        itemName: currentItem.name,
        quantity: 1, // Default quantity
        selectedAssemblies: currentAssemblies,
    };
    setStagedItems([...stagedItems, newItem]);
    setCurrentItem(null); // Go back to item selection
    setCurrentAssemblies([]);
  };

  const handleCreateWorkOrder = () => {
    if (!orderNumber || stagedItems.length === 0) {
        alert("Please provide an order number and add at least one item.");
        return;
    }
    const formData = new FormData();
    formData.append('orderNumber', orderNumber);
    formData.append('clientId', String(clientId));
    formData.append('items', JSON.stringify(stagedItems));

    startTransition(async () => {
        const result = await createWorkOrderWithItems(formData);
        if (result.success) {
            setAddDialogOpen(false);
            resetDialog();
        } else {
            alert(`Error: ${result.message}`);
        }
    });
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) resetDialog();
            setAddDialogOpen(isOpen);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Work Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Work Order</DialogTitle>
              <DialogDescription>Follow the steps to build and create a new work order.</DialogDescription>
            </DialogHeader>

            {/* Step 1: Basic Info */}
            {dialogStep === 1 && (
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="orderNumber">Order Number</Label>
                            <Input id="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clientId">Client</Label>
                            <select id="clientId" value={clientId ?? ""} onChange={(e) => setClientId(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                                <option value="">Select a client...</option>
                                {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="pt-4">
                        <h3 className="font-semibold mb-2">Staged Items ({stagedItems.length})</h3>
                        <div className="border rounded-lg p-2 min-h-[60px] space-y-1">
                            {stagedItems.map((item, index) => <p key={index} className="text-sm"> - {item.itemName} (Qty: {item.quantity})</p>)}
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Link href="/protected/item-builder" target="_blank">
                           <Button variant="outline" size="sm"><Library className="mr-2 h-4 w-4" />Go to Item Builder</Button>
                        </Link>
                    </div>
                </div>
            )}
            
            {/* Step 2: Item and Assembly Selection */}
            {dialogStep === 2 && (
                <div className="py-4">
                    {!currentItem ? (
                        <div>
                            <Label>Select an Item to Add</Label>
                             <div className="grid grid-cols-3 gap-2 mt-2">
                                {availableItems.map(item => (
                                    <Button key={item.id} variant="outline" onClick={() => setCurrentItem(item)}>
                                        {item.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="font-semibold">Configure: {currentItem.name}</h3>
                            <div className="mt-2 space-y-2">
                                <p className="text-sm font-medium">Select required assemblies:</p>
                                {currentItem.itemAssemblies.map(ia => (
                                    <div key={ia.assembly.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`assembly-${ia.assembly.id}`} 
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setCurrentAssemblies(prev => [...prev, ia.assembly.id]);
                                                } else {
                                                    setCurrentAssemblies(prev => prev.filter(id => id !== ia.assembly.id));
                                                }
                                            }}
                                        />
                                        <label htmlFor={`assembly-${ia.assembly.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {ia.assembly.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}


            <DialogFooter>
                {dialogStep === 1 && <Button onClick={() => setDialogStep(2)} disabled={!orderNumber}>Add/Configure Items <ArrowRight className="ml-2 h-4 w-4"/></Button>}
                {dialogStep === 2 && !currentItem && <Button variant="secondary" onClick={() => setDialogStep(1)}>Back to Details</Button>}
                {dialogStep === 2 && currentItem && <Button variant="secondary" onClick={() => setCurrentItem(null)}>Change Item</Button>}
                {dialogStep === 2 && currentItem && <Button onClick={handleAddItemToStage}>Add to Order</Button>}
                
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                {dialogStep === 1 && stagedItems.length > 0 && <Button onClick={handleCreateWorkOrder} disabled={isPending}>{isPending ? "Creating..." : "Create Work Order"}</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
            <OrdersTable data={orders.filter(o => o.status !== 'Completed')} />
        </TabsContent>
        <TabsContent value="complete">
            <OrdersTable data={orders.filter(o => o.status === 'Completed')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// A sub-component for displaying the orders table
const OrdersTable = ({ data }: { data: OrderWithClient[] }) => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.id}>
                <TableCell>
                    <Link href={`/protected/orders/${order.id}`} className="font-medium text-primary hover:underline">{order.orderNumber}</Link>
                </TableCell>
                <TableCell>{order.client?.name || "N/A"}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.dueDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
);
