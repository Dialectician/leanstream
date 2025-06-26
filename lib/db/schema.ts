import { relations } from "drizzle-orm";
import { pgTable, bigserial, text, integer, date, numeric, boolean, timestamp, bigint } from "drizzle-orm/pg-core";

// --- EXISTING TABLES ---

export const clients = pgTable("clients", {
	id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
	name: text("name").notNull(),
	contactPerson: text("contact_person"),
	email: text("email"),
	phone: text("phone"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const employees = pgTable("employees", {
	id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	ratePerHour: numeric("rate_per_hour", { precision: 10, scale: 2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const workDivisions = pgTable("work_divisions", {
	id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
	name: text("name").notNull(),
	parentDivisionId: bigint("parent_division_id", { mode: "number" }).references(() => workDivisions.id, { onDelete: "set null" } ),
	description: text("description"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const workOrders = pgTable("work_orders", {
	id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
	orderNumber: text("order_number").notNull(),
	quantity: integer("quantity"),
	startDate: date("start_date"),
	dueDate: date("due_date"),
	status: text("status").default('Planned'),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	clientId: bigint("client_id", { mode: "number" }).references(() => clients.id, { onDelete: "set null" } ),
});

export const timeEntries = pgTable("time_entries", {
	id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
	workOrderId: bigint("work_order_id", { mode: "number" }).notNull().references(() => workOrders.id, { onDelete: "cascade" } ),
	workDivisionId: bigint("work_division_id", { mode: "number" }).notNull().references(() => workDivisions.id, { onDelete: "cascade" } ),
	employeeId: bigint("employee_id", { mode: "number" }).notNull().references(() => employees.id, { onDelete: "cascade" } ),
	dateWorked: date("date_worked").notNull(),
	hoursSpent: numeric("hours_spent", { precision: 5, scale: 2 }).notNull(),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// --- ITEM & ASSEMBLY TABLES ---

export const items = pgTable("items", {
    id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const assemblies = pgTable("assemblies", {
    id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentAssemblyId: bigint("parent_assembly_id", { mode: "number" }).references(() => assemblies.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const itemAssemblies = pgTable("item_assemblies", {
    id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
    itemId: bigint("item_id", { mode: "number" }).notNull().references(() => items.id, { onDelete: "cascade" }),
    assemblyId: bigint("assembly_id", { mode: "number" }).notNull().references(() => assemblies.id, { onDelete: "cascade" }),
});

// --- NEW WORK ORDER ITEM TABLES ---

export const workOrderItems = pgTable("work_order_items", {
	id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
	workOrderId: bigint("work_order_id", { mode: "number" }).notNull().references(() => workOrders.id, { onDelete: "cascade" }),
	itemId: bigint("item_id", { mode: "number" }).notNull().references(() => items.id, { onDelete: "restrict" }),
	quantity: integer("quantity").notNull().default(1),
});

export const workOrderItemAssemblies = pgTable("work_order_item_assemblies", {
	id: bigserial("id", { mode: "number" }).primaryKey().notNull(),
	workOrderItemId: bigint("work_order_item_id", { mode: "number" }).notNull().references(() => workOrderItems.id, { onDelete: "cascade" }),
	assemblyId: bigint("assembly_id", { mode: "number" }).notNull().references(() => assemblies.id, { onDelete: "restrict" }),
});


// =================================================================
// --- COMPLETE RELATIONS DEFINITIONS ---
// =================================================================

export const clientsRelations = relations(clients, ({ many }) => ({
  workOrders: many(workOrders),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
    timeEntries: many(timeEntries),
}));

export const workDivisionsRelations = relations(workDivisions, ({ many }) => ({
    timeEntries: many(timeEntries),
}));

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
    relationName: "parentAssembly"
  }),
  childAssemblies: many(assemblies, {
    relationName: "parentAssembly"
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

export const workOrderItemsRelations = relations(workOrderItems, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderItems.workOrderId],
    references: [workOrders.id],
  }),
  item: one(items, {
    fields: [workOrderItems.itemId],
    references: [items.id],
  }),
  selectedAssemblies: many(workOrderItemAssemblies),
}));

export const workOrderItemAssembliesRelations = relations(workOrderItemAssemblies, ({ one }) => ({
    workOrderItem: one(workOrderItems, {
        fields: [workOrderItemAssemblies.workOrderItemId],
        references: [workOrderItems.id],
    }),
    assembly: one(assemblies, {
        fields: [workOrderItemAssemblies.assemblyId],
        references: [assemblies.id],
    })
}));
