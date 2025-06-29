// components/card-modal.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

// Type definitions (same as in trello-board-client.tsx)
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

    startTransition(async () => {
      const result = await updateCard(card.id, { dueDate: dueDate || null });
      if (result.success && result.data) {
        onUpdate({ ...card, dueDate: dueDate || null });
        setIsEditingDueDate(false);
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
    startTransition(async () => {
      const result = await updateChecklistItem(itemId, { isCompleted });
      if (result.success) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  className="text-xl font-semibold"
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className="text-xl cursor-pointer hover:bg-gray-100 p-2 rounded"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {card.title}
                </DialogTitle>
              )}

              {card.workOrder && (
                <div className="text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Work Order: {card.workOrder.orderNumber}
                    {card.workOrder.client && (
                      <span>
                        - {card.workOrder.client.firstName}{" "}
                        {card.workOrder.client.lastName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
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
                  className="min-h-[60px] p-3 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        className={
                          item.isCompleted
                            ? "line-through text-muted-foreground"
                            : ""
                        }
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
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({card.attachments.length})
                </h3>
                <div className="space-y-2">
                  {card.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {attachment.fileName}
                          </p>
                          {attachment.fileSize && (
                            <p className="text-xs text-muted-foreground">
                              {(attachment.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = attachment.fileUrl;
                            link.download = attachment.fileName;
                            link.click();
                          }}
                        >
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Activity
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Comment
                  </Button>
                </div>
                {card.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
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
                  />
                  <Button size="sm" onClick={handleAddChecklist}>
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </div>

                {isEditingDueDate ? (
                  <div className="space-y-2">
                    <Input
                      type="datetime-local"
                      value={
                        dueDate
                          ? new Date(dueDate).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setDueDate(
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : ""
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdateDueDate}>
                        Save
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDueDate("");
                          handleUpdateDueDate();
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setIsEditingDueDate(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {card.dueDate
                      ? `Due: ${new Date(card.dueDate).toLocaleDateString()}`
                      : "Set Due Date"}
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
