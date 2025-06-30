// hooks/useRealtimeBoard.ts
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

type List = {
  id: number;
  boardId: number;
  name: string;
  position: number;
  isArchived: boolean | null;
  createdAt: string | null;
  cards: Card[];
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

type Label = {
  id: number;
  boardId: number;
  name: string;
  color: string;
  createdAt: string | null;
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

export function useRealtimeBoard(
  boardId: number,
  setBoard: React.Dispatch<React.SetStateAction<Board>>
) {
  const supabase = createClient();

  useEffect(() => {
    console.log(
      "useRealtimeBoard: Setting up real-time subscriptions for board",
      boardId
    );
    const channels: any[] = [];

    // Subscribe to card updates
    const cardChannel = supabase
      .channel(`cards-changes-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
        },
        (payload) => {
          console.log("Card change received:", payload);

          if (payload.eventType === "UPDATE") {
            const updatedCard = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) =>
                  card.id === updatedCard.id
                    ? { ...card, ...updatedCard }
                    : card
                ),
              })),
            }));
          } else if (payload.eventType === "INSERT") {
            const newCard = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) =>
                list.id === newCard.listId
                  ? {
                      ...list,
                      cards: [
                        ...list.cards,
                        {
                          ...newCard,
                          cardLabels: [],
                          comments: [],
                          attachments: [],
                          checklists: [],
                          workOrder: null,
                        } as Card,
                      ],
                    }
                  : list
              ),
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to checklist item updates
    const checklistItemChannel = supabase
      .channel(`checklist-items-changes-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checklist_items",
        },
        (payload) => {
          console.log("Checklist item change received:", payload);

          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => ({
                  ...card,
                  checklists: card.checklists.map((checklist) => ({
                    ...checklist,
                    items: checklist.items.map((item) =>
                      item.id === updatedItem.id
                        ? { ...item, ...updatedItem }
                        : item
                    ),
                  })),
                })),
              })),
            }));
          } else if (payload.eventType === "INSERT") {
            const newItem = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) => ({
                  ...card,
                  checklists: card.checklists.map((checklist) =>
                    checklist.id === newItem.checklistId
                      ? { ...checklist, items: [...checklist.items, newItem] }
                      : checklist
                  ),
                })),
              })),
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to comments
    const commentChannel = supabase
      .channel(`comments-changes-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        (payload) => {
          console.log("Comment change received:", payload);
          const newComment = payload.new as any;
          setBoard((prev) => ({
            ...prev,
            lists: prev.lists.map((list) => ({
              ...list,
              cards: list.cards.map((card) =>
                card.id === newComment.cardId
                  ? { ...card, comments: [newComment, ...card.comments] }
                  : card
              ),
            })),
          }));
        }
      )
      .subscribe();

    // Subscribe to checklists
    const checklistChannel = supabase
      .channel(`checklists-changes-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "checklists",
        },
        (payload) => {
          console.log("Checklist change received:", payload);
          const newChecklist = payload.new as any;
          setBoard((prev) => ({
            ...prev,
            lists: prev.lists.map((list) => ({
              ...list,
              cards: list.cards.map((card) =>
                card.id === newChecklist.cardId
                  ? {
                      ...card,
                      checklists: [
                        ...card.checklists,
                        { ...newChecklist, items: [] },
                      ],
                    }
                  : card
              ),
            })),
          }));
        }
      )
      .subscribe();

    // Subscribe to list updates
    const listChannel = supabase
      .channel(`lists-changes-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lists",
          filter: `boardId=eq.${boardId}`,
        },
        (payload) => {
          console.log("List change received:", payload);

          if (payload.eventType === "INSERT") {
            const newList = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: [
                ...prev.lists,
                {
                  ...newList,
                  cards: [],
                } as List,
              ],
            }));
          } else if (payload.eventType === "UPDATE") {
            const updatedList = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) =>
                list.id === updatedList.id ? { ...list, ...updatedList } : list
              ),
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedList = payload.old as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.filter((list) => list.id !== deletedList.id),
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to card labels
    const cardLabelChannel = supabase
      .channel(`card-labels-changes-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "card_labels",
        },
        (payload) => {
          console.log("Card label change received:", payload);

          if (payload.eventType === "INSERT") {
            const newCardLabel = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) =>
                  card.id === newCardLabel.cardId
                    ? {
                        ...card,
                        cardLabels: [
                          ...card.cardLabels,
                          {
                            ...newCardLabel,
                            label: prev.labels.find(
                              (l) => l.id === newCardLabel.labelId
                            ) || {
                              id: newCardLabel.labelId,
                              boardId: boardId,
                              name: "Unknown",
                              color: "#gray",
                              createdAt: null,
                            },
                          },
                        ],
                      }
                    : card
                ),
              })),
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedCardLabel = payload.old as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) =>
                  card.id === deletedCardLabel.cardId
                    ? {
                        ...card,
                        cardLabels: card.cardLabels.filter(
                          (cl) => cl.id !== deletedCardLabel.id
                        ),
                      }
                    : card
                ),
              })),
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to attachments
    const attachmentChannel = supabase
      .channel(`attachments-changes-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attachments",
        },
        (payload) => {
          console.log("Attachment change received:", payload);

          if (payload.eventType === "INSERT") {
            const newAttachment = payload.new as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) =>
                  card.id === newAttachment.cardId
                    ? {
                        ...card,
                        attachments: [newAttachment, ...card.attachments],
                      }
                    : card
                ),
              })),
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedAttachment = payload.old as any;
            setBoard((prev) => ({
              ...prev,
              lists: prev.lists.map((list) => ({
                ...list,
                cards: list.cards.map((card) =>
                  card.id === deletedAttachment.cardId
                    ? {
                        ...card,
                        attachments: card.attachments.filter(
                          (a) => a.id !== deletedAttachment.id
                        ),
                      }
                    : card
                ),
              })),
            }));
          }
        }
      )
      .subscribe();

    channels.push(
      cardChannel,
      checklistItemChannel,
      commentChannel,
      checklistChannel,
      listChannel,
      cardLabelChannel,
      attachmentChannel
    );

    // Log subscription status
    channels.forEach((channel, index) => {
      channel.subscribe((status: string) => {
        console.log(
          `useRealtimeBoard: Channel ${index} subscription status:`,
          status
        );
      });
    });

    console.log(
      "useRealtimeBoard: All channels set up, total:",
      channels.length
    );

    // Cleanup subscriptions
    return () => {
      console.log("useRealtimeBoard: Cleaning up subscriptions");
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [supabase, boardId, setBoard]);
}
