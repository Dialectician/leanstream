"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

// Types
type Employee = { id: number; first_name: string; last_name: string };
type Order = { id: number; order_number: string };
type Division = { id: number; name: string };
type TimeEntryRow = {
  clientId: number; 
  id: number | null; 
  work_order_id: string;
  work_division_id: string;
  hours_spent: string;
  notes: string;
};

interface TimeCardEditorClientProps {
  employees: Employee[];
  orders: Order[];
  divisions: Division[];
}

export function TimeCardEditorClient({ employees, orders, divisions }: TimeCardEditorClientProps) {
  const supabase = createClient();

  // State for the lookup form
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // State for the data grid
  const [entryRows, setEntryRows] = useState<TimeEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!employeeId || !date) {
      setError("Please select an employee and a date.");
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("date_worked", date);

    if (error) {
      setError(error.message);
    } else {
      const formattedRows = data.map(entry => ({
        clientId: entry.id,
        id: entry.id,
        work_order_id: String(entry.work_order_id),
        work_division_id: String(entry.work_division_id),
        hours_spent: String(entry.hours_spent),
        notes: entry.notes || "",
      }));
      setEntryRows(formattedRows);
    }
    setIsLoading(false);
  };

  const handleRowChange = (clientId: number, field: keyof TimeEntryRow, value: string) => {
    setEntryRows(
      entryRows.map(row =>
        row.clientId === clientId ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () => {
    setEntryRows([
      ...entryRows,
      { clientId: Date.now(), id: null, work_order_id: "", work_division_id: "", hours_spent: "", notes: "" },
    ]);
  };

  const removeRow = (clientId: number) => {
    setEntryRows(entryRows.filter((row) => row.clientId !== clientId));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setError(null);

    const entriesToSave = entryRows
      .filter(row => row.work_order_id && row.work_division_id && row.hours_spent)
      .map(row => ({
        id: row.id,
        work_order_id: parseInt(row.work_order_id),
        work_division_id: parseInt(row.work_division_id),
        hours_spent: parseFloat(row.hours_spent),
        notes: row.notes,
      }));

    const { error: rpcError } = await supabase.rpc('save_daily_time_card', {
      p_employee_id: parseInt(employeeId),
      p_date_worked: date,
      p_entries: entriesToSave,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      alert("Changes saved successfully!");
      handleLookup();
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Card Editor</CardTitle>
        <CardDescription>Look up a time card for a specific employee and date to make changes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lookup Form */}
        <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-muted/50 items-end">
            <div className="grid gap-2 flex-grow">
              <Label htmlFor="employee">Employee</Label>
              <select id="employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                <option value="" disabled>Select an employee...</option>
                {employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>))}
              </select>
            </div>
            <div className="grid gap-2 flex-grow">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required/>
            </div>
            <Button onClick={handleLookup} disabled={isLoading || !employeeId || !date}>
                {isLoading ? 'Loading...' : 'Load Time Card'}
            </Button>
        </div>

        {/* --- THIS IS THE CORRECTED SECTION --- */}
        {entryRows.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Editing Time Card</h3>
             {entryRows.map((row) => (
                <div key={row.clientId} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_2fr_auto] gap-2 items-end p-2 border rounded-md">
                  <div className="grid gap-1">
                    <Label htmlFor={`order-${row.clientId}`}>Order</Label>
                    <select id={`order-${row.clientId}`} value={row.work_order_id} onChange={(e) => handleRowChange(row.clientId, "work_order_id", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                      <option value="" disabled>Select order...</option>
                      {orders.map((o) => (<option key={o.id} value={o.id}>{o.order_number}</option>))}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`division-${row.clientId}`}>Division</Label>
                    <select id={`division-${row.clientId}`} value={row.work_division_id} onChange={(e) => handleRowChange(row.clientId, "work_division_id", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                      <option value="" disabled>Select division...</option>
                      {divisions.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`hours-${row.clientId}`}>Hours</Label>
                    <Input id={`hours-${row.clientId}`} type="number" step="0.25" placeholder="2.5" value={row.hours_spent} onChange={(e) => handleRowChange(row.clientId, "hours_spent", e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor={`notes-${row.clientId}`}>Notes</Label>
                    <Input id={`notes-${row.clientId}`} placeholder="Optional" value={row.notes} onChange={(e) => handleRowChange(row.clientId, "notes", e.target.value)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.clientId)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            <div className="flex justify-between items-center mt-4">
              <Button type="button" variant="outline" onClick={addRow}>Add Another Entry</Button>
              <Button onClick={handleSaveChanges} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save All Changes'}</Button>
            </div>
          </div>
        )}
        
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}