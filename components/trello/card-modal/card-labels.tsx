"use client";

import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import type { Card } from "@/lib/types";

interface CardLabelsProps {
  cardLabels: Card["cardLabels"];
}

export function CardLabels({ cardLabels }: CardLabelsProps) {
  if (cardLabels.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Labels
      </h3>
      <div className="flex flex-wrap gap-2">
        {cardLabels.map((cardLabel) => (
          <Badge
            key={cardLabel.id}
            style={{ backgroundColor: cardLabel.label.color }}
            className="text-white"
          >
            {cardLabel.label.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
