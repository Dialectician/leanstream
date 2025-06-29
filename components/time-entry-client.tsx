"use client";

import { useState, useEffect } from "react";
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
import { Trash2 } from "lucide-react";

// Types for props and state
type Order = { id: number; order_number: string; client_id: number | null };
type Division = { id: number; name: string };
type Employee = { id: number; first_name: string; last_name: string };
type Client = {
  id: number;
  first_name: string | null;
  last_name: string | null;
};
type TimeEntryRow = {
  id: number;
  work_order_id: string;
  work_division_id: string;
  hours_spent: string;
  notes: string;
};
type DisplayEntry = {
  id: number;
  date_worked: string;
  hours_spent: number;
  notes: string | null;
  work_orders: { order_number: string }[] | null;
  work_divisions: { name: string }[] | null;
  employees: { first_name: string; last_name: string }[] | null;
};

interface TimeEntryClientProps {
  orders: Order[];
  divisions: Division[];
  employees: Employee[];
  clients: Client[];
  initialTimeEntries: DisplayEntry[];
}

export function TimeEntryClient({
  orders,
  divisions,
  employees,
  clients,
  initialTimeEntries,
}: TimeEntryClientProps) {
  const supabase = createClient();
  const [recentEntries, setRecentEntries] =
    useState<DisplayEntry[]>(initialTimeEntries);

  // Filter clients to only show those with orders
  const clientsWithOrders = clients.filter((client) =>
    orders.some((order) => order.client_id === client.id)
  );

  // Form state
  const [employeeId, setEmployeeId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryRows, setEntryRows] = useState<TimeEntryRow[]>([
    {
      id: 1,
      work_order_id: "",
      work_division_id: "",
      hours_spent: "",
      notes: "",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClientId) {
      const newFilteredOrders = orders.filter(
        (o) => o.client_id === Number(selectedClientId)
      );
      setFilteredOrders(newFilteredOrders);
      if (newFilteredOrders.length === 1) {
        setEntryRows((prevRows) => {
          const newRows = [...prevRows];
          if (newRows[0]) {
            newRows[0].work_order_id = String(newFilteredOrders[0].id);
          }
          return newRows;
        });
      }
    } else {
      setFilteredOrders(orders);
    }
  }, [selectedClientId, orders]);

  const handleRowChange = (
    index: number,
    field: keyof TimeEntryRow,
    value: string
  ) => {
    const updatedRows = [...entryRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setEntryRows(updatedRows);
  };

  const addRow = () => {
    setEntryRows([
      ...entryRows,
      {
        id: Date.now(),
        work_order_id: "",
        work_division_id: "",
        hours_spent: "",
        notes: "",
      },
    ]);
  };

  const removeRow = (id: number) => {
    setEntryRows(entryRows.filter((row) => row.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !date) {
      setError("Please select an employee and a date.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const entriesToInsert = entryRows
      .filter(
        (row) => row.work_order_id && row.work_division_id && row.hours_spent
      )
      .map((row) => ({
        employee_id: parseInt(employeeId),
        date_worked: date,
        work_order_id: parseInt(row.work_order_id),
        work_division_id: parseInt(row.work_division_id),
        hours_spent: parseFloat(row.hours_spent),
        notes: row.notes,
      }));

    if (entriesToInsert.length === 0) {
      setError("Please fill out at least one valid time entry row.");
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("time_entries")
      .insert(entriesToInsert);

    if (insertError) {
      setError(insertError.message);
    } else {
      // Clear form and refetch recent entries for feedback
      setEntryRows([
        {
          id: 1,
          work_order_id: "",
          work_division_id: "",
          hours_spent: "",
          notes: "",
        },
      ]);
      setSelectedClientId("");
      const { data: newEntries } = await supabase
        .from("time_entries")
        .select(
          `
          id, date_worked, hours_spent, notes,
          work_orders(order_number),
          work_divisions(name),
          employees(first_name, last_name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);
      if (newEntries) setRecentEntries(newEntries);
    }
    setIsLoading(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Form Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Time Card Entry</CardTitle>
          <CardDescription>
            Select an employee and date, then log hours for multiple orders and
            divisions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Employee, Client and Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">Employee</Label>
                <select
                  id="employee"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                >
                  <option value="" disabled>
                    Select an employee...
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client">Client</Label>
                <select
                  id="client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                >
                  <option value="">
                    {clientsWithOrders.length > 0
                      ? "Select a client to filter orders..."
                      : "No clients with active orders found"}
                  </option>
                  {clientsWithOrders.map((c) => {
                    const displayName = `${(c.first_name || "").trim()} ${(
                      c.last_name || ""
                    ).trim()}`.trim();
                    return (
                      <option key={c.id} value={c.id}>
                        {displayName || `Client #${c.id}`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date Worked</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Dynamic Entry Rows */}
            <div className="space-y-4 border-t pt-4">
              {entryRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_2fr_auto] gap-2 items-end p-2 border rounded-md"
                >
                  <div className="grid gap-1">
                    <Label htmlFor={`order-${row.id}`}>Order</Label>
                    <select
                      id={`order-${row.id}`}
                      value={row.work_order_id}
                      onChange={(e) =>
                        handleRowChange(index, "work_order_id", e.target.value)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="" disabled>
                        Select order...
                      </option>
                      {filteredOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.order_number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`division-${row.id}`}>Division</Label>
                    <select
                      id={`division-${row.id}`}
                      value={row.work_division_id}
                      onChange={(e) =>
                        handleRowChange(
                          index,
                          "work_division_id",
                          e.target.value
                        )
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="" disabled>
                        Select division...
                      </option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`hours-${row.id}`}>Hours</Label>
                    <Input
                      id={`hours-${row.id}`}
                      type="number"
                      step="0.25"
                      placeholder="2.5"
                      value={row.hours_spent}
                      onChange={(e) =>
                        handleRowChange(index, "hours_spent", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`notes-${row.id}`}>Notes</Label>
                    <Input
                      id={`notes-${row.id}`}
                      placeholder="Optional"
                      value={row.notes}
                      onChange={(e) =>
                        handleRowChange(index, "notes", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    disabled={entryRows.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button type="button" variant="outline" onClick={addRow}>
                Add Another Entry
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit All Entries"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Recent Entries Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>The last 10 entries logged.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEntries.length > 0 ? (
            <ul className="space-y-3">
              {recentEntries.map((entry) => (
                <li key={entry.id} className="p-3 border rounded-md text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.employees?.[0]?.first_name}{" "}
                        {entry.employees?.[0]?.last_name}
                      </p>
                      <p className="text-muted-foreground">
                        Order: {entry.work_orders?.[0]?.order_number}
                      </p>
                      <p className="text-muted-foreground">
                        Division: {entry.work_divisions?.[0]?.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg">
                        {entry.hours_spent} hrs
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date_worked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-xs mt-2 pt-2 border-t text-muted-foreground">
                      <span className="font-medium">Notes:</span> {entry.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No recent entries found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
