// app/protected/board/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { TrelloBoardClient } from "@/components/trello-board-client";
import {
  boards,
  lists,
  cards,
  labels,
  cardLabels,
  comments,
  attachments,
  checklists,
  checklistItems,
  workOrders,
  clients,
} from "@/lib/db/schema";

// Type definitions
type Label = typeof labels.$inferSelect;
type CardLabel = typeof cardLabels.$inferSelect & {
  label: Label;
};
type Comment = typeof comments.$inferSelect;
type Attachment = typeof attachments.$inferSelect;
type ChecklistItem = typeof checklistItems.$inferSelect;
type Checklist = typeof checklists.$inferSelect & {
  items: ChecklistItem[];
};
type WorkOrder = typeof workOrders.$inferSelect & {
  client: typeof clients.$inferSelect | null;
};
type Card = typeof cards.$inferSelect & {
  cardLabels: CardLabel[];
  comments: Comment[];
  attachments: Attachment[];
  checklists: Checklist[];
  workOrder: WorkOrder | null;
};
type List = typeof lists.$inferSelect & {
  cards: Card[];
};
type Board = typeof boards.$inferSelect & {
  lists: List[];
  labels: Label[];
};

export default async function BoardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Get or create default board
  let board = await db.query.boards.findFirst({
    where: (boards, { eq }) => eq(boards.isArchived, false),
    with: {
      lists: {
        where: (lists, { eq }) => eq(lists.isArchived, false),
        orderBy: (lists, { asc }) => [asc(lists.position)],
        with: {
          cards: {
            where: (cards, { eq }) => eq(cards.isArchived, false),
            orderBy: (cards, { asc }) => [asc(cards.position)],
            with: {
              cardLabels: {
                with: {
                  label: true,
                },
              },
              comments: {
                orderBy: (comments, { desc }) => [desc(comments.createdAt)],
              },
              attachments: {
                orderBy: (attachments, { desc }) => [
                  desc(attachments.createdAt),
                ],
              },
              checklists: {
                orderBy: (checklists, { asc }) => [asc(checklists.position)],
                with: {
                  items: {
                    orderBy: (checklistItems, { asc }) => [
                      asc(checklistItems.position),
                    ],
                  },
                },
              },
              workOrder: {
                with: {
                  client: true,
                },
              },
            },
          },
        },
      },
      labels: {
        orderBy: (labels, { asc }) => [asc(labels.name)],
      },
    },
  });

  // Create default board if none exists
  if (!board) {
    const [newBoard] = await db
      .insert(boards)
      .values({
        name: "Project Management Board",
        description: "Manage your work orders and projects",
      })
      .returning();

    // Create default lists
    await db.insert(lists).values([
      { boardId: newBoard.id, name: "Backlog", position: 0 },
      { boardId: newBoard.id, name: "In Progress", position: 1 },
      { boardId: newBoard.id, name: "Review", position: 2 },
      { boardId: newBoard.id, name: "Completed", position: 3 },
    ]);

    // Create default labels
    await db.insert(labels).values([
      { boardId: newBoard.id, name: "High Priority", color: "#ef4444" },
      { boardId: newBoard.id, name: "Medium Priority", color: "#f59e0b" },
      { boardId: newBoard.id, name: "Low Priority", color: "#10b981" },
      { boardId: newBoard.id, name: "Bug", color: "#dc2626" },
      { boardId: newBoard.id, name: "Feature", color: "#3b82f6" },
      { boardId: newBoard.id, name: "Documentation", color: "#8b5cf6" },
    ]);

    // Fetch the newly created board with all relations
    board = await db.query.boards.findFirst({
      where: (boards, { eq }) => eq(boards.id, newBoard.id),
      with: {
        lists: {
          where: (lists, { eq }) => eq(lists.isArchived, false),
          orderBy: (lists, { asc }) => [asc(lists.position)],
          with: {
            cards: {
              where: (cards, { eq }) => eq(cards.isArchived, false),
              orderBy: (cards, { asc }) => [asc(cards.position)],
              with: {
                cardLabels: {
                  with: {
                    label: true,
                  },
                },
                comments: {
                  orderBy: (comments, { desc }) => [desc(comments.createdAt)],
                },
                attachments: {
                  orderBy: (attachments, { desc }) => [
                    desc(attachments.createdAt),
                  ],
                },
                checklists: {
                  orderBy: (checklists, { asc }) => [asc(checklists.position)],
                  with: {
                    items: {
                      orderBy: (checklistItems, { asc }) => [
                        asc(checklistItems.position),
                      ],
                    },
                  },
                },
                workOrder: {
                  with: {
                    client: true,
                  },
                },
              },
            },
          },
        },
        labels: {
          orderBy: (labels, { asc }) => [asc(labels.name)],
        },
      },
    });
  }

  // Get all work orders for the "Add Order to Board" functionality
  const workOrders = await db.query.workOrders.findMany({
    with: {
      client: true,
    },
    orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
  });

  return (
    <div className="flex-1 w-full flex flex-col">
      <div className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Management Board</h1>
            <p className="text-muted-foreground">Manage your work orders.</p>
          </div>
        </div>
      </div>
      <TrelloBoardClient
        initialBoard={board as Board}
        availableWorkOrders={workOrders as WorkOrder[]}
      />
    </div>
  );
}
