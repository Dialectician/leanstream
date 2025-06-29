// components/add-work-order-card.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, User, Calendar, ExternalLink } from "lucide-react";
import { createCard } from "@/app/protected/board/actions";

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

type List = {
  id: number;
  name: string;
};

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

interface AddWorkOrderCardProps {
  isOpen: boolean;
  onClose: () => void;
  availableWorkOrders: WorkOrder[];
  lists: List[];
  onCardCreated: (card: Card) => void;
}

export function AddWorkOrderCard({
  isOpen,
  onClose,
  availableWorkOrders,
  lists,
  onCardCreated,
}: AddWorkOrderCardProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");

  const selectedWorkOrder = availableWorkOrders.find(
    (wo) => wo.id.toString() === selectedWorkOrderId
  );

  const handleSubmit = () => {
    if (!selectedWorkOrderId || !selectedListId) return;

    const workOrder = availableWorkOrders.find(
      (wo) => wo.id.toString() === selectedWorkOrderId
    );
    if (!workOrder) return;

    const title = customTitle || `Order: ${workOrder.orderNumber}`;
    const listId = parseInt(selectedListId);
    const targetList = lists.find((l) => l.id === listId);
    if (!targetList) return;

    startTransition(async () => {
      const result = await createCard(
        listId,
        title,
        0, // position at top
        workOrder.id
      );

      if (result.success && result.data) {
        onCardCreated({
          ...result.data,
          cardLabels: [],
          comments: [],
          attachments: [],
          checklists: [],
          workOrder: workOrder,
        });
        handleClose();
      }
    });
  };

  const handleClose = () => {
    setSelectedWorkOrderId("");
    setSelectedListId("");
    setCustomTitle("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Work Order to Board</DialogTitle>
          <DialogDescription>
            Select a work order to add as a card to your project board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Work Order Selection */}
          <div className="space-y-2">
            <Label>Select Work Order</Label>
            <Select
              value={selectedWorkOrderId}
              onValueChange={setSelectedWorkOrderId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a work order..." />
              </SelectTrigger>
              <SelectContent>
                {availableWorkOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{order.orderNumber}</span>
                      {order.client && (
                        <span className="text-muted-foreground">
                          - {order.client.firstName} {order.client.lastName}
                        </span>
                      )}
                      {order.status && (
                        <Badge variant="outline" className="ml-auto">
                          {order.status}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work Order Preview */}
          {selectedWorkOrder && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Work Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedWorkOrder.orderNumber}
                  </span>
                  {selectedWorkOrder.status && (
                    <Badge variant="outline">{selectedWorkOrder.status}</Badge>
                  )}
                </div>
                {selectedWorkOrder.client && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {selectedWorkOrder.client.firstName}{" "}
                      {selectedWorkOrder.client.lastName}
                    </span>
                  </div>
                )}
                {selectedWorkOrder.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(selectedWorkOrder.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <ExternalLink className="h-4 w-4" />
                  <span>View full order details</span>
                </div>
              </div>
            </div>
          )}

          {/* List Selection */}
          <div className="space-y-2">
            <Label>Add to List</Label>
            <Select value={selectedListId} onValueChange={setSelectedListId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a list..." />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id.toString()}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Title */}
          <div className="space-y-2">
            <Label>Card Title (Optional)</Label>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={
                selectedWorkOrder
                  ? `Order: ${selectedWorkOrder.orderNumber}`
                  : "Enter custom title..."
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default title based on work order
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedWorkOrderId || !selectedListId || isPending}
          >
            {isPending ? "Adding..." : "Add to Board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
