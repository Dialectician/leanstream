"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, ArrowRight, Library, MoreHorizontal, Trash2, Edit, CheckCircle2, X } from "lucide-react";
import { createWorkOrderWithItems, updateWorkOrderStatus, deleteWorkOrderAction, updateWorkOrder } from "@/app/protected/orders/actions";
import type { workOrders, clients, items, assemblies, itemAssemblies, workOrderItems, workOrderItemAssemblies } from "@/lib/db/schema";

// --- TYPE DEFINITIONS ---
type Assembly = typeof assemblies.$inferSelect;
type ItemWithAssemblies = typeof items.$inferSelect & {
  itemAssemblies: (typeof itemAssemblies.$inferSelect & { assembly: Assembly })[]
};
type WorkOrderItemWithDetails = typeof workOrderItems.$inferSelect & {
    item: typeof items.$inferSelect,
    selectedAssemblies: (typeof workOrderItemAssemblies.$inferSelect & { assembly: Assembly })[]
};
type OrderWithDetails = typeof workOrders.$inferSelect & { 
    client: typeof clients.$inferSelect | null,
    workOrderItems: WorkOrderItemWithDetails[] 
};
type Client = typeof clients.$inferSelect;
type StagedItem = {
    itemId: number;
    itemName: string;
    quantity: number;
    selectedAssemblies: number[];
}

// --- COMPONENT PROPS ---
interface WorkOrdersClientProps {
  initialOrders: OrderWithDetails[];
  allClients: Client[];
  availableItems: ItemWithAssemblies[];
}

// --- MAIN COMPONENT ---
export function WorkOrdersClient({ initialOrders, allClients, availableItems }: WorkOrdersClientProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  
  // Unified dialog state
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);

  // State for the multi-step dialog
  const [dialogStep, setDialogStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [trelloLink, setTrelloLink] = useState("");
  const [fusionLink, setFusionLink] = useState("");
  const [katanaLink, setKatanaLink] = useState("");
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ItemWithAssemblies | null>(null);
  const [currentAssemblies, setCurrentAssemblies] = useState<number[]>([]);

  // Effect to populate edit form when an order is selected
  useEffect(() => {
    if (editingOrder) {
      setOrderNumber(editingOrder.orderNumber);
      setClientId(editingOrder.clientId);
      setDueDate(editingOrder.dueDate ?? "");
      setTrelloLink(editingOrder.trelloLink ?? "");
      setFusionLink(editingOrder.fusionLink ?? "");
      setKatanaLink(editingOrder.katanaLink ?? "");
      const existingItems = editingOrder.workOrderItems.map(woi => ({
          itemId: woi.itemId,
          itemName: woi.item.name,
          quantity: woi.quantity,
          selectedAssemblies: woi.selectedAssemblies.map(sa => sa.assemblyId)
      }));
      setStagedItems(existingItems);
    }
  }, [editingOrder]);

  const resetDialogs = () => {
    setDialogStep(1);
    setOrderNumber("");
    setClientId(null);
    setDueDate("");
    setTrelloLink("");
    setFusionLink("");
    setKatanaLink("");
    setStagedItems([]);
    setCurrentItem(null);
    setCurrentAssemblies([]);
    setEditingOrder(null);
    setModalOpen(false);
  }

  const handleOpenAddModal = () => {
    resetDialogs();
    setModalOpen(true);
  }

  const handleOpenEditModal = (order: OrderWithDetails) => {
    resetDialogs();
    setEditingOrder(order);
    setModalOpen(true);
  }

  const handleAddItemToStage = () => {
    if (!currentItem) return;
    const newItem: StagedItem = {
        itemId: currentItem.id,
        itemName: currentItem.name,
        quantity: 1, 
        selectedAssemblies: currentAssemblies,
    };
    setStagedItems([...stagedItems, newItem]);
    setCurrentItem(null); 
    setCurrentAssemblies([]);
  };

  const removeStagedItem = (index: number) => {
    setStagedItems(current => current.filter((_, i) => i !== index));
  }
  
  const handleFormSubmit = () => {
    const isEditing = !!editingOrder;
    
    if (!orderNumber || stagedItems.length === 0) {
        alert("Please provide an order number and add at least one item.");
        return;
    }

    const formData = new FormData();
    formData.append('orderNumber', orderNumber);
    formData.append('clientId', String(clientId));
    formData.append('status', editingOrder?.status ?? 'Planned');
    formData.append('items', JSON.stringify(stagedItems));
    formData.append('dueDate', dueDate);
    formData.append('trelloLink', trelloLink);
    formData.append('fusionLink', fusionLink);
    formData.append('katanaLink', katanaLink);

    startTransition(async () => {
      const result = await (isEditing ? updateWorkOrder(editingOrder!.id, formData) : createWorkOrderWithItems(formData));

      if (result.success) {
        resetDialogs();
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  }
  
  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    startTransition(async () => {
      const result = await updateWorkOrderStatus(orderId, newStatus);
      if (result.success && result.data) {
        setOrders(currentOrders => 
          currentOrders.map(o => o.id === orderId ? {...o, status: result.data!.status} : o)
        );
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  const handleDelete = (orderId: number) => {
    if (window.confirm("Are you sure? This will permanently delete the order.")) {
      startTransition(async () => {
        const result = await deleteWorkOrderAction(orderId);
        if (result.success) {
          setOrders(currentOrders => currentOrders.filter(o => o.id !== orderId));
        } else {
          alert(`Error: ${result.message}`);
        }
      });
    }
  }

  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'Completed'), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'Completed'), [orders]);

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <Button onClick={handleOpenAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Work Order
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => !isOpen && resetDialogs()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingOrder ? `Edit Work Order: ${editingOrder.orderNumber}` : 'Create New Work Order'}</DialogTitle>
            <DialogDescription>
              {editingOrder ? "Update the details for this work order." : "Follow the steps to build and create a new work order."}
            </DialogDescription>
          </DialogHeader>

          {dialogStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Order Number</Label><Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Client</Label>
                  <select value={clientId ?? ""} onChange={(e) => setClientId(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                    <option value="">Select a client...</option>
                    {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Trello Link</Label><Input value={trelloLink} onChange={(e) => setTrelloLink(e.target.value)} placeholder="https://trello.com/..." /></div>
                <div className="grid gap-2"><Label>Fusion 360 Link</Label><Input value={fusionLink} onChange={(e) => setFusionLink(e.target.value)} placeholder="https://fusion360.autodesk.com/..." /></div>
                <div className="grid gap-2"><Label>Katana Link</Label><Input value={katanaLink} onChange={(e) => setKatanaLink(e.target.value)} placeholder="https://katanamrp.com/..." /></div>
              </div>
              <div className="pt-4">
                <h3 className="font-semibold mb-2">Items on Order ({stagedItems.length})</h3>
                <div className="border rounded-lg p-2 min-h-[80px] space-y-1">
                  {stagedItems.length > 0 ? stagedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-1 hover:bg-muted/50 rounded-md">
                      <span>- {item.itemName} (Qty: {item.quantity})</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStagedItem(index)}><X className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  )) : <p className="text-sm text-muted-foreground p-2">No items added yet.</p>}
                </div>
              </div>
               <div className="flex justify-end pt-2"><Link href="/protected/item-builder" target="_blank"><Button variant="outline" size="sm"><Library className="mr-2 h-4 w-4" />Item/Assembly Library</Button></Link></div>
            </div>
          )}
          
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
                    {currentItem.itemAssemblies.length > 0 ? currentItem.itemAssemblies.map(ia => (
                      <div key={ia.assembly.id} className="flex items-center space-x-2">
                        <Checkbox id={`assembly-${ia.assembly.id}`} onCheckedChange={(checked) => {
                          setCurrentAssemblies(prev => checked ? [...prev, ia.assembly.id] : prev.filter(id => id !== ia.assembly.id));
                        }}/>
                        <label htmlFor={`assembly-${ia.assembly.id}`} className="text-sm">{ia.assembly.name}</label>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No assemblies configured for this item.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
              {dialogStep === 1 && <Button onClick={() => setDialogStep(2)} disabled={!orderNumber}>Add/Configure Items <ArrowRight className="ml-2 h-4 w-4"/></Button>}
              {dialogStep === 2 && !currentItem && <Button variant="secondary" onClick={() => setDialogStep(1)}>Back to Details</Button>}
              {dialogStep === 2 && currentItem && <Button variant="secondary" onClick={() => setCurrentItem(null)}>Change Item</Button>}
              {dialogStep === 2 && currentItem && <Button onClick={handleAddItemToStage}>Add Item to Order</Button>}
              <Button onClick={resetDialogs} variant="outline">Cancel</Button>
              {dialogStep === 1 && stagedItems.length > 0 && <Button onClick={handleFormSubmit} disabled={isPending}>{isPending ? "Saving..." : "Save Work Order"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
            <OrdersTable data={activeOrders} onEdit={handleOpenEditModal} onStatusUpdate={handleStatusUpdate} onDelete={handleDelete} isPending={isPending} />
        </TabsContent>
        <TabsContent value="complete">
            <OrdersTable data={completedOrders} onEdit={handleOpenEditModal} onStatusUpdate={handleStatusUpdate} onDelete={handleDelete} isPending={isPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OrdersTableProps {
    data: OrderWithDetails[];
    onEdit: (order: OrderWithDetails) => void;
    onStatusUpdate: (orderId: number, newStatus: string) => void;
    onDelete: (orderId: number) => void;
    isPending: boolean;
}

const OrdersTable = ({ data, onEdit, onStatusUpdate, onDelete, isPending }: OrdersTableProps) => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isPending}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => onEdit(order)}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                            {order.status !== 'Completed' ? (
                                <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'Completed')}><CheckCircle2 className="mr-2 h-4 w-4" /><span>Mark as Complete</span></DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'Planned')}><ArrowRight className="mr-2 h-4 w-4" /><span>Mark as Active</span></DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
);