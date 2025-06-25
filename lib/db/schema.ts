import { relations } from "drizzle-orm";
import { pgTable, bigserial, text, integer, date, numeric, boolean, timestamp, bigint } from "drizzle-orm/pg-core";

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


// --- RELATIONS DEFINITIONS ---

// Defines that a client can have many work orders
export const clientsRelations = relations(clients, ({ many }) => ({
  workOrders: many(workOrders),
}));

// Defines that a work order belongs to one client
export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  client: one(clients, {
    fields: [workOrders.clientId],
    references: [clients.id],
  }),
}));

// Optional: Define relations for other tables if you plan to query them together
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