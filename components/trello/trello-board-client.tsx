// components/trello-board-client.tsx
"use client";

import { useState, useTransition } from "react";
// import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { TrelloCard } from "@/components/trello/trello-card";
import { TrelloList } from "@/components/trello/trello-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Plus } from "lucide-react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CardModal } from "@/components/trello/card-modal";
import { AddWorkOrderCard } from "@/components/add-work-order-card";
import {
  createList,
  createCard,
  updateCard,
} from "@/app/protected/board/actions";
import type { Board, Card, WorkOrder } from "@/lib/types";

interface TrelloBoardClientProps {
  initialBoard: Board;
  availableWorkOrders: WorkOrder[];
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
            <TrelloList
              key={list.id}
              list={list}
              onAddCard={handleAddCardToList}
            >
              <SortableContext
                items={list.cards.map((card) => card.id)}
                strategy={verticalListSortingStrategy}
              >
                {list.cards.map((card) => (
                  <TrelloCard
                    key={card.id}
                    card={card}
                    onCardClick={handleCardClick}
                  />
                ))}
              </SortableContext>
            </TrelloList>
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
