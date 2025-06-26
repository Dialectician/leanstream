"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addItem, addAssembly, associateAssemblyWithItem } from "@/app/protected/item-builder/actions";
import type { items, assemblies, itemAssemblies } from "@/lib/db/schema";

// Types
type AssemblyWithParent = typeof assemblies.$inferSelect & { parentAssembly?: { name: string } | null };
type ItemWithAssemblies = typeof items.$inferSelect & {
  itemAssemblies: (typeof itemAssemblies.$inferSelect & { assembly: AssemblyWithParent })[]
};

interface ItemBuilderClientProps {
  initialItems: ItemWithAssemblies[];
  initialAssemblies: AssemblyWithParent[];
}

export function ItemBuilderClient({ initialItems, initialAssemblies }: ItemBuilderClientProps) {
  const [items, setItems] = useState<ItemWithAssemblies[]>(initialItems);
  const [assemblies, setAssemblies] = useState<AssemblyWithParent[]>(initialAssemblies);
  const [selectedItem, setSelectedItem] = useState<ItemWithAssemblies | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemFormRef = useRef<HTMLFormElement>(null);
  const assemblyFormRef = useRef<HTMLFormElement>(null);
  const associationFormRef = useRef<HTMLFormElement>(null);

  const handleAssociation = async (formData: FormData) => {
    const assemblyId = formData.get("assemblyId");
    if (!selectedItem || !assemblyId) return;

    startTransition(async () => {
      const result = await associateAssemblyWithItem(selectedItem.id, Number(assemblyId));
      if (result.success) {
        // Find the full assembly object to add to the local state
        const assemblyToAdd = assemblies.find(a => a.id === Number(assemblyId));
        if (assemblyToAdd) {
          // Create the new association structure
          const newAssociation = {
            id: Date.now(), // Temporary client-side ID
            itemId: selectedItem.id,
            assemblyId: assemblyToAdd.id,
            assembly: assemblyToAdd
          };
          
          // Update the specific item in our state
          setItems(currentItems =>
            currentItems.map(item =>
              item.id === selectedItem.id
                ? { ...item, itemAssemblies: [...item.itemAssemblies, newAssociation] }
                : item
            )
          );
          
          // Also update the selectedItem state to re-render the list
          setSelectedItem(prev => prev ? { ...prev, itemAssemblies: [...prev.itemAssemblies, newAssociation] } : null);
        }
        associationFormRef.current?.reset();

      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {/* Items Section */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Finished products composed of assemblies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            ref={itemFormRef}
            action={(formData) => startTransition(async () => {
              const result = await addItem(formData);
              if (result.success && result.data) {
                setItems(current => [{...result.data!, itemAssemblies: []}, ...current]);
                itemFormRef.current?.reset();
              } else {
                alert(`Error: ${result.message}`);
              }
            })}
            className="space-y-3 p-3 border rounded-lg"
          >
            <h3 className="font-semibold text-sm">Add New Item</h3>
            <div className="grid gap-1.5">
              <Label htmlFor="itemName" className="text-xs">Item Name</Label>
              <Input id="itemName" name="name" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="itemDesc" className="text-xs">Description</Label>
              <Input id="itemDesc" name="description" />
            </div>
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Adding..." : "Add Item"}</Button>
          </form>

          <div className="pt-4">
            <h3 className="font-semibold">Select an Item to Manage</h3>
            <ul className="space-y-2 mt-2">
              {items.map(item => (
                <li key={item.id} onClick={() => setSelectedItem(item)} className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-accent' : 'hover:bg-muted/50'}`}>
                  <p className="font-medium">{item.name}</p>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Assemblies Management Section */}
      {selectedItem && (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Manage Assemblies for: <span className="text-primary">{selectedItem.name}</span></CardTitle>
                <CardDescription>Link the building blocks to this item.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold">Add Assembly to Item</h3>
                    <form ref={associationFormRef} action={handleAssociation} className="p-4 border rounded-lg space-y-4">
                      <div className="grid gap-2">
                          <Label htmlFor="assemblyId">Available Assemblies</Label>
                          <select name="assemblyId" id="assemblyId" defaultValue="" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                              <option value="" disabled>Select an assembly...</option>
                              {assemblies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                      </div>
                      <Button type="submit" disabled={isPending}>Link Assembly</Button>
                    </form>
                </div>
                <div>
                  <h3 className="font-semibold">Associated Assemblies</h3>
                  <ul className="space-y-2 mt-2">
                    {selectedItem.itemAssemblies.length > 0 ? (
                        selectedItem.itemAssemblies.map(assoc => (
                            <li key={assoc.id} className="p-3 border rounded-md text-sm">
                                <p className="font-medium">{assoc.assembly.name}</p>
                            </li>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">No assemblies linked yet.</p>
                    )}
                  </ul>
                </div>
            </CardContent>
        </Card>
      )}

      {/* You can keep a separate card for adding assemblies if you like, or integrate it elsewhere */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Create New Assemblies</CardTitle>
        </CardHeader>
        <CardContent>
        <form
            ref={assemblyFormRef}
            action={(formData) => startTransition(async () => {
              const result = await addAssembly(formData);
              if (result.success && result.data) {
                setAssemblies(current => [result.data!, ...current]);
                assemblyFormRef.current?.reset();
              } else {
                alert(`Error: ${result.message}`);
              }
            })}
            className="space-y-4 p-4 border rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assemblyName">Assembly Name</Label>
                <Input id="assemblyName" name="name" placeholder="e.g., Table Top" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assemblyDesc">Description</Label>
                <Input id="assemblyDesc" name="description" placeholder="Optional description" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parentAssemblyId">Parent Assembly</Label>
                 <select name="parentAssemblyId" id="parentAssemblyId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                    <option value="">None (Top-Level)</option>
                    {assemblies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
              </div>
            </div>
            <Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add Assembly"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}