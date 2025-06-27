import { relations } from "drizzle-orm/relations";
import { workDivisions, employees, timeEntries, workOrders } from "./schema";

export const workDivisionsRelations = relations(workDivisions, ({one, many}) => ({
	workDivision: one(workDivisions, {
		fields: [workDivisions.parentDivisionId],
		references: [workDivisions.id],
		relationName: "workDivisions_parentDivisionId_workDivisions_id"
	}),
	workDivisions: many(workDivisions, {
		relationName: "workDivisions_parentDivisionId_workDivisions_id"
	}),
	timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({one}) => ({
	employee: one(employees, {
		fields: [timeEntries.employeeId],
		references: [employees.id]
	}),
	workDivision: one(workDivisions, {
		fields: [timeEntries.workDivisionId],
		references: [workDivisions.id]
	}),
	workOrder: one(workOrders, {
		fields: [timeEntries.workOrderId],
		references: [workOrders.id]
	}),
}));

export const employeesRelations = relations(employees, ({many}) => ({
	timeEntries: many(timeEntries),
}));

