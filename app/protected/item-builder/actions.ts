"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
// Add `itemAssemblies` to this import statement
import { items, assemblies, itemAssemblies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Adds a new Item to the database.
 */
export async function addItem(formData: FormData) {
  const newItemData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
  };

  if (!newItemData.name) {
    return { success: false, message: "Item name is required.", data: null };
  }

  try {
    const [newItem] = await db.insert(items).values(newItemData).returning();
    revalidatePath("/protected/item-builder");
    return { success: true, message: "Item added successfully.", data: newItem };
  } catch (error: any) {
    return { success: false, message: error.message, data: null };
  }
}

/**
 * Adds a new Assembly to the database.
 */
export async function addAssembly(formData: FormData) {
  const parentId = formData.get("parentAssemblyId");
  const newAssemblyData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    parentAssemblyId: parentId ? Number(parentId) : null,
  };

  if (!newAssemblyData.name) {
    return { success: false, message: "Assembly name is required.", data: null };
  }

  try {
    // Insert the new assembly
    const [newAssembly] = await db.insert(assemblies).values(newAssemblyData).returning();

    // Re-fetch the new assembly with its parent's name to return to the client
    const newAssemblyWithParent = await db.query.assemblies.findFirst({
        where: eq(assemblies.id, newAssembly.id),
        with: {
            parentAssembly: { columns: { name: true } }
        }
    });

    revalidatePath("/protected/item-builder");
    return { success: true, message: "Assembly added successfully.", data: newAssemblyWithParent };
  } catch (error: any) {
    return { success: false, message: error.message, data: null };
  }
}

/**
 * Associates an assembly with an item.
 */
export async function associateAssemblyWithItem(itemId: number, assemblyId: number) {
  if (!itemId || !assemblyId) {
    return { success: false, message: "Item ID and Assembly ID are required." };
  }

  try {
    // This line will now work correctly because `itemAssemblies` is imported.
    await db.insert(itemAssemblies).values({ itemId, assemblyId });
    revalidatePath("/protected/item-builder");
    return { success: true, message: "Assembly associated successfully." };
  } catch (error: any) {
    // Handle potential unique constraint errors, e.g., if the link already exists
    if (error.code === '23505') { // unique_violation
        return { success: false, message: "This assembly is already associated with this item."};
    }
    return { success: false, message: error.message };
  }
}