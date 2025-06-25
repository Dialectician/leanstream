import { pgTable, pgPolicy, bigserial, text, numeric, timestamp, foreignKey, bigint, boolean, unique, integer, date } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const employees = pgTable("employees", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	ratePerHour: numeric("rate_per_hour", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("Allow full access for authenticated users", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true`, withCheck: sql`true`  }),
]);

export const workDivisions = pgTable("work_divisions", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentDivisionId: bigint("parent_division_id", { mode: "number" }),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.parentDivisionId],
			foreignColumns: [table.id],
			name: "work_divisions_parent_division_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Allow full access to authenticated users", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true`, withCheck: sql`true`  }),
]);

export const workOrders = pgTable("work_orders", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	orderNumber: text("order_number").notNull(),
	quantity: integer(),
	startDate: date("start_date"),
	dueDate: date("due_date"),
	status: text().default('Planned'),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("work_orders_order_number_key").on(table.orderNumber),
	pgPolicy("Allow insert for authenticated users", { as: "permissive", for: "insert", to: ["authenticated"], withCheck: sql`true`  }),
	pgPolicy("Allow read access to authenticated users", { as: "permissive", for: "select", to: ["authenticated"] }),
]);

export const timeEntries = pgTable("time_entries", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workOrderId: bigint("work_order_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	workDivisionId: bigint("work_division_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }).notNull(),
	dateWorked: date("date_worked").notNull(),
	hoursSpent: numeric("hours_spent", { precision: 5, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "time_entries_employee_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workDivisionId],
			foreignColumns: [workDivisions.id],
			name: "time_entries_work_division_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workOrderId],
			foreignColumns: [workOrders.id],
			name: "time_entries_work_order_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Allow read access to authenticated users", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Allow insert for authenticated users", { as: "permissive", for: "insert", to: ["authenticated"] }),
]);
