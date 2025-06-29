import { relations } from "drizzle-orm";
import {
  pgTable,
  bigserial,
  text,
  integer,
  date,
  numeric,
  boolean,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";

// --- CORE TABLES ---

export const clients = pgTable("clients", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const employees = pgTable("employees", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  ratePerHour: numeric("rate_per_hour", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const workDivisions = pgTable("work_divisions", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: text("name").notNull(),
  parentDivisionId: bigint("parent_division_id", { mode: "number" }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const workOrders = pgTable("work_orders", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  orderNumber: text("order_number").notNull(),
  quantity: integer("quantity"),
  startDate: date("start_date"),
  // This is the line that was missing
  dueDate: date("due_date"),
  status: text("status").default("Planned"),
  notes: text("notes"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  clientId: bigint("client_id", { mode: "number" }).references(
    () => clients.id,
    { onDelete: "set null" }
  ),
  trelloLink: text("trello_link"),
  fusionLink: text("fusion_link"),
  katanaLink: text("katana_link"),
});

export const timeEntries = pgTable("time_entries", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  workOrderId: bigint("work_order_id", { mode: "number" })
    .notNull()
    .references(() => workOrders.id, { onDelete: "cascade" }),
  workDivisionId: bigint("work_division_id", { mode: "number" })
    .notNull()
    .references(() => workDivisions.id, { onDelete: "cascade" }),
  employeeId: bigint("employee_id", { mode: "number" })
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  dateWorked: date("date_worked").notNull(),
  hoursSpent: numeric("hours_spent", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

// --- ITEM & ASSEMBLY TABLES ---

export const items = pgTable("items", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const assemblies = pgTable("assemblies", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  parentAssemblyId: bigint("parent_assembly_id", { mode: "number" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const itemAssemblies = pgTable("item_assemblies", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  itemId: bigint("item_id", { mode: "number" })
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  assemblyId: bigint("assembly_id", { mode: "number" })
    .notNull()
    .references(() => assemblies.id, { onDelete: "cascade" }),
});

export const workOrderItems = pgTable("work_order_items", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  workOrderId: bigint("work_order_id", { mode: "number" })
    .notNull()
    .references(() => workOrders.id, { onDelete: "cascade" }),
  itemId: bigint("item_id", { mode: "number" })
    .notNull()
    .references(() => items.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
});

export const workOrderItemAssemblies = pgTable("work_order_item_assemblies", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  workOrderItemId: bigint("work_order_item_id", { mode: "number" })
    .notNull()
    .references(() => workOrderItems.id, { onDelete: "cascade" }),
  assemblyId: bigint("assembly_id", { mode: "number" })
    .notNull()
    .references(() => assemblies.id, { onDelete: "restrict" }),
});

// =================================================================
// --- RELATIONS DEFINITIONS ---
// =================================================================

export const clientsRelations = relations(clients, ({ many }) => ({
  workOrders: many(workOrders),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const workDivisionsRelations = relations(
  workDivisions,
  ({ one, many }) => ({
    timeEntries: many(timeEntries),
    parentDivision: one(workDivisions, {
      fields: [workDivisions.parentDivisionId],
      references: [workDivisions.id],
      relationName: "parent_division",
    }),
    childDivisions: many(workDivisions, {
      relationName: "parent_division",
    }),
  })
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employeeId],
    references: [employees.id],
  }),
  workOrder: one(workOrders, {
    fields: [timeEntries.workOrderId],
    references: [workOrders.id],
  }),
  workDivision: one(workDivisions, {
    fields: [timeEntries.workDivisionId],
    references: [workDivisions.id],
  }),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  client: one(clients, {
    fields: [workOrders.clientId],
    references: [clients.id],
  }),
  workOrderItems: many(workOrderItems),
  timeEntries: many(timeEntries),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  itemAssemblies: many(itemAssemblies),
  workOrderItems: many(workOrderItems),
}));

export const assembliesRelations = relations(assemblies, ({ one, many }) => ({
  itemAssemblies: many(itemAssemblies),
  parentAssembly: one(assemblies, {
    fields: [assemblies.parentAssemblyId],
    references: [assemblies.id],
    relationName: "parentAssembly",
  }),
  childAssemblies: many(assemblies, {
    relationName: "parentAssembly",
  }),
  workOrderItemSelections: many(workOrderItemAssemblies),
}));

export const itemAssembliesRelations = relations(itemAssemblies, ({ one }) => ({
  item: one(items, {
    fields: [itemAssemblies.itemId],
    references: [items.id],
  }),
  assembly: one(assemblies, {
    fields: [itemAssemblies.assemblyId],
    references: [assemblies.id],
  }),
}));

export const workOrderItemsRelations = relations(
  workOrderItems,
  ({ one, many }) => ({
    workOrder: one(workOrders, {
      fields: [workOrderItems.workOrderId],
      references: [workOrders.id],
    }),
    item: one(items, {
      fields: [workOrderItems.itemId],
      references: [items.id],
    }),
    selectedAssemblies: many(workOrderItemAssemblies),
  })
);

export const workOrderItemAssembliesRelations = relations(
  workOrderItemAssemblies,
  ({ one }) => ({
    workOrderItem: one(workOrderItems, {
      fields: [workOrderItemAssemblies.workOrderItemId],
      references: [workOrderItems.id],
    }),
    assembly: one(assemblies, {
      fields: [workOrderItemAssemblies.assemblyId],
      references: [assemblies.id],
    }),
  })
);

// =================================================================
// --- TRELLO CLONE TABLES ---
// =================================================================

export const boards = pgTable("boards", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  backgroundColor: text("background_color").default("#0079bf"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const lists = pgTable("lists", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  boardId: bigint("board_id", { mode: "number" })
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const cards = pgTable("cards", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  listId: bigint("list_id", { mode: "number" })
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  workOrderId: bigint("work_order_id", { mode: "number" }).references(
    () => workOrders.id,
    { onDelete: "cascade" }
  ),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true, mode: "string" }),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const labels = pgTable("labels", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  boardId: bigint("board_id", { mode: "number" })
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const cardLabels = pgTable("card_labels", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  cardId: bigint("card_id", { mode: "number" })
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  labelId: bigint("label_id", { mode: "number" })
    .notNull()
    .references(() => labels.id, { onDelete: "cascade" }),
});

export const comments = pgTable("comments", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  cardId: bigint("card_id", { mode: "number" })
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  cardId: bigint("card_id", { mode: "number" })
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const checklists = pgTable("checklists", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  cardId: bigint("card_id", { mode: "number" })
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const checklistItems = pgTable("checklist_items", {
  id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
  checklistId: bigint("checklist_id", { mode: "number" })
    .notNull()
    .references(() => checklists.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCompleted: boolean("is_completed").default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

// =================================================================
// --- TRELLO CLONE RELATIONS ---
// =================================================================

export const boardsRelations = relations(boards, ({ many }) => ({
  lists: many(lists),
  labels: many(labels),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  board: one(boards, {
    fields: [lists.boardId],
    references: [boards.id],
  }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  list: one(lists, {
    fields: [cards.listId],
    references: [lists.id],
  }),
  workOrder: one(workOrders, {
    fields: [cards.workOrderId],
    references: [workOrders.id],
  }),
  cardLabels: many(cardLabels),
  comments: many(comments),
  attachments: many(attachments),
  checklists: many(checklists),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  board: one(boards, {
    fields: [labels.boardId],
    references: [boards.id],
  }),
  cardLabels: many(cardLabels),
}));

export const cardLabelsRelations = relations(cardLabels, ({ one }) => ({
  card: one(cards, {
    fields: [cardLabels.cardId],
    references: [cards.id],
  }),
  label: one(labels, {
    fields: [cardLabels.labelId],
    references: [labels.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  card: one(cards, {
    fields: [comments.cardId],
    references: [cards.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  card: one(cards, {
    fields: [attachments.cardId],
    references: [cards.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  card: one(cards, {
    fields: [checklists.cardId],
    references: [cards.id],
  }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(checklists, {
    fields: [checklistItems.checklistId],
    references: [checklists.id],
  }),
}));
