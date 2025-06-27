import { db } from "@/lib/db";
import { desc } from "drizzle-orm";

export type OrderReportData = {
    orderNumber: string;
    clientName: string | null;
    totalHours: number;
    divisionHours: { [key: string]: number };
    products: {
        name: string;
        assemblies: string[];
        subAssemblies: string[];
    }[];
};

export async function getOrderReportData(): Promise<OrderReportData[]> {
    const orders = await db.query.workOrders.findMany({
        orderBy: (workOrders, { desc }) => [desc(workOrders.createdAt)],
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
    });

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
            
            woi.selectedAssemblies.forEach(sa => {
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