// app/protected/board/actions.ts
"use server";

import { db } from "@/lib/db";
import {
  lists,
  cards,
  comments,
  checklists,
  checklistItems,
  cardLabels,
  labels,
  attachments,
  workOrders, // eslint-disable-line @typescript-eslint/no-unused-vars
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// List Actions
export async function createList(
  boardId: number,
  name: string,
  position: number
) {
  try {
    const [newList] = await db
      .insert(lists)
      .values({
        boardId,
        name,
        position,
      })
      .returning();

    return { success: true, data: newList };
  } catch (error) {
    console.error("Error creating list:", error);
    return { success: false, message: "Failed to create list" };
  }
}

export async function updateList(
  listId: number,
  updates: { name?: string; position?: number }
) {
  try {
    const [updatedList] = await db
      .update(lists)
      .set(updates)
      .where(eq(lists.id, listId))
      .returning();

    return { success: true, data: updatedList };
  } catch (error) {
    console.error("Error updating list:", error);
    return { success: false, message: "Failed to update list" };
  }
}

export async function deleteList(listId: number) {
  try {
    await db.delete(lists).where(eq(lists.id, listId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting list:", error);
    return { success: false, message: "Failed to delete list" };
  }
}

// Card Actions
export async function createCard(
  listId: number,
  title: string,
  position: number,
  workOrderId?: number | null
) {
  try {
    let dueDate = null;

    // If a work order is linked, inherit its due date
    if (workOrderId) {
      const workOrder = await db.query.workOrders.findFirst({
        where: (workOrders, { eq }) => eq(workOrders.id, workOrderId),
      });
      if (workOrder?.dueDate) {
        dueDate = workOrder.dueDate;
      }
    }

    const [newCard] = await db
      .insert(cards)
      .values({
        listId,
        title,
        position,
        workOrderId: workOrderId || null,
        dueDate,
      })
      .returning();

    return { success: true, data: newCard };
  } catch (error) {
    console.error("Error creating card:", error);
    return { success: false, message: "Failed to create card" };
  }
}

export async function updateCard(
  cardId: number,
  updates: {
    title?: string;
    description?: string;
    position?: number;
    listId?: number;
    dueDate?: string | null;
  }
) {
  try {
    const [updatedCard] = await db
      .update(cards)
      .set(updates)
      .where(eq(cards.id, cardId))
      .returning();

    return { success: true, data: updatedCard };
  } catch (error) {
    console.error("Error updating card:", error);
    return { success: false, message: "Failed to update card" };
  }
}

export async function deleteCard(cardId: number) {
  try {
    await db.delete(cards).where(eq(cards.id, cardId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting card:", error);
    return { success: false, message: "Failed to delete card" };
  }
}

export async function moveCard(
  cardId: number,
  newListId: number,
  newPosition: number
) {
  try {
    const [movedCard] = await db
      .update(cards)
      .set({ listId: newListId, position: newPosition })
      .where(eq(cards.id, cardId))
      .returning();

    return { success: true, data: movedCard };
  } catch (error) {
    console.error("Error moving card:", error);
    return { success: false, message: "Failed to move card" };
  }
}

// Comment Actions
export async function addComment(
  cardId: number,
  content: string,
  authorName: string = "User"
) {
  try {
    const [newComment] = await db
      .insert(comments)
      .values({
        cardId,
        content,
        authorName,
      })
      .returning();

    return { success: true, data: newComment };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, message: "Failed to add comment" };
  }
}

export async function updateComment(commentId: number, content: string) {
  try {
    const [updatedComment] = await db
      .update(comments)
      .set({ content })
      .where(eq(comments.id, commentId))
      .returning();

    return { success: true, data: updatedComment };
  } catch (error) {
    console.error("Error updating comment:", error);
    return { success: false, message: "Failed to update comment" };
  }
}

export async function deleteComment(commentId: number) {
  try {
    await db.delete(comments).where(eq(comments.id, commentId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, message: "Failed to delete comment" };
  }
}

// Checklist Actions
export async function addChecklist(cardId: number, title: string) {
  try {
    const [newChecklist] = await db
      .insert(checklists)
      .values({
        cardId,
        title,
        position: 0,
      })
      .returning();

    return { success: true, data: newChecklist };
  } catch (error) {
    console.error("Error adding checklist:", error);
    return { success: false, message: "Failed to add checklist" };
  }
}

export async function updateChecklist(checklistId: number, title: string) {
  try {
    const [updatedChecklist] = await db
      .update(checklists)
      .set({ title })
      .where(eq(checklists.id, checklistId))
      .returning();

    return { success: true, data: updatedChecklist };
  } catch (error) {
    console.error("Error updating checklist:", error);
    return { success: false, message: "Failed to update checklist" };
  }
}

export async function deleteChecklist(checklistId: number) {
  try {
    await db.delete(checklists).where(eq(checklists.id, checklistId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting checklist:", error);
    return { success: false, message: "Failed to delete checklist" };
  }
}

// Checklist Item Actions
export async function addChecklistItem(
  checklistId: number,
  text: string,
  position: number
) {
  try {
    const [newItem] = await db
      .insert(checklistItems)
      .values({
        checklistId,
        text,
        position,
        isCompleted: false,
      })
      .returning();

    return { success: true, data: newItem };
  } catch (error) {
    console.error("Error adding checklist item:", error);
    return { success: false, message: "Failed to add checklist item" };
  }
}

export async function updateChecklistItem(
  itemId: number,
  updates: { text?: string; isCompleted?: boolean; position?: number }
) {
  try {
    const [updatedItem] = await db
      .update(checklistItems)
      .set(updates)
      .where(eq(checklistItems.id, itemId))
      .returning();

    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("Error updating checklist item:", error);
    return { success: false, message: "Failed to update checklist item" };
  }
}

export async function deleteChecklistItem(itemId: number) {
  try {
    await db.delete(checklistItems).where(eq(checklistItems.id, itemId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return { success: false, message: "Failed to delete checklist item" };
  }
}

// Label Actions
export async function toggleCardLabel(cardId: number, labelId: number) {
  try {
    // Check if the card already has this label
    const existingCardLabel = await db.query.cardLabels.findFirst({
      where: and(
        eq(cardLabels.cardId, cardId),
        eq(cardLabels.labelId, labelId)
      ),
    });

    if (existingCardLabel) {
      // Remove the label
      await db
        .delete(cardLabels)
        .where(eq(cardLabels.id, existingCardLabel.id));
      return { success: true, action: "removed" };
    } else {
      // Add the label
      const [newCardLabel] = await db
        .insert(cardLabels)
        .values({
          cardId,
          labelId,
        })
        .returning();
      return { success: true, action: "added", data: newCardLabel };
    }
  } catch (error) {
    console.error("Error toggling card label:", error);
    return { success: false, message: "Failed to toggle card label" };
  }
}

export async function createLabel(
  boardId: number,
  name: string,
  color: string
) {
  try {
    const [newLabel] = await db
      .insert(labels)
      .values({
        boardId,
        name,
        color,
      })
      .returning();

    return { success: true, data: newLabel };
  } catch (error) {
    console.error("Error creating label:", error);
    return { success: false, message: "Failed to create label" };
  }
}

export async function updateLabel(
  labelId: number,
  updates: { name?: string; color?: string }
) {
  try {
    const [updatedLabel] = await db
      .update(labels)
      .set(updates)
      .where(eq(labels.id, labelId))
      .returning();

    return { success: true, data: updatedLabel };
  } catch (error) {
    console.error("Error updating label:", error);
    return { success: false, message: "Failed to update label" };
  }
}

export async function deleteLabel(labelId: number) {
  try {
    await db.delete(labels).where(eq(labels.id, labelId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting label:", error);
    return { success: false, message: "Failed to delete label" };
  }
}

// Attachment Actions
export async function addAttachment(
  cardId: number,
  fileName: string,
  fileUrl: string,
  fileSize?: number,
  mimeType?: string
) {
  try {
    const [newAttachment] = await db
      .insert(attachments)
      .values({
        cardId,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
      })
      .returning();

    return { success: true, data: newAttachment };
  } catch (error) {
    console.error("Error adding attachment:", error);
    return { success: false, message: "Failed to add attachment" };
  }
}

export async function deleteAttachment(attachmentId: number) {
  try {
    await db.delete(attachments).where(eq(attachments.id, attachmentId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return { success: false, message: "Failed to delete attachment" };
  }
}
