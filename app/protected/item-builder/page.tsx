import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ItemBuilderClient } from "@/components/item-builder-client";
import { desc } from "drizzle-orm";
import { items, assemblies, itemAssemblies } from "@/lib/db/schema";

// Types to match the component expectations
type AssemblyWithParent = typeof assemblies.$inferSelect & { parentAssembly?: { name: string } | null };
type ItemWithAssemblies = typeof items.$inferSelect & {
  itemAssemblies: (typeof itemAssemblies.$inferSelect & { assembly: AssemblyWithParent })[]
};

export default async function ItemBuilderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch all items, and for each item, fetch its associated assemblies
  const allItems = await db.query.items.findMany({
    orderBy: (items) => [desc(items.createdAt)],
    with: {
      itemAssemblies: {
        with: {
          assembly: { // This fetches the full assembly details for each association
            with: {
              parentAssembly: { columns: { name: true } } // Also get parent name for sub-assemblies
            }
          }
        }
      }
    }
  }) as ItemWithAssemblies[];

  const allAssemblies = await db.query.assemblies.findMany({
    orderBy: (assemblies) => [desc(assemblies.createdAt)],
    with: {
      parentAssembly: {
        columns: {
          name: true,
        },
      },
    },
  }) as AssemblyWithParent[];

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-6xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Item & Assembly Builder</h1>
        <ItemBuilderClient initialItems={allItems} initialAssemblies={allAssemblies} />
      </div>
    </div>
  );
}