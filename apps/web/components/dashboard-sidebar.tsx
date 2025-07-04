"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { DashboardLayout, WidgetConfig, GridLayoutItem } from "@/lib/types";
import { CreateDashboardModal } from "@/components/create-dashboard-modal";
import {
  MenuIcon,
  PlusIcon,
  TrashIcon,
  LayoutDashboardIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/ui-utils";

interface DashboardSidebarProps {
  dashboards?: DashboardLayout[];
  currentDashboard?: DashboardLayout;
  onDashboardChange: (dashboard: DashboardLayout) => void;
  onCreateNew: (data: {
    name: string;
    description?: string;
    widgets: WidgetConfig[];
    layout: GridLayoutItem[];
  }) => void;
  onDelete: (dashboard: DashboardLayout) => void;
  onDeleteCurrent: () => void;
  isCreating?: boolean;
  isDeleting?: boolean;
}

export function DashboardSidebar({
  dashboards = [],
  currentDashboard,
  onDashboardChange,
  onCreateNew,
  onDelete,
  onDeleteCurrent,
  isCreating = false,
  isDeleting = false,
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      {/* Desktop Sidebar Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:fixed top-4 left-4 z-50"
      >
        <MenuIcon className="h-4 w-4" />
      </Button>

      {/* Mobile Sheet Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {/* Mobile Menu Trigger */}
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed top-6 right-4 z-50 lg:hidden"
          >
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-64 max-w-[85vw] p-0 lg:relative lg:translate-x-0 lg:w-full"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="text-left">CyberDash</SheetTitle>
              <SheetDescription className="text-left">
                Security Dashboards
              </SheetDescription>
            </SheetHeader>

            {/* Dashboard List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  DASHBOARDS
                </h3>
              </div>

              {dashboards.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No dashboards found
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboards.map((dashboard) => (
                    <div
                      key={dashboard.id}
                      className={cn(
                        "flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                        currentDashboard?.id === dashboard.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => {
                        onDashboardChange(dashboard);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <LayoutDashboardIcon className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {dashboard.name}
                          </div>
                          {dashboard.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {dashboard.description}
                            </div>
                          )}
                        </div>
                        {currentDashboard?.id === dashboard.id && (
                          <ChevronRightIcon className="h-3 w-3 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <SheetFooter className="p-4 border-t space-y-2">
              {currentDashboard && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteCurrent}
                  disabled={isDeleting}
                  className="w-full"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete Current"}
                </Button>
              )}

              <CreateDashboardModal
                onCreateDashboard={onCreateNew}
                isCreating={isCreating}
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCreating}
                  className="w-full"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {isCreating ? "Creating..." : "New Dashboard"}
                </Button>
              </CreateDashboardModal>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push("/settings");
                  setIsOpen(false);
                }}
                className="w-full"
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-background border-r border-border z-40">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">CyberDash</h2>
              <p className="text-sm text-muted-foreground">
                Security Dashboards
              </p>
            </div>
          </div>

          {/* Dashboard List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                DASHBOARDS
              </h3>
            </div>

            {dashboards.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No dashboards found
              </div>
            ) : (
              <div className="space-y-1">
                {dashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                      currentDashboard?.id === dashboard.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => onDashboardChange(dashboard)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <LayoutDashboardIcon className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {dashboard.name}
                        </div>
                        {dashboard.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {dashboard.description}
                          </div>
                        )}
                      </div>
                      {currentDashboard?.id === dashboard.id && (
                        <ChevronRightIcon className="h-3 w-3 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t space-y-2">
            {currentDashboard && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteCurrent}
                disabled={isDeleting}
                className="w-full"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Current"}
              </Button>
            )}

            <CreateDashboardModal
              onCreateDashboard={onCreateNew}
              isCreating={isCreating}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={isCreating}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {isCreating ? "Creating..." : "New Dashboard"}
              </Button>
            </CreateDashboardModal>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/settings")}
              className="w-full"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
