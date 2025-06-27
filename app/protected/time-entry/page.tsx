// app/protected/time-entry/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TimeEntryClient } from "@/components/time-entry-client";

export default async function TimeEntryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch all necessary data in parallel
  const [
    { data: orders, error: ordersError },
    { data: divisions, error: divisionsError },
    { data: employees, error: employeesError },
    { data: clients, error: clientsError }, // Fetching clients is necessary here
    { data: time_entries, error: entriesError },
  ] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, order_number, client_id")
      .order("created_at", { ascending: false }),
    supabase.from("work_divisions").select("id, name"),
    supabase.from("employees").select("id, first_name, last_name"),
    supabase
      .from("clients")
      .select("id, first_name, last_name")
      .order("last_name"),
    supabase
      .from("time_entries")
      .select(
        `
        id, date_worked, hours_spent, notes,
        work_orders!inner(order_number),
        work_divisions!inner(name),
        employees!inner(first_name, last_name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (
    ordersError ||
    divisionsError ||
    employeesError ||
    entriesError ||
    clientsError
  ) {
    console.error(
      "Error fetching data:",
      ordersError ||
        divisionsError ||
        employeesError ||
        entriesError ||
        clientsError
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-6xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Daily Time Card Entry</h1>
        <TimeEntryClient
          orders={orders || []}
          divisions={divisions || []}
          employees={employees || []}
          clients={clients || []} // Passing the clients prop
          initialTimeEntries={time_entries || []}
        />
      </div>
    </div>
  );
}
