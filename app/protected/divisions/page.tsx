import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkDivisionsClient } from "@/components/work-divisions-client";

export default async function DivisionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: divisions, error } = await supabase
    .from("work_divisions")
    .select(`*, parent:parent_division_id ( name )`);

  if (error) {
    console.error("Error fetching divisions:", error);
    // Handle error appropriately
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Work Divisions</h1>
        <p className="text-muted-foreground">
          Organize your manufacturing operations into divisions and departments.
        </p>
      </div>
      <WorkDivisionsClient divisions={divisions || []} />
    </div>
  );
}
