// components/trello-card.tsx
"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, Paperclip, CheckSquare } from "lucide-react";

// Sortable Card Component
export function TrelloCard({
  card,
  onCardClick,
}: {
  card: Card;
  onCardClick: (card: Card) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get the cover image (first image attachment)
  const coverImage = card.attachments.find((att) =>
    att.mimeType?.startsWith("image/")
  );

  // Format due date with status
  const getDueDateStatus = () => {
    if (!card.dueDate) return null;
    const dueDate = new Date(card.dueDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0)
      return { status: "overdue", text: "Overdue", color: "bg-red-500" };
    if (diffDays === 0)
      return { status: "today", text: "Due Today", color: "bg-orange-500" };
    if (diffDays <= 3)
      return {
        status: "soon",
        text: `Due in ${diffDays} days`,
        color: "bg-yellow-500",
      };
    return {
      status: "future",
      text: new Date(card.dueDate).toLocaleDateString(),
      color: "bg-gray-500",
    };
  };

  const dueDateStatus = getDueDateStatus();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 group overflow-hidden"
      onClick={() => onCardClick(card)}
    >
      {/* Cover Image */}
      {coverImage && (
        <div className="h-24 bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
          <Image
            src={coverImage.fileUrl}
            alt="Card cover"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Card Labels */}
        {card.cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.cardLabels.slice(0, 3).map((cardLabel) => (
              <Badge
                key={cardLabel.id}
                className="text-xs px-2 py-1 font-medium border-0 text-white"
                style={{ backgroundColor: cardLabel.label.color }}
              >
                {cardLabel.label.name}
              </Badge>
            ))}
            {card.cardLabels.length > 3 && (
              <Badge className="text-xs px-2 py-1 bg-gray-200 text-gray-600">
                +{card.cardLabels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Card Title */}
        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
          {card.workOrder ? (
            <>
              <span className="text-blue-600 dark:text-blue-400">
                #{card.workOrder.orderNumber}
              </span>
              {card.workOrder.client && (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block">
                  {card.workOrder.client.firstName}{" "}
                  {card.workOrder.client.lastName}
                </span>
              )}
            </>
          ) : (
            card.title
          )}
        </h4>

        {/* Work Order Details */}
        {card.workOrder && (
          <div className="space-y-2">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs px-2 py-1 font-medium ${
                  card.workOrder.status === "Completed"
                    ? "bg-green-100 text-green-800"
                    : card.workOrder.status === "In Progress"
                    ? "bg-blue-100 text-blue-800"
                    : card.workOrder.status === "On Hold"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {card.workOrder.status || "Planned"}
              </Badge>
              {card.workOrder.quantity && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Qty: {card.workOrder.quantity}
                </span>
              )}
            </div>

            {/* Items and Assemblies */}
            {card.workOrder.workOrderItems &&
              card.workOrder.workOrderItems.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Items ({card.workOrder.workOrderItems.length})
                  </div>
                  <div className="space-y-2">
                    {card.workOrder.workOrderItems.slice(0, 1).map((item) => (
                      <div key={item.id} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.item.name}
                          </span>
                          <span className="text-gray-500 text-xs">
                            ×{item.quantity}
                          </span>
                        </div>
                        {item.selectedAssemblies.length > 0 && (
                          <div className="text-gray-600 dark:text-gray-400 mt-1">
                            {item.selectedAssemblies.length} assemblies
                          </div>
                        )}
                      </div>
                    ))}
                    {card.workOrder.workOrderItems.length > 1 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
                        +{card.workOrder.workOrderItems.length - 1} more items
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Due Date */}
        {dueDateStatus && (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${dueDateStatus.color}`}
            >
              <Calendar className="h-3 w-3" />
              {dueDateStatus.text}
            </div>
          </div>
        )}

        {/* Card Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {card.comments.length > 0 && (
              <div className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <MessageSquare className="h-3 w-3" />
                {card.comments.length}
              </div>
            )}
            {card.attachments.length > 0 && (
              <div className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <Paperclip className="h-3 w-3" />
                {card.attachments.length}
              </div>
            )}
            {card.checklists.length > 0 && (
              <div className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <CheckSquare className="h-3 w-3" />
                {card.checklists.reduce(
                  (acc, checklist) =>
                    acc +
                    checklist.items.filter((item) => item.isCompleted).length,
                  0
                )}
                /
                {card.checklists.reduce(
                  (acc, checklist) => acc + checklist.items.length,
                  0
                )}
              </div>
            )}
          </div>

          {/* Progress indicator for work orders */}
          {card.workOrder && card.checklists.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{
                    width: `${
                      (card.checklists.reduce(
                        (acc, checklist) =>
                          acc +
                          checklist.items.filter((item) => item.isCompleted)
                            .length,
                        0
                      ) /
                        Math.max(
                          1,
                          card.checklists.reduce(
                            (acc, checklist) => acc + checklist.items.length,
                            0
                          )
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
