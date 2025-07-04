"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDashboards, useDefaultDashboard } from "@/lib/hooks/use-dashboards";
import { DashboardLayout } from "@/lib/types";
import {
  ChevronDownIcon,
  PlusIcon,
  SettingsIcon,
  StarIcon,
  TrashIcon,
} from "lucide-react";

interface DashboardSelectorProps {
  currentDashboard?: DashboardLayout;
  onDashboardChange: (dashboard: DashboardLayout) => void;
  onCreateNew: () => void;
  onDelete?: (dashboard: DashboardLayout) => void;
  onManage?: () => void;
  className?: string;
}

export const DashboardSelector = React.memo<DashboardSelectorProps>(
  function DashboardSelector({
    currentDashboard,
    onDashboardChange,
    onCreateNew,
    onDelete,
    onManage,
    className,
  }: DashboardSelectorProps) {
    const { data: dashboards, isLoading } = useDashboards();
    const { data: defaultDashboard } = useDefaultDashboard();

    // Use default dashboard if no current dashboard is provided
    const activeDashboard = currentDashboard || defaultDashboard;

    const handleSelectDashboard = React.useCallback(
      (dashboard: DashboardLayout) => {
        onDashboardChange(dashboard);
      },
      [onDashboardChange]
    );

    const handleDeleteDashboard = React.useCallback(
      (e: React.MouseEvent, dashboard: DashboardLayout) => {
        e.stopPropagation(); // Prevent dropdown item click

        if (!onDelete) return;

        const confirmed = window.confirm(
          `Are you sure you want to delete "${dashboard.name}"? This action cannot be undone.`
        );

        if (confirmed) {
          onDelete(dashboard);
        }
      },
      [onDelete]
    );

    // Memoized loading state
    if (isLoading) {
      return (
        <div className={className}>
          <Button variant="outline" disabled>
            <div className="animate-pulse bg-muted rounded h-4 w-32"></div>
          </Button>
        </div>
      );
    }

    return (
      <div className={className}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[200px]">
              <div className="flex items-center gap-2">
                {activeDashboard?.isDefault && (
                  <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                )}
                <span className="truncate">
                  {activeDashboard?.name || "Select Dashboard"}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px]">
            <DropdownMenuLabel>Switch Dashboard</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {dashboards?.map((dashboard) => {
              const isActive = activeDashboard?.id === dashboard.id;
              const canDelete = !isActive && onDelete && dashboards.length > 1;

              return (
                <DropdownMenuItem
                  key={dashboard.id}
                  onClick={() => handleSelectDashboard(dashboard)}
                  className="flex items-center justify-between p-3 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {dashboard.isDefault && (
                      <StarIcon className="h-4 w-4 text-yellow-500 fill-current shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {dashboard.name}
                      </div>
                      {dashboard.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {dashboard.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {dashboard.widgets.length}
                    </Badge>
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:color-white hover:text-destructive-foreground"
                        onClick={(e) => handleDeleteDashboard(e, dashboard)}
                      >
                        <TrashIcon className="h-3 w-3 hover:text-white" />
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}

            {(!dashboards || dashboards.length === 0) && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">
                  No dashboards found
                </span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onCreateNew} className="text-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Dashboard
            </DropdownMenuItem>

            {onManage && (
              <DropdownMenuItem onClick={onManage}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Manage Dashboards
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);
DashboardSelector.displayName = "DashboardSelector";
