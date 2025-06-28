import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TimeCardEditorClient } from "@/components/time-card-editor-client";

export default async function EditTimeEntryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch data needed for the form dropdowns
  const { data: employees } = await supabase.from("employees").select("*");
  const { data: orders } = await supabase
    .from("work_orders")
    .select("id, order_number");
  const { data: divisions } = await supabase
    .from("work_divisions")
    .select("id, name");

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Edit Time Cards</h1>
        <p className="text-muted-foreground">
          Create and edit time card entries for employees with multiple work
          orders.
        </p>
      </div>
      <TimeCardEditorClient
        employees={employees || []}
        orders={orders || []}
        divisions={divisions || []}
      />
    </div>
  );
}
