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
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-4xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Manage Employees</h1>
        <EmployeesClient employees={employees || []} />
      </div>
    </div>
  );
}