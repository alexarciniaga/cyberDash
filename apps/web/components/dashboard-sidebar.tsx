"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardLayout, WidgetConfig, GridLayoutItem } from "@/lib/types";
import { CreateDashboardModal } from "@/components/create-dashboard-modal";
import {
  PlusIcon,
  TrashIcon,
  LayoutDashboardIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/ui-utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";

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

function DashboardSidebarContent({
  dashboards = [],
  currentDashboard,
  onDashboardChange,
  onCreateNew,
  onDeleteCurrent,
  isCreating = false,
  isDeleting = false,
}: DashboardSidebarProps) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleDashboardClick = (dashboard: DashboardLayout) => {
    onDashboardChange(dashboard);
    setOpenMobile(false); // Close mobile sidebar when item is selected
  };

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="px-2 py-2">
          <h2 className="text-lg font-semibold">CyberDash</h2>
          <p className="text-sm text-muted-foreground">Security Dashboards</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboards.length === 0 ? (
                <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                  No dashboards found
                </div>
              ) : (
                dashboards.map((dashboard) => (
                  <SidebarMenuItem key={dashboard.id}>
                    <SidebarMenuButton
                      onClick={() => handleDashboardClick(dashboard)}
                      isActive={currentDashboard?.id === dashboard.id}
                      className="w-full justify-start"
                    >
                      <LayoutDashboardIcon className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
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
                        <ChevronRightIcon className="h-3 w-3 ml-auto" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-2 space-y-2">
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
              setOpenMobile(false);
            }}
            className="w-full"
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r">
      <DashboardSidebarContent {...props} />
    </Sidebar>
  );
}

export function DashboardSidebarProvider({
  children,
  ...props
}: DashboardSidebarProps & { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar {...props} />
        {children}
      </div>
    </SidebarProvider>
  );
}

export { SidebarTrigger };
