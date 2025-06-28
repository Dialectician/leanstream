import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { desc, not, eq } from "drizzle-orm";
import {
  timeEntries,
  workOrders,
  clients,
  employees,
  workDivisions,
} from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, Users, Package, TrendingUp } from "lucide-react";

// Type definitions for the queries
type ClientType = typeof clients.$inferSelect;
type EmployeeType = typeof employees.$inferSelect;
type WorkDivisionType = typeof workDivisions.$inferSelect;
type WorkOrderType = typeof workOrders.$inferSelect;

type WorkOrderWithClient = typeof workOrders.$inferSelect & {
  client: ClientType | null;
};

type TimeEntryWithRelations = typeof timeEntries.$inferSelect & {
  employee: EmployeeType | null;
  workOrder: WorkOrderType | null;
  workDivision: WorkDivisionType | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch recent time entries with related data using Drizzle
  const recentTimeEntries = (await db.query.timeEntries.findMany({
    with: {
      workOrder: {
        columns: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          clientId: true,
          quantity: true,
          startDate: true,
          dueDate: true,
          notes: true,
          trelloLink: true,
          fusionLink: true,
          katanaLink: true,
        },
      },
      workDivision: {
        columns: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          parentDivisionId: true,
        },
      },
      employee: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          ratePerHour: true,
          createdAt: true,
        },
      },
    },
    orderBy: [desc(timeEntries.createdAt)],
    limit: 5,
  })) as TimeEntryWithRelations[];

  // Fetch active work orders (status is not 'Completed')
  const activeWorkOrders = (await db.query.workOrders.findMany({
    where: not(eq(workOrders.status, "Completed")),
    with: {
      client: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          contactPerson: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: [desc(workOrders.createdAt)],
  })) as WorkOrderWithClient[];

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.email}! Here&apos;s a quick overview of your
          operations.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Quick Entry
                </p>
                <Link href="/protected/time-entry">
                  <Button variant="link" className="p-0 h-auto font-semibold">
                    Log Time →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  New Order
                </p>
                <Link href="/protected/orders">
                  <Button variant="link" className="p-0 h-auto font-semibold">
                    Create Order →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Add Client
                </p>
                <Link href="/protected/clients">
                  <Button variant="link" className="p-0 h-auto font-semibold">
                    Manage Clients →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  View Reports
                </p>
                <Link href="/protected/reports">
                  <Button variant="link" className="p-0 h-auto font-semibold">
                    Analytics →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Active Work Orders Card */}
        <Card>
          <CardHeader>
            <CardTitle>Active Work Orders</CardTitle>
            <CardDescription>
              All orders that are not yet completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeWorkOrders.length > 0 ? (
              <ul className="space-y-2">
                {activeWorkOrders.map((order) => (
                  <li key={order.id}>
                    <Link href={`/protected/orders/${order.id}`}>
                      <div className="flex justify-between items-center p-3 border rounded-md hover:bg-accent transition-colors">
                        <div>
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.client
                              ? `${order.client.firstName || ""} ${
                                  order.client.lastName || ""
                                }`.trim() || "No Client Name"
                              : "No Client"}
                          </p>
                        </div>
                        <span className="text-sm font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No active work orders found.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Time Entries Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              The latest time entries logged across all orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTimeEntries.length > 0 ? (
              <ul className="space-y-3">
                {recentTimeEntries.map((entry) => (
                  <li key={entry.id} className="p-3 border rounded-md text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {entry.employee?.firstName} {entry.employee?.lastName}
                        </p>
                        <p className="text-muted-foreground">
                          {entry.workOrder?.orderNumber} /{" "}
                          {entry.workDivision?.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold">{entry.hoursSpent} hrs</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.dateWorked}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent time entries found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
