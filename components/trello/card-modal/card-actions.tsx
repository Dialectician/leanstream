"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tag, CheckSquare, Paperclip } from "lucide-react";
import type { Board, Card } from "@/lib/types";

interface CardActionsProps {
  card: Card;
  board: Board;
  handleToggleLabel: (labelId: number) => void;
  handleAddChecklist: (title: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingAttachment: boolean;
}

export function CardActions({
  card,
  board,
  handleToggleLabel,
  handleAddChecklist,
  handleFileUpload,
  isUploadingAttachment,
}: CardActionsProps) {
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  const onAddChecklist = () => {
    if (newChecklistTitle.trim()) {
      handleAddChecklist(newChecklistTitle.trim());
      setNewChecklistTitle("");
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Add to card</h3>
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Tag className="mr-2 h-4 w-4" />
              Labels
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {board.labels.map((label) => (
              <DropdownMenuItem
                key={label.id}
                onClick={() => handleToggleLabel(label.id)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                  {card.cardLabels.some((cl) => cl.labelId === label.id) && (
                    <CheckSquare className="ml-auto h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex gap-2">
          <Input
            placeholder="Checklist title"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAddChecklist();
            }}
            className="flex-1 min-w-0"
          />
          <Button size="sm" onClick={onAddChecklist}>
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploadingAttachment}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isUploadingAttachment}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            {isUploadingAttachment ? "Uploading..." : "Attachment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
