// components/trello/card-modal.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  updateCard,
  addComment,
  addChecklist,
  updateChecklistItem,
  addChecklistItem,
  toggleCardLabel,
  addAttachment,
  deleteAttachment,
} from "@/app/protected/board/actions";
import type { Board, Card } from "@/lib/types";

import { CardModalHeader } from "./card-modal/card-modal-header";
import { WorkOrderDetails } from "./card-modal/work-order-details";
import { CardLabels } from "./card-modal/card-labels";
import { DueDateManager } from "./card-modal/due-date-manager";
import { DescriptionEditor } from "./card-modal/description-editor";
import { ChecklistManager } from "./card-modal/checklist-manager";
import { AttachmentManager } from "./card-modal/attachment-manager";
import { ActivityFeed } from "./card-modal/activity-feed";
import { CardActions } from "./card-modal/card-actions";
import { CardInfo } from "./card-modal/card-info";

interface CardModalProps {
  card: Card;
  board: Board;
  onClose: () => void;
  onUpdate: (updatedCard: Card) => void;
}

export function CardModal({ card, board, onClose, onUpdate }: CardModalProps) {
  const [, startTransition] = useTransition();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [newComment, setNewComment] = useState("");
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitle(card.title);
    }
    setDescription(card.description || "");
    setDueDate(card.dueDate || "");
  }, [card, isEditingTitle]);

  const handleUpdateTitle = () => {
    if (title.trim() === card.title) {
      setIsEditingTitle(false);
      return;
    }
    startTransition(async () => {
      const result = await updateCard(card.id, { title: title.trim() });
      if (result.success && result.data) {
        onUpdate({ ...card, title: title.trim() });
        setIsEditingTitle(false);
      }
    });
  };

  const handleUpdateDescription = () => {
    if (description === (card.description || "")) {
      return;
    }
    startTransition(async () => {
      const result = await updateCard(card.id, { description });
      if (result.success && result.data) {
        onUpdate({ ...card, description });
      }
    });
  };

  const handleUpdateDueDate = () => {
    if (dueDate === (card.dueDate || "")) {
      return;
    }
    const previousDueDate = card.dueDate;
    onUpdate({ ...card, dueDate: dueDate || null });
    startTransition(async () => {
      const result = await updateCard(card.id, { dueDate: dueDate || null });
      if (!result.success) {
        onUpdate({ ...card, dueDate: previousDueDate });
        setDueDate(previousDueDate || "");
      }
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      const result = await addComment(card.id, newComment.trim());
      if (result.success && result.data) {
        const updatedCard = {
          ...card,
          comments: [result.data, ...card.comments],
        };
        onUpdate(updatedCard);
        setNewComment("");
      }
    });
  };

  const handleAddChecklist = (checklistTitle: string) => {
    if (!checklistTitle.trim()) return;
    startTransition(async () => {
      const result = await addChecklist(card.id, checklistTitle.trim());
      if (result.success && result.data) {
        const updatedCard = {
          ...card,
          checklists: [...card.checklists, { ...result.data, items: [] }],
        };
        onUpdate(updatedCard);
      }
    });
  };

  const handleToggleChecklistItem = (itemId: number, isCompleted: boolean) => {
    const updatedCard = {
      ...card,
      checklists: card.checklists.map((checklist) => ({
        ...checklist,
        items: checklist.items.map((item) =>
          item.id === itemId ? { ...item, isCompleted } : item
        ),
      })),
    };
    onUpdate(updatedCard);
    startTransition(async () => {
      const result = await updateChecklistItem(itemId, { isCompleted });
      if (!result.success) {
        onUpdate(card); // Revert on failure
      }
    });
  };

  const handleAddChecklistItem = (checklistId: number, text: string) => {
    const checklist = card.checklists.find((c) => c.id === checklistId);
    if (!checklist) return;
    startTransition(async () => {
      const result = await addChecklistItem(
        checklistId,
        text,
        checklist.items.length
      );
      if (result.success && result.data) {
        const updatedCard = {
          ...card,
          checklists: card.checklists.map((c) =>
            c.id === checklistId
              ? { ...c, items: [...c.items, result.data!] }
              : c
          ),
        };
        onUpdate(updatedCard);
      }
    });
  };

  const handleToggleLabel = (labelId: number) => {
    startTransition(async () => {
      const result = await toggleCardLabel(card.id, labelId);
      if (result.success) {
        // The parent component will receive the real-time update
      }
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    setIsUploadingAttachment(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileUrl = e.target?.result as string;
        const result = await addAttachment(
          card.id,
          file.name,
          fileUrl,
          file.size,
          file.type
        );
        if (result.success && result.data) {
          onUpdate({
            ...card,
            attachments: [result.data, ...card.attachments],
          });
        }
        setIsUploadingAttachment(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    startTransition(async () => {
      const result = await deleteAttachment(attachmentId);
      if (result.success) {
        onUpdate({
          ...card,
          attachments: card.attachments.filter((a) => a.id !== attachmentId),
        });
      }
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-xl max-h-[95vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900 border-0 shadow-2xl p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardModalHeader
                card={card}
                title={title}
                setTitle={setTitle}
                handleUpdateTitle={handleUpdateTitle}
                isEditingTitle={isEditingTitle}
                setIsEditingTitle={setIsEditingTitle}
              />
              <WorkOrderDetails workOrder={card.workOrder} />
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 min-w-0 w-full">
          <div className="xl:col-span-3 space-y-6 min-w-0">
            <CardLabels cardLabels={card.cardLabels} />
            <DueDateManager
              card={card}
              dueDate={dueDate}
              setDueDate={setDueDate}
              handleUpdateDueDate={handleUpdateDueDate}
            />
            <DescriptionEditor
              card={card}
              description={description}
              setDescription={setDescription}
              handleUpdateDescription={handleUpdateDescription}
            />
            <ChecklistManager
              card={card}
              handleToggleChecklistItem={handleToggleChecklistItem}
              handleAddChecklistItem={handleAddChecklistItem}
            />
            <AttachmentManager
              card={card}
              handleDeleteAttachment={handleDeleteAttachment}
            />
            <ActivityFeed
              card={card}
              newComment={newComment}
              setNewComment={setNewComment}
              handleAddComment={handleAddComment}
            />
          </div>

          <div className="space-y-4 min-w-0">
            <CardActions
              card={card}
              board={board}
              handleToggleLabel={handleToggleLabel}
              handleAddChecklist={handleAddChecklist}
              handleFileUpload={handleFileUpload}
              isUploadingAttachment={isUploadingAttachment}
            />
            <CardInfo card={card} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
