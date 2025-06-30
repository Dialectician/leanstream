"use client";

import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { Card } from "@/lib/types";

interface WorkOrderDetailsProps {
  workOrder: Card["workOrder"];
}

export function WorkOrderDetails({ workOrder }: WorkOrderDetailsProps) {
  if (!workOrder) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Work Order Details
        </h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Order Number
            </span>
            <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              #{workOrder.orderNumber}
            </div>
          </div>
          {workOrder.client && (
            <div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Client
              </span>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {workOrder.client.firstName} {workOrder.client.lastName}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Status
            </span>
            <div className="text-sm">
              <Badge
                className={`${
                  workOrder.status === "Completed"
                    ? "bg-green-100 text-green-800"
                    : workOrder.status === "In Progress"
                    ? "bg-blue-100 text-blue-800"
                    : workOrder.status === "On Hold"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {workOrder.status || "Planned"}
              </Badge>
            </div>
          </div>
          {workOrder.quantity && (
            <div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Quantity
              </span>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {workOrder.quantity}
              </div>
            </div>
          )}
        </div>

        {workOrder.workOrderItems && workOrder.workOrderItems.length > 0 && (
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Items & Assemblies
            </span>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {workOrder.workOrderItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 p-2 rounded border"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words flex-1">
                      {item.item.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ×{item.quantity}
                    </span>
                  </div>
                  {item.item.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {item.item.description}
                    </div>
                  )}
                  {item.selectedAssemblies.length > 0 && (
                    <div className="mt-2 ml-3 space-y-1">
                      {item.selectedAssemblies.map((assembly) => (
                        <div
                          key={assembly.id}
                          className="text-xs text-gray-600 dark:text-gray-400"
                        >
                          • {assembly.assembly.name}
                          {assembly.assembly.description && (
                            <span className="text-gray-500">
                              {" "}
                              - {assembly.assembly.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {workOrder.notes && (
          <div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Notes
            </span>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-2 bg-white dark:bg-gray-800 rounded border">
              {workOrder.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
