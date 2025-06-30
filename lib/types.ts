// lib/types.ts
// Shared type definitions for the application

export type Label = {
  id: number;
  boardId: number;
  name: string;
  color: string;
  createdAt: string | null;
};

export type CardLabel = {
  id: number;
  cardId: number;
  labelId: number;
  label: Label;
};

export type Comment = {
  id: number;
  cardId: number;
  content: string;
  authorName: string;
  createdAt: string | null;
};

export type Attachment = {
  id: number;
  cardId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string | null;
};

export type ChecklistItem = {
  id: number;
  checklistId: number;
  text: string;
  isCompleted: boolean | null;
  position: number;
  createdAt: string | null;
};

export type Checklist = {
  id: number;
  cardId: number;
  title: string;
  position: number;
  createdAt: string | null;
  items: ChecklistItem[];
};

export type WorkOrderItem = {
  id: number;
  workOrderId: number;
  itemId: number;
  quantity: number;
  item: {
    id: number;
    name: string;
    description: string | null;
  };
  selectedAssemblies: {
    id: number;
    workOrderItemId: number;
    assemblyId: number;
    assembly: {
      id: number;
      name: string;
      description: string | null;
    };
  }[];
};

export type WorkOrder = {
  id: number;
  orderNumber: string;
  status: string | null;
  dueDate: string | null;
  quantity: number | null;
  startDate: string | null;
  notes: string | null;
  client: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  } | null;
  workOrderItems: WorkOrderItem[];
};

export type Card = {
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

export type List = {
  id: number;
  boardId: number;
  name: string;
  position: number;
  isArchived: boolean | null;
  createdAt: string | null;
  cards: Card[];
};

export type Board = {
  id: number;
  name: string;
  description: string | null;
  backgroundColor: string | null;
  isArchived: boolean | null;
  createdAt: string | null;
  lists: List[];
  labels: Label[];
};

// Simplified types for specific use cases
export type SimpleList = {
  id: number;
  name: string;
};
