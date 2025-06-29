// components/trello-board-client.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  createList,
  createCard,
  updateCard,
} from "@/app/protected/board/actions";

// Type definitions (matching the page.tsx types)
type Label = {
  id: number;
  boardId: number;
  name: string;
  color: string;
  createdAt: string | null;
};

type CardLabel = {
  id: number;
  cardId: number;
  labelId: number;
  label: Label;
};

type Comment = {
  id: number;
  cardId: number;
  content: string;
  authorName: string;
  createdAt: string | null;
};

type Attachment = {
  id: number;
  cardId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string | null;
};

type ChecklistItem = {
  id: number;
  checklistId: number;
  text: string;
  isCompleted: boolean | null;
  position: number;
  createdAt: string | null;
};

type Checklist = {
  id: number;
  cardId: number;
  title: string;
  position: number;
  createdAt: string | null;
  items: ChecklistItem[];
};

type WorkOrder = {
  id: number;
  orderNumber: string;
  status: string | null;
  dueDate: string | null;
  client: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

type Card = {
  id: number;
  listId: number;
  workOrderId: number | null;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  isArchived: boolean | null;
  createdAt: string | null;
  cardLabels: CardLabel[];
  comments: Comment[];
  attachments: Attachment[];
  checklists: Checklist[];
  workOrder: WorkOrder | null;
};

type List = {
  id: number;
  boardId: number;
  name: string;
  position: number;
  isArchived: boolean | null;
  createdAt: string | null;
  cards: Card[];
};

type Board = {
  id: number;
  name: string;
  description: string | null;
  backgroundColor: string | null;
  isArchived: boolean | null;
  createdAt: string | null;
  lists: List[];
  labels: Label[];
};

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
    <div key={list.id} className="w-72 flex-shrink-0">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{list.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit List
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                Archive List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          ref={setNodeRef}
          className={`space-y-2 mb-3 min-h-[100px] p-2 rounded border-2 border-dashed transition-colors ${
            isOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-transparent hover:border-gray-300"
          }`}
        >
          {children}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAddCard(list.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a card
        </Button>
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-gray-700 rounded-md p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onCardClick(card)}
    >
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{card.title}</h4>

        {card.workOrder && (
          <div className="text-xs text-muted-foreground">
            Order: {card.workOrder.orderNumber}
            {card.workOrder.client && (
              <span className="ml-1">
                ({card.workOrder.client.firstName}{" "}
                {card.workOrder.client.lastName})
              </span>
            )}
          </div>
        )}

        {card.cardLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.cardLabels.map((cardLabel) => (
              <Badge
                key={cardLabel.id}
                className="text-xs"
                style={{ backgroundColor: cardLabel.label.color }}
              >
                {cardLabel.label.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {card.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(card.dueDate).toLocaleDateString()}
            </div>
          )}
          {card.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {card.comments.length}
            </div>
          )}
          {card.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {card.attachments.length}
            </div>
          )}
          {card.checklists.length > 0 && (
            <div className="flex items-center gap-1">
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
        className="flex-1 overflow-x-auto p-4 min-h-screen w-full"
        style={{ backgroundColor: board.backgroundColor || "#0079bf" }}
      >
        <div className="flex gap-4 min-w-max">
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
          <div className="w-72 flex-shrink-0 space-y-3">
            <Button
              variant="ghost"
              className="w-full h-12 bg-white/20 hover:bg-white/30 text-white border-dashed border-2 border-white/30"
              onClick={() => setIsAddListModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add another list
            </Button>

            <Button
              variant="ghost"
              className="w-full h-12 bg-green-500/20 hover:bg-green-500/30 text-white border-dashed border-2 border-green-300/30"
              onClick={() => setIsAddWorkOrderModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
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
                <Label htmlFor="listName">List Name</Label>
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
                <Label htmlFor="cardTitle">Card Title</Label>
                <Input
                  id="cardTitle"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Enter card title..."
                />
              </div>
              <div>
                <Label htmlFor="workOrder">Link to Work Order (Optional)</Label>
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
        {selectedCard && (
          <CardModal
            card={selectedCard}
            board={board}
            onClose={() => setSelectedCard(null)}
            onUpdate={handleUpdateCard}
          />
        )}

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
            <div className="bg-white dark:bg-gray-700 rounded-md p-3 shadow-lg rotate-3 opacity-90">
              <h4 className="text-sm font-medium">{activeCard.title}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
