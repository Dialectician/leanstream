"use client";

import { Calendar, CheckSquare } from "lucide-react";
import type { Card } from "@/lib/types";

interface CardInfoProps {
  card: Card;
}

export function CardInfo({ card }: CardInfoProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  const getTotalChecklistItems = () => {
    return card.checklists.reduce(
      (acc, checklist) => acc + checklist.items.length,
      0
    );
  };

  const getCompletedChecklistItems = () => {
    return card.checklists.reduce(
      (acc, checklist) =>
        acc + checklist.items.filter((item) => item.isCompleted).length,
      0
    );
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Card Info</h3>
      <div className="space-y-2 text-xs text-muted-foreground">
        <div>Created: {formatDate(card.createdAt)}</div>
        {card.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due: {formatDate(card.dueDate)}
          </div>
        )}
        {getTotalChecklistItems() > 0 && (
          <div className="flex items-center gap-1">
            <CheckSquare className="h-3 w-3" />
            Checklist: {getCompletedChecklistItems()}/{getTotalChecklistItems()}
          </div>
        )}
      </div>
    </div>
  );
}
