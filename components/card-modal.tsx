// components/card-modal.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MessageSquare,
  Paperclip,
  CheckSquare,
  X,
  Tag,
  User,
} from "lucide-react";
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

interface CardModalProps {
  card: Card;
  board: Board;
  onClose: () => void;
  onUpdate: (updatedCard: Card) => void;
}

export function CardModal({ card, board, onClose, onUpdate }: CardModalProps) {
  const [, startTransition] = useTransition();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [newComment, setNewComment] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItems, setNewChecklistItems] = useState<{
    [key: number]: string;
  }>({});
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Sync local state with card prop when it changes (for real-time updates)
  useEffect(() => {
    console.log("CardModal: Card prop changed", {
      cardId: card.id,
      title: card.title,
      description: card.description,
      dueDate: card.dueDate,
      commentsCount: card.comments.length,
      checklistsCount: card.checklists.length,
      attachmentsCount: card.attachments.length,
    });

    // Only update if not currently editing to avoid overwriting user input
    if (!isEditingTitle && title !== card.title) {
      console.log("CardModal: Updating title from", title, "to", card.title);
      setTitle(card.title);
    }
    if (!isEditingDescription && description !== (card.description || "")) {
      console.log("CardModal: Updating description");
      setDescription(card.description || "");
    }
    if (!isEditingDueDate && dueDate !== (card.dueDate || "")) {
      console.log("CardModal: Updating due date");
      setDueDate(card.dueDate || "");
    }
  }, [
    card.id,
    card.title,
    card.description,
    card.dueDate,
    card.comments.length,
    card.checklists.length,
    card.attachments.length,
    card.cardLabels.length,
    isEditingTitle,
    isEditingDescription,
    isEditingDueDate,
    title,
    description,
    dueDate,
  ]);

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
      setIsEditingDescription(false);
      return;
    }

    startTransition(async () => {
      const result = await updateCard(card.id, { description });
      if (result.success && result.data) {
        onUpdate({ ...card, description });
        setIsEditingDescription(false);
      }
    });
  };

  const handleUpdateDueDate = () => {
    if (dueDate === (card.dueDate || "")) {
      setIsEditingDueDate(false);
      return;
    }

    // Optimistic update - update UI immediately
    const previousDueDate = card.dueDate;
    onUpdate({ ...card, dueDate: dueDate || null });
    setIsEditingDueDate(false);

    startTransition(async () => {
      const result = await updateCard(card.id, { dueDate: dueDate || null });
      if (!result.success) {
        // Revert on failure
        onUpdate({ ...card, dueDate: previousDueDate });
        setDueDate(previousDueDate || "");
        setIsEditingDueDate(true);
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

  const handleAddChecklist = () => {
    if (!newChecklistTitle.trim()) return;

    startTransition(async () => {
      const result = await addChecklist(card.id, newChecklistTitle.trim());
      if (result.success && result.data) {
        const updatedCard = {
          ...card,
          checklists: [...card.checklists, { ...result.data, items: [] }],
        };
        onUpdate(updatedCard);
        setNewChecklistTitle("");
      }
    });
  };

  const handleToggleChecklistItem = (itemId: number, isCompleted: boolean) => {
    // Optimistic update - update UI immediately
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

    // Then update the server
    startTransition(async () => {
      const result = await updateChecklistItem(itemId, { isCompleted });
      if (!result.success) {
        // Revert on failure
        const revertedCard = {
          ...card,
          checklists: card.checklists.map((checklist) => ({
            ...checklist,
            items: checklist.items.map((item) =>
              item.id === itemId ? { ...item, isCompleted: !isCompleted } : item
            ),
          })),
        };
        onUpdate(revertedCard);
      }
    });
  };

  const handleAddChecklistItem = (checklistId: number) => {
    const text = newChecklistItems[checklistId];
    if (!text?.trim()) return;

    const checklist = card.checklists.find((c) => c.id === checklistId);
    if (!checklist) return;

    startTransition(async () => {
      const result = await addChecklistItem(
        checklistId,
        text.trim(),
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
        setNewChecklistItems((prev) => ({ ...prev, [checklistId]: "" }));
      }
    });
  };

  const handleToggleLabel = (labelId: number) => {
    const hasLabel = card.cardLabels.some((cl) => cl.labelId === labelId);

    startTransition(async () => {
      const result = await toggleCardLabel(card.id, labelId);
      if (result.success) {
        const label = board.labels.find((l) => l.id === labelId);
        if (!label) return;

        let updatedCardLabels;
        if (hasLabel) {
          updatedCardLabels = card.cardLabels.filter(
            (cl) => cl.labelId !== labelId
          );
        } else {
          const newCardLabel = {
            id: Date.now(), // Temporary ID
            cardId: card.id,
            labelId,
            label,
          };
          updatedCardLabels = [...card.cardLabels, newCardLabel];
        }

        onUpdate({ ...card, cardLabels: updatedCardLabels });
      }
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      event.target.value = "";
      return;
    }

    setIsUploadingAttachment(true);

    try {
      // For now, we'll create a simple data URL for the file
      // In a real app, you'd upload to a file storage service
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
          const updatedCard = {
            ...card,
            attachments: [result.data, ...card.attachments],
          };
          onUpdate(updatedCard);
        }
        setIsUploadingAttachment(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploadingAttachment(false);
    }

    // Reset the input
    event.target.value = "";
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    startTransition(async () => {
      const result = await deleteAttachment(attachmentId);
      if (result.success) {
        const updatedCard = {
          ...card,
          attachments: card.attachments.filter((a) => a.id !== attachmentId),
        };
        onUpdate(updatedCard);
      }
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  const getCompletedChecklistItems = () => {
    return card.checklists.reduce(
      (acc, checklist) =>
        acc + checklist.items.filter((item) => item.isCompleted).length,
      0
    );
  };

  const getTotalChecklistItems = () => {
    return card.checklists.reduce(
      (acc, checklist) => acc + checklist.items.length,
      0
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900 border-0 shadow-2xl p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateTitle();
                    if (e.key === "Escape") {
                      setTitle(card.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-xl font-semibold w-full min-w-0"
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className="text-2xl font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors text-gray-900 dark:text-gray-100 break-words"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {card.title}
                </DialogTitle>
              )}

              {card.workOrder && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Work Order Details
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Order Number
                        </span>
                        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          #{card.workOrder.orderNumber}
                        </div>
                      </div>
                      {card.workOrder.client && (
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Client
                          </span>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {card.workOrder.client.firstName}{" "}
                            {card.workOrder.client.lastName}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Status
                        </span>
                        <div className="text-sm">
                          <Badge
                            className={`${
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
                        </div>
                      </div>
                      {card.workOrder.quantity && (
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Quantity
                          </span>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {card.workOrder.quantity}
                          </div>
                        </div>
                      )}
                    </div>

                    {card.workOrder.workOrderItems &&
                      card.workOrder.workOrderItems.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Items & Assemblies
                          </span>
                          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                            {card.workOrder.workOrderItems.map((item) => (
                              <div
                                key={item.id}
                                className="bg-white dark:bg-gray-800 p-2 rounded border"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words flex-1">
                                    {item.item.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ×{item.quantity}
                                  </span>
                                </div>
                                {item.item.description && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {item.item.description}
                                  </div>
                                )}
                                {item.selectedAssemblies.length > 0 && (
                                  <div className="mt-2 ml-3 space-y-1">
                                    {item.selectedAssemblies.map((assembly) => (
                                      <div
                                        key={assembly.id}
                                        className="text-xs text-gray-600 dark:text-gray-400"
                                      >
                                        • {assembly.assembly.name}
                                        {assembly.assembly.description && (
                                          <span className="text-gray-500">
                                            {" "}
                                            - {assembly.assembly.description}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {card.workOrder.notes && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Notes
                        </span>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-2 bg-white dark:bg-gray-800 rounded border">
                          {card.workOrder.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 min-w-0 w-full">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6 min-w-0">
            {/* Labels */}
            {card.cardLabels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Labels
                </h3>
                <div className="flex flex-wrap gap-2">
                  {card.cardLabels.map((cardLabel) => (
                    <Badge
                      key={cardLabel.id}
                      style={{ backgroundColor: cardLabel.label.color }}
                      className="text-white"
                    >
                      {cardLabel.label.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a more detailed description..."
                    rows={4}
                    className="w-full min-w-0 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDescription(card.description || "");
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="min-h-[60px] p-3 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {card.description || "Add a more detailed description..."}
                </div>
              )}
            </div>

            {/* Checklists */}
            {card.checklists.map((checklist) => (
              <div key={checklist.id}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {checklist.title}
                  <span className="text-xs text-muted-foreground">
                    {checklist.items.filter((item) => item.isCompleted).length}/
                    {checklist.items.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {checklist.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={item.isCompleted || false}
                        onCheckedChange={(checked) =>
                          handleToggleChecklistItem(item.id, checked as boolean)
                        }
                      />
                      <span
                        className={`break-words flex-1 ${
                          item.isCompleted
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an item"
                      value={newChecklistItems[checklist.id] || ""}
                      onChange={(e) =>
                        setNewChecklistItems((prev) => ({
                          ...prev,
                          [checklist.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleAddChecklistItem(checklist.id);
                      }}
                      className="flex-1 min-w-0"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddChecklistItem(checklist.id)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Attachments */}
            {card.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({card.attachments.length})
                </h3>

                {/* Image Attachments (Cover Images) */}
                {card.attachments.filter((att) =>
                  att.mimeType?.startsWith("image/")
                ).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Images
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {card.attachments
                        .filter((att) => att.mimeType?.startsWith("image/"))
                        .map((attachment, index) => (
                          <div
                            key={attachment.id}
                            className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                          >
                            <div className="relative h-32">
                              <Image
                                src={attachment.fileUrl}
                                alt={attachment.fileName}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                            {index === 0 && (
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-blue-600 text-white text-xs">
                                  Cover
                                </Badge>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = attachment.fileUrl;
                                    link.download = attachment.fileName;
                                    link.click();
                                  }}
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0"
                                  onClick={() =>
                                    handleDeleteAttachment(attachment.id)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                              <p className="text-white text-xs font-medium truncate">
                                {attachment.fileName}
                              </p>
                              {attachment.fileSize && (
                                <p className="text-white text-xs opacity-75">
                                  {(attachment.fileSize / 1024).toFixed(1)} KB
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Other Attachments */}
                {card.attachments.filter(
                  (att) => !att.mimeType?.startsWith("image/")
                ).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Files
                    </h4>
                    <div className="space-y-2">
                      {card.attachments
                        .filter((att) => !att.mimeType?.startsWith("image/"))
                        .map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-0"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {attachment.fileName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  {attachment.fileSize && (
                                    <span>
                                      {(attachment.fileSize / 1024).toFixed(1)}{" "}
                                      KB
                                    </span>
                                  )}
                                  {attachment.mimeType && (
                                    <span>
                                      •{" "}
                                      {attachment.mimeType
                                        .split("/")[1]
                                        .toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = attachment.fileUrl;
                                  link.download = attachment.fileName;
                                  link.click();
                                }}
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleDeleteAttachment(attachment.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <MessageSquare className="h-5 w-5" />
                Activity
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="mb-3 resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full min-w-0"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>
                </div>
                {card.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {comment.authorName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed ml-11 break-words">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 min-w-0">
            <div>
              <h3 className="text-sm font-semibold mb-2">Add to card</h3>
              <div className="space-y-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      Labels
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {board.labels.map((label) => (
                      <DropdownMenuItem
                        key={label.id}
                        onClick={() => handleToggleLabel(label.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: label.color }}
                          />
                          {label.name}
                          {card.cardLabels.some(
                            (cl) => cl.labelId === label.id
                          ) && <CheckSquare className="ml-auto h-4 w-4" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex gap-2">
                  <Input
                    placeholder="Checklist title"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddChecklist();
                    }}
                    className="flex-1 min-w-0"
                  />
                  <Button size="sm" onClick={handleAddChecklist}>
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </div>

                {isEditingDueDate ? (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <Label className="text-sm font-medium">
                      Due Date & Time
                    </Label>
                    <div className="relative w-full">
                      <DatePicker
                        selected={dueDate ? new Date(dueDate) : null}
                        onChange={(date) =>
                          setDueDate(date ? date.toISOString() : "")
                        }
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
                        onClick={handleUpdateDueDate}
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
                          }}
                        >
                          Remove Date
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    onClick={() => setIsEditingDueDate(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    {card.dueDate ? (
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-sm">
                          Due: {new Date(card.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(card.dueDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ) : (
                      "Set Due Date"
                    )}
                  </Button>
                )}

                <div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploadingAttachment}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    disabled={isUploadingAttachment}
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    {isUploadingAttachment ? "Uploading..." : "Attachment"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Card Info */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Card Info</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>Created: {formatDate(card.createdAt)}</div>
                {card.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {formatDate(card.dueDate)}
                  </div>
                )}
                {getTotalChecklistItems() > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    Checklist: {getCompletedChecklistItems()}/
                    {getTotalChecklistItems()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
