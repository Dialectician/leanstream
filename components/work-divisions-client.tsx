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

// Define the type for a division, including the optional parent name
type Division = {
  id: number;
  name: string;
  description: string | null;
  parent_division_id: number | null;
  parent: { name: string } | null;
};

interface WorkDivisionsClientProps {
  divisions: Division[];
}

export function WorkDivisionsClient({
  divisions: initialDivisions,
}: WorkDivisionsClientProps) {
  const supabase = createClient();
  const [divisions, setDivisions] = useState<Division[]>(initialDivisions);
  const [newDivisionName, setNewDivisionName] = useState("");
  const [newDivisionDescription, setNewDivisionDescription] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data: newDivision, error: insertError } = await supabase
      .from("work_divisions")
      .insert({
        name: newDivisionName,
        description: newDivisionDescription,
        parent_division_id: newParentId ? parseInt(newParentId, 10) : null,
      })
      .select("*")
      .single();

    // If we have a new division and it has a parent, fetch the parent name
    let divisionWithParent = newDivision;
    if (newDivision && newDivision.parent_division_id) {
      const { data: parentDivision } = await supabase
        .from("work_divisions")
        .select("id, name")
        .eq("id", newDivision.parent_division_id)
        .single();

      divisionWithParent = {
        ...newDivision,
        parent: parentDivision || null,
      };
    }

    if (insertError) {
      setError(insertError.message);
    } else if (divisionWithParent) {
      setDivisions([...divisions, divisionWithParent]);
      setNewDivisionName("");
      setNewDivisionDescription("");
      setNewParentId("");
    }

    setIsLoading(false);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Division</CardTitle>
          <CardDescription>
            Create a new top-level division or a sub-division.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDivision} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Division Name</Label>
              <Input
                id="name"
                placeholder="e.g., Assembly"
                value={newDivisionName}
                onChange={(e) => setNewDivisionName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={newDivisionDescription}
                onChange={(e) => setNewDivisionDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Division (optional)</Label>
              <select
                id="parent"
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
              >
                <option value="">None (Top-Level)</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading ? "Adding..." : "Add Division"}
            </Button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Divisions</CardTitle>
          <CardDescription>
            A list of all work divisions in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {divisions.map((div) => (
              <li
                key={div.id}
                className="flex justify-between items-center p-2 border rounded-md"
              >
                <div>
                  <p className="font-medium">{div.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {div.parent
                      ? `Sub-division of: ${div.parent.name}`
                      : "Top-Level"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
