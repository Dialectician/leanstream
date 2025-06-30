"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import type { Card } from "@/lib/types";

interface DueDateManagerProps {
  card: Card;
  dueDate: string;
  setDueDate: (date: string) => void;
  handleUpdateDueDate: () => void;
}

export function DueDateManager({
  card,
  dueDate,
  setDueDate,
  handleUpdateDueDate,
}: DueDateManagerProps) {
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Due Date
      </h3>
      {isEditingDueDate ? (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <Label className="text-sm font-medium">Due Date & Time</Label>
          <div className="relative w-full">
            <DatePicker
              selected={dueDate ? new Date(dueDate) : null}
              onChange={(date) => setDueDate(date ? date.toISOString() : "")}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMM d, yyyy h:mm aa"
              placeholderText="Select due date and time"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              calendarClassName="shadow-lg border border-gray-200 dark:border-gray-600 rounded-lg"
              popperClassName="z-50"
              popperPlacement="bottom-start"
              isClearable
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                handleUpdateDueDate();
                setIsEditingDueDate(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Save Date
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDueDate(card.dueDate || "");
                setIsEditingDueDate(false);
              }}
            >
              Cancel
            </Button>
            {card.dueDate && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setDueDate("");
                  handleUpdateDueDate();
                  setIsEditingDueDate(false);
                }}
              >
                Remove Date
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="p-3 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setIsEditingDueDate(true)}
        >
          {card.dueDate ? (
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {new Date(card.dueDate).toLocaleDateString()}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(card.dueDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              Set Due Date
            </span>
          )}
        </div>
      )}
    </div>
  );
}
