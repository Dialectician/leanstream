"use client";

import { Input } from "@/components/ui/input";
import { DialogTitle } from "@/components/ui/dialog";
import type { Card } from "@/lib/types";

interface CardModalHeaderProps {
  card: Card;
  title: string;
  setTitle: (title: string) => void;
  handleUpdateTitle: () => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (isEditing: boolean) => void;
}

export function CardModalHeader({
  card,
  title,
  setTitle,
  handleUpdateTitle,
  isEditingTitle,
  setIsEditingTitle,
}: CardModalHeaderProps) {
  return (
    <div className="flex-1">
      {isEditingTitle ? (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleUpdateTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUpdateTitle();
            if (e.key === "Escape") {
              setTitle(card.title);
              setIsEditingTitle(false);
            }
          }}
          className="text-xl font-semibold w-full min-w-0"
          autoFocus
        />
      ) : (
        <DialogTitle
          className="text-2xl font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors text-gray-900 dark:text-gray-100 break-words"
          onClick={() => setIsEditingTitle(true)}
        >
          {card.title}
        </DialogTitle>
      )}
    </div>
  );
}
