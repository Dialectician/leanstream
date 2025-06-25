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
import { EmployeeSchema } from "@/lib/schemas"; // We will create this file next

type Employee = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  rate_per_hour: number | null;
};

interface EmployeesClientProps {
  employees: Employee[];
}

// State to hold validation errors for each field
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

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rate, setRate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    // 1. Validate form data with Zod
    const validationResult = EmployeeSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      rate_per_hour: rate,
    });

    // 2. If validation fails, set errors and stop
    if (!validationResult.success) {
      const zodErrors = validationResult.error.flatten().fieldErrors;
      setErrors(zodErrors);
      return;
    }

    // 3. If validation succeeds, proceed to insert
    setIsLoading(true);
    const { data: validatedData } = validationResult;

    const { data: newEmployee, error: insertError } = await supabase
      .from("employees")
      .insert({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        rate_per_hour: validatedData.rate_per_hour || null, // Handle empty string case
      })
      .select()
      .single();

    if (insertError) {
      setErrors({ general: insertError.message });
    } else if (newEmployee) {
      setEmployees([...employees, newEmployee].sort((a,b) => a.last_name?.localeCompare(b.last_name || '') || 0));
      // Reset form
      setFirstName("");
      setLastName("");
      setRate("");
    }
    setIsLoading(false);
  };

  return (
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
                <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                {errors.first_name && <p className="text-sm text-red-500">{errors.first_name[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                {errors.last_name && <p className="text-sm text-red-500">{errors.last_name[0]}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input id="rate" type="text" placeholder="e.g., 25.50" value={rate} onChange={(e) => setRate(e.target.value)} />
              {errors.rate_per_hour && <p className="text-sm text-red-500">{errors.rate_per_hour[0]}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading ? "Adding..." : "Add Employee"}
            </Button>
            {errors.general && <p className="text-sm text-red-500 mt-2">{errors.general}</p>}
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
                <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                <span className="text-muted-foreground">
                  ${emp.rate_per_hour ? emp.rate_per_hour.toFixed(2) : 'N/A'} / hr
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}