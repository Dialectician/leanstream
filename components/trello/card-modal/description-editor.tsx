"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Card } from "@/lib/types";

interface DescriptionEditorProps {
  card: Card;
  description: string;
  setDescription: (description: string) => void;
  handleUpdateDescription: () => void;
}

export function DescriptionEditor({
  card,
  description,
  setDescription,
  handleUpdateDescription,
}: DescriptionEditorProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Description</h3>
      {isEditingDescription ? (
        <div className="space-y-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description..."
            rows={4}
            className="w-full min-w-0 resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                handleUpdateDescription();
                setIsEditingDescription(false);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDescription(card.description || "");
                setIsEditingDescription(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="min-h-[60px] p-3 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words"
          onClick={() => setIsEditingDescription(true)}
        >
          {card.description || "Add a more detailed description..."}
        </div>
      )}
    </div>
  );
}
