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
  const { data: orders } = await supabase.from("work_orders").select("id, order_number");
  const { data: divisions } = await supabase.from("work_divisions").select("id, name");

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-4xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Time Card Editor</h1>
        <TimeCardEditorClient
          employees={employees || []}
          orders={orders || []}
          divisions={divisions || []}
        />
      </div>
    </div>
  );
}