"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare } from "lucide-react";
import type { Card } from "@/lib/types";

interface ChecklistManagerProps {
  card: Card;
  handleToggleChecklistItem: (itemId: number, isCompleted: boolean) => void;
  handleAddChecklistItem: (checklistId: number, text: string) => void;
}

export function ChecklistManager({
  card,
  handleToggleChecklistItem,
  handleAddChecklistItem,
}: ChecklistManagerProps) {
  const [newChecklistItems, setNewChecklistItems] = useState<{
    [key: number]: string;
  }>({});

  const onAddChecklistItem = (checklistId: number) => {
    const text = newChecklistItems[checklistId];
    if (text?.trim()) {
      handleAddChecklistItem(checklistId, text.trim());
      setNewChecklistItems((prev) => ({ ...prev, [checklistId]: "" }));
    }
  };

  return (
    <>
      {card.checklists.map((checklist) => (
        <div key={checklist.id}>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            {checklist.title}
            <span className="text-xs text-muted-foreground">
              {checklist.items.filter((item) => item.isCompleted).length}/
              {checklist.items.length}
            </span>
          </h3>
          <div className="space-y-2">
            {checklist.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Checkbox
                  checked={item.isCompleted || false}
                  onCheckedChange={(checked) =>
                    handleToggleChecklistItem(item.id, checked as boolean)
                  }
                />
                <span
                  className={`break-words flex-1 ${
                    item.isCompleted ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add an item"
                value={newChecklistItems[checklist.id] || ""}
                onChange={(e) =>
                  setNewChecklistItems((prev) => ({
                    ...prev,
                    [checklist.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") onAddChecklistItem(checklist.id);
                }}
                className="flex-1 min-w-0"
              />
              <Button
                size="sm"
                onClick={() => onAddChecklistItem(checklist.id)}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
