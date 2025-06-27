// components/clients-client.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

type Client = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
};

interface ClientsClientProps {
  clients: Client[];
}

export function ClientsClient({ clients: initialClients }: ClientsClientProps) {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add New form state
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Edit Dialog state
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        first_name: newFirstName,
        last_name: newLastName,
        contact_person: newContact,
        email: newEmail,
        phone: newPhone,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (newClient) {
      setClients(
        [...clients, newClient].sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          )
        )
      );
      setNewFirstName("");
      setNewLastName("");
      setNewContact("");
      setNewEmail("");
      setNewPhone("");
    }
    setIsLoading(false);
  };

  const handleDeleteClient = async (clientId: number) => {
    if (window.confirm("Are you sure? Deleting a client cannot be undone.")) {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      if (error) {
        alert(error.message);
      } else {
        setClients(clients.filter((c) => c.id !== clientId));
      }
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsLoading(true);
    setError(null);
    const { data: updatedClient, error } = await supabase
      .from("clients")
      .update({
        first_name: editingClient.firstName,
        last_name: editingClient.lastName,
        contact_person: editingClient.contact_person,
        email: editingClient.email,
        phone: editingClient.phone,
      })
      .eq("id", editingClient.id)
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else if (updatedClient) {
      setClients(
        clients.map((c) => (c.id === updatedClient.id ? updatedClient : c))
      );
      setEditingClient(null);
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Client</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact Person</Label>
                <Input
                  id="contact"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Client"}
              </Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <div>
                    <p className="font-medium">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {client.contact_person}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingClient(client)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={!!editingClient}
        onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <form onSubmit={handleUpdateClient} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editingClient.firstName || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        firstName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editingClient.lastName || ""}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        lastName: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_contact">Contact Person</Label>
                <Input
                  id="edit_contact"
                  value={editingClient.contact_person || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      contact_person: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editingClient.email || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={editingClient.phone || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
