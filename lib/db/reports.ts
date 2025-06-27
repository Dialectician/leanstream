import { db } from "@/lib/db";
import { desc } from "drizzle-orm";
import type { workOrderItemAssemblies, assemblies, workOrders, clients, workOrderItems, items, timeEntries, workDivisions } from "@/lib/db/schema";

type SelectedAssemblyWithDetails = typeof workOrderItemAssemblies.$inferSelect & { 
    assembly: typeof assemblies.$inferSelect 
};

type WorkOrderItemWithDetails = typeof workOrderItems.$inferSelect & {
    item: typeof items.$inferSelect;
    selectedAssemblies: SelectedAssemblyWithDetails[];
};

type TimeEntryWithDetails = typeof timeEntries.$inferSelect & {
    workDivision: typeof workDivisions.$inferSelect | null;
};

type OrderWithDetails = typeof workOrders.$inferSelect & {
    client: typeof clients.$inferSelect | null;
    workOrderItems: WorkOrderItemWithDetails[];
    timeEntries: TimeEntryWithDetails[];
};

export type ReportData = {
    orderNumber: string;
    clientName: string | null;
    divisionHours: { [key: string]: number };
    totalHours: number;
    products: {
        name: string;
        assemblies: string[];
        subAssemblies: string[];
    }[];
};

export async function getOrderReportData(): Promise<ReportData[]> {
    const orders = await db.query.workOrders.findMany({
        orderBy: (workOrders) => [desc(workOrders.createdAt)],
        with: {
            client: true,
            workOrderItems: {
                with: {
                    item: true,
                    selectedAssemblies: {
                        with: {
                            assembly: {
                                with: {
                                    parentAssembly: true
                                }
                            }
                        }
                    }
                }
            },
            timeEntries: {
                with: {
                    workDivision: true
                }
            }
        }
    }) as OrderWithDetails[];

    return orders.map(order => {
        const divisionHours: { [key: string]: number } = {};
        let totalHours = 0;

        for (const entry of order.timeEntries) {
            const hours = Number(entry.hoursSpent);
            totalHours += hours;
            const divisionName = entry.workDivision?.name ?? 'N/A';
            divisionHours[divisionName] = (divisionHours[divisionName] || 0) + hours;
        }

        const products = order.workOrderItems.map(woi => {
            const assemblies: string[] = [];
            const subAssemblies: string[] = [];
            
            woi.selectedAssemblies.forEach((sa: SelectedAssemblyWithDetails) => {
                if (sa.assembly.parentAssemblyId) {
                    subAssemblies.push(sa.assembly.name);
                } else {
                    assemblies.push(sa.assembly.name);
                }
            });
            
            return {
                name: woi.item.name,
                assemblies,
                subAssemblies
            };
        });

        return {
            orderNumber: order.orderNumber,
            clientName: order.client?.name ?? null,
            totalHours,
            divisionHours,
            products
        };
    });
}