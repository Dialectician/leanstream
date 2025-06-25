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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { EmployeeSchema } from "@/lib/schemas";
import { Pencil, Trash2 } from "lucide-react";

type Employee = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  rate_per_hour: number | null;
};

interface EmployeesClientProps {
  employees: Employee[];
}

type FormErrors = {
  first_name?: string[];
  last_name?: string[];
  rate_per_hour?: string[];
  general?: string;
};

export function EmployeesClient({
  employees: initialEmployees,
}: EmployeesClientProps) {
  const supabase = createClient();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // State for the "Add New" form
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRate, setNewRate] = useState("");

  // State for the "Edit" dialog
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validationResult = EmployeeSchema.safeParse({
      first_name: newFirstName,
      last_name: newLastName,
      rate_per_hour: newRate,
    });

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      return;
    }

    setIsLoading(true);
    const { data: validatedData } = validationResult;
    const { data: newEmployee, error: insertError } = await supabase
      .from("employees")
      .insert({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        rate_per_hour: validatedData.rate_per_hour || null,
      })
      .select()
      .single();

    if (insertError) {
      setErrors({ general: insertError.message });
    } else if (newEmployee) {
      setEmployees([...employees, newEmployee].sort((a,b) => (a.last_name || '').localeCompare(b.last_name || '')));
      setNewFirstName("");
      setNewLastName("");
      setNewRate("");
    }
    setIsLoading(false);
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      const { error } = await supabase.from("employees").delete().eq("id", employeeId);
      if (error) {
        alert(error.message);
      } else {
        setEmployees(employees.filter((emp) => emp.id !== employeeId));
      }
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    
    setErrors({});
    const validationResult = EmployeeSchema.safeParse({
      first_name: editingEmployee.first_name,
      last_name: editingEmployee.last_name,
      rate_per_hour: editingEmployee.rate_per_hour,
    });

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors);
      return;
    }

    setIsLoading(true);
    const { data: validatedData } = validationResult;
    const { data: updatedEmployee, error } = await supabase
      .from("employees")
      .update({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        rate_per_hour: validatedData.rate_per_hour || null,
      })
      .eq("id", editingEmployee.id)
      .select()
      .single();

    if (error) {
      setErrors({ general: error.message });
    } else if (updatedEmployee) {
      setEmployees(
        employees.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
      );
      setEditingEmployee(null); // This will close the dialog
    }
    setIsLoading(false);
  };

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Employee</CardTitle>
            <CardDescription>Add a new employee to the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
                  {errors.first_name && <p className="text-sm text-red-500">{errors.first_name[0]}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
                  {errors.last_name && <p className="text-sm text-red-500">{errors.last_name[0]}</p>}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input id="rate" type="text" placeholder="e.g., 25.50" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
                {errors.rate_per_hour && <p className="text-sm text-red-500">{errors.rate_per_hour[0]}</p>}
              </div>
              <Button type="submit" disabled={isLoading} className="mt-2">
                {isLoading ? "Adding..." : "Add Employee"}
              </Button>
              {errors.general && !Object.keys(errors).some(k => k !== 'general') && <p className="text-sm text-red-500 mt-2">{errors.general}</p>}
            </form>
          </CardContent>
        </Card>

        {/* List Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Employees</CardTitle>
            <CardDescription>A list of all employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {employees.map((emp) => (
                <li key={emp.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                    <p className="text-muted-foreground">
                      ${emp.rate_per_hour ? Number(emp.rate_per_hour).toFixed(2) : 'N/A'} / hr
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditingEmployee(emp)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(emp.id)}>
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
      <Dialog open={!!editingEmployee} onOpenChange={(isOpen) => !isOpen && setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update the details for this employee.</DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <form onSubmit={handleUpdateEmployee} className="flex flex-col gap-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input id="edit_first_name" value={editingEmployee.first_name || ''} onChange={(e) => setEditingEmployee({...editingEmployee, first_name: e.target.value})} />
                  {errors.first_name && <p className="text-sm text-red-500">{errors.first_name[0]}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input id="edit_last_name" value={editingEmployee.last_name || ''} onChange={(e) => setEditingEmployee({...editingEmployee, last_name: e.target.value})} />
                   {errors.last_name && <p className="text-sm text-red-500">{errors.last_name[0]}</p>}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_rate">Hourly Rate ($)</Label>
                <Input id="edit_rate" type="text" placeholder="e.g., 25.50" value={editingEmployee.rate_per_hour || ''} onChange={(e) => setEditingEmployee({...editingEmployee, rate_per_hour: Number(e.target.value)})} />
                {errors.rate_per_hour && <p className="text-sm text-red-500">{errors.rate_per_hour[0]}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
              {errors.general && <p className="text-sm text-red-500 mt-2">{errors.general}</p>}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}