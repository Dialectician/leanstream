// components/trello-board-client.tsx
"use client";

import { useState, useTransition } from "react";
// import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Archive,
  Plus,
  Calendar,
  MessageSquare,
  Paperclip,
  CheckSquare,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CardModal } from "@/components/card-modal";
import { AddWorkOrderCard } from "@/components/add-work-order-card";
import Image from "next/image";
import {
  createList,
  createCard,
  updateCard,
} from "@/app/protected/board/actions";
import type { Board, List, Card, WorkOrder } from "@/lib/types";

interface TrelloBoardClientProps {
  initialBoard: Board;
  availableWorkOrders: WorkOrder[];
}

// Droppable List Component
function DroppableList({
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

// Sortable Card Component
function SortableCard({
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

export function TrelloBoardClient({
  initialBoard,
  availableWorkOrders,
}: TrelloBoardClientProps) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [isPending, startTransition] = useTransition();

  // Enable real-time updates - temporarily disabled for build
  // useRealtimeBoard(board.id, setBoard);

  // Drag and drop state
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Modal states
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isAddWorkOrderModalOpen, setIsAddWorkOrderModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  // Form states
  const [newListName, setNewListName] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(
    null
  );

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    startTransition(async () => {
      const result = await createList(
        board.id,
        newListName,
        board.lists.length
      );
      if (result.success && result.data) {
        setBoard((prev) => ({
          ...prev,
          lists: [...prev.lists, { ...result.data!, cards: [] }],
        }));
        setNewListName("");
        setIsAddListModalOpen(false);
      }
    });
  };

  const handleCreateCard = () => {
    if (!newCardTitle.trim() || !selectedListId) return;

    const targetList = board.lists.find((l) => l.id === selectedListId);
    if (!targetList) return;

    startTransition(async () => {
      const result = await createCard(
        selectedListId,
        newCardTitle,
        targetList.cards.length,
        selectedWorkOrderId
      );
      if (result.success && result.data) {
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((list) =>
            list.id === selectedListId
              ? {
                  ...list,
                  cards: [
                    ...list.cards,
                    {
                      ...result.data!,
                      cardLabels: [],
                      comments: [],
                      attachments: [],
                      checklists: [],
                      workOrder: selectedWorkOrderId
                        ? availableWorkOrders.find(
                            (wo) => wo.id === selectedWorkOrderId
                          ) || null
                        : null,
                    },
                  ],
                }
              : list
          ),
        }));
        setNewCardTitle("");
        setSelectedWorkOrderId(null);
        setIsAddCardModalOpen(false);
        setSelectedListId(null);
      }
    });
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  const handleAddCardToList = (listId: number) => {
    setSelectedListId(listId);
    setIsAddCardModalOpen(true);
  };

  const handleUpdateCard = (updatedCard: Card) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card
        ),
      })),
    }));
  };

  const handleWorkOrderCardCreated = (newCard: Card) => {
    setBoard((prev) => ({
      ...prev,
      lists: prev.lists.map((list) => {
        if (list.id === newCard.listId) {
          return {
            ...list,
            cards: [newCard, ...list.cards], // Add to beginning
          };
        }
        return list;
      }),
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = board.lists
      .flatMap((list) => list.cards)
      .find((card) => card.id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as number;
    const overListId = over.id as number;

    // Find the active card and its current list
    let activeCard: Card | null = null;
    let sourceListId: number | null = null;

    for (const list of board.lists) {
      const card = list.cards.find((c) => c.id === activeCardId);
      if (card) {
        activeCard = card;
        sourceListId = list.id;
        break;
      }
    }

    if (!activeCard || !sourceListId) return;

    // If dropping on the same list, do nothing for now
    if (sourceListId === overListId) return;

    // Move card to new list
    startTransition(async () => {
      const targetList = board.lists.find((l) => l.id === overListId);
      if (!targetList) return;

      const result = await updateCard(activeCardId, {
        listId: overListId,
        position: targetList.cards.length,
      });

      if (result.success) {
        setBoard((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => {
            if (list.id === sourceListId) {
              // Remove card from source list
              return {
                ...list,
                cards: list.cards.filter((c) => c.id !== activeCardId),
              };
            } else if (list.id === overListId) {
              // Add card to target list
              return {
                ...list,
                cards: [...list.cards, activeCard!],
              };
            }
            return list;
          }),
        }));
      }
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex-1 overflow-x-auto p-6 min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 board-scroll"
        style={{
          background: board.backgroundColor
            ? `linear-gradient(135deg, ${board.backgroundColor}22, ${board.backgroundColor}44)`
            : undefined,
        }}
      >
        {/* Board Statistics Header */}
        <div className="mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {board.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {board.description}
                </p>
              </div>

              {/* Board Stats */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {board.lists.reduce(
                      (acc, list) => acc + list.cards.length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Total Cards
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {board.lists.reduce(
                      (acc, list) =>
                        acc +
                        list.cards.filter((card) =>
                          card.checklists.some((checklist) =>
                            checklist.items.every((item) => item.isCompleted)
                          )
                        ).length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Completed
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {board.lists.reduce(
                      (acc, list) =>
                        acc +
                        list.cards.filter(
                          (card) =>
                            card.dueDate && new Date(card.dueDate) < new Date()
                        ).length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Overdue
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {board.lists.reduce(
                      (acc, list) =>
                        acc +
                        list.cards.filter((card) => card.workOrder).length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Work Orders
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/50 dark:bg-gray-800/50"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/50 dark:bg-gray-800/50"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 min-w-max pb-6">
          {board.lists.map((list) => (
            <DroppableList
              key={list.id}
              list={list}
              onAddCard={handleAddCardToList}
            >
              <SortableContext
                items={list.cards.map((card) => card.id)}
                strategy={verticalListSortingStrategy}
              >
                {list.cards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    onCardClick={handleCardClick}
                  />
                ))}
              </SortableContext>
            </DroppableList>
          ))}

          {/* Add List Button */}
          <div className="w-80 flex-shrink-0 space-y-4">
            <Button
              variant="ghost"
              className="w-full h-14 bg-white/80 hover:bg-white/90 text-gray-700 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              onClick={() => setIsAddListModalOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add another list
            </Button>

            <Button
              variant="ghost"
              className="w-full h-14 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-dashed border-emerald-300 hover:border-emerald-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              onClick={() => setIsAddWorkOrderModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Work Order
            </Button>
          </div>
        </div>

        {/* Add List Modal */}
        <Dialog open={isAddListModalOpen} onOpenChange={setIsAddListModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New List</DialogTitle>
              <DialogDescription>
                Create a new list to organize your cards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <UILabel htmlFor="listName">List Name</UILabel>
                <Input
                  id="listName"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddListModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateList} disabled={isPending}>
                Create List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Card Modal */}
        <Dialog open={isAddCardModalOpen} onOpenChange={setIsAddCardModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
              <DialogDescription>
                Create a new card in the selected list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <UILabel htmlFor="cardTitle">Card Title</UILabel>
                <Input
                  id="cardTitle"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Enter card title..."
                />
              </div>
              <div>
                <UILabel htmlFor="workOrder">
                  Link to Work Order (Optional)
                </UILabel>
                <select
                  id="workOrder"
                  className="w-full p-2 border rounded-md"
                  value={selectedWorkOrderId || ""}
                  onChange={(e) =>
                    setSelectedWorkOrderId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">No work order</option>
                  {availableWorkOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.client?.firstName}{" "}
                      {order.client?.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddCardModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCard} disabled={isPending}>
                Create Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Card Detail Modal */}
        {selectedCard &&
          (() => {
            // Find the current card data from the board state
            const currentCard = board.lists
              .flatMap((list) => list.cards)
              .find((card) => card.id === selectedCard.id);

            if (currentCard) {
              console.log(
                "TrelloBoardClient: Rendering CardModal with current card",
                {
                  cardId: currentCard.id,
                  title: currentCard.title,
                  commentsCount: currentCard.comments.length,
                  checklistsCount: currentCard.checklists.length,
                  attachmentsCount: currentCard.attachments.length,
                }
              );
            }

            return currentCard ? (
              <CardModal
                card={currentCard}
                board={board}
                onClose={() => setSelectedCard(null)}
                onUpdate={handleUpdateCard}
              />
            ) : null;
          })()}

        {/* Add Work Order Modal */}
        <AddWorkOrderCard
          isOpen={isAddWorkOrderModalOpen}
          onClose={() => setIsAddWorkOrderModalOpen(false)}
          availableWorkOrders={availableWorkOrders}
          lists={board.lists.map((list) => ({ id: list.id, name: list.name }))}
          onCardCreated={handleWorkOrderCardCreated}
        />

        <DragOverlay>
          {activeCard ? (
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-xl border border-gray-200 dark:border-gray-600 rotate-3 opacity-95 transform scale-105">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {activeCard.title}
              </h4>
              {activeCard.cardLabels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {activeCard.cardLabels.slice(0, 3).map((cardLabel) => (
                    <Badge
                      key={cardLabel.id}
                      className="text-xs px-2 py-1 font-medium border-0"
                      style={{
                        backgroundColor: cardLabel.label.color,
                        color: "#ffffff",
                      }}
                    >
                      {cardLabel.label.name}
                    </Badge>
                  ))}
                  {activeCard.cardLabels.length > 3 && (
                    <Badge className="text-xs px-2 py-1 bg-gray-200 text-gray-600">
                      +{activeCard.cardLabels.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
