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

  // Fetch divisions and their parent division names separately
  const { data: divisions, error } = await supabase
    .from("work_divisions")
    .select("*");

  // If we have divisions, fetch parent division names
  let divisionsWithParents = divisions;
  if (divisions && divisions.length > 0) {
    const parentIds = divisions
      .filter((d) => d.parent_division_id)
      .map((d) => d.parent_division_id);

    if (parentIds.length > 0) {
      const { data: parentDivisions } = await supabase
        .from("work_divisions")
        .select("id, name")
        .in("id", parentIds);

      // Map parent names to divisions
      divisionsWithParents = divisions.map((division) => ({
        ...division,
        parent:
          parentDivisions?.find((p) => p.id === division.parent_division_id) ||
          null,
      }));
    }
  }

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
      <WorkDivisionsClient divisions={divisionsWithParents || []} />
    </div>
  );
}
