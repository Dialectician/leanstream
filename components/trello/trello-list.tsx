// components/trello-list.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { List } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Archive, Plus } from "lucide-react";

// Droppable List Component
export function TrelloList({
  list,
  children,
  onAddCard,
}: {
  list: List;
  children: React.ReactNode;
  onAddCard: (listId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
  });

  return (
    <div key={list.id} className="w-[320px] flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
              {list.name}
            </h3>
            <Badge
              variant="secondary"
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              {list.cards.length}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit List
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Archive className="mr-2 h-4 w-4" />
                Archive List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          ref={setNodeRef}
          className={`space-y-3 mb-4 min-h-[80px] p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
            isOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-inner"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          {children}
        </div>

        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 border border-transparent"
            onClick={() => onAddCard(list.id)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a card
          </Button>

          {/* Quick Add Templates */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              onClick={() => onAddCard(list.id)}
              title="Add from template"
            >
              <svg
                className="mr-1 h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
