import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmployeesClient } from "@/components/employees-client";

export default async function EmployeesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    console.error("Error fetching employees:", error);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Employees</h1>
        <p className="text-muted-foreground">
          Manage your workforce and employee information including rates and
          contact details.
        </p>
      </div>
      <EmployeesClient employees={employees || []} />
    </div>
  );
}
