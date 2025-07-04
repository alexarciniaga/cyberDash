"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardGrid } from "@/components/dashboard-grid";
import {
  DashboardSidebarProvider,
  SidebarTrigger,
} from "@/components/dashboard-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { WidgetLibrary } from "@/components/widget-library";
import { DateRangePicker } from "@/components/date-range-picker";
import { EditableTitle } from "@/components/editable-title";
import { EditableDescription } from "@/components/editable-description";
import { CreateDashboardModal } from "@/components/create-dashboard-modal";
import { RefreshButton } from "@/components/refresh-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DashboardLayout, WidgetConfig, GridLayoutItem } from "@/lib/types";
import {
  useDashboards,
  useDefaultDashboard,
  useCreateDashboard,
  useUpdateDashboard,
  useDeleteDashboard,
} from "@/lib/hooks/use-dashboards";
import { useDashboardRefresh } from "@/lib/hooks/use-dashboard-refresh";
import { PlusIcon, RotateCcwIcon, BookOpenIcon } from "lucide-react";
import { getWidgetSize, generateSmartLayout } from "@/lib/widget-library-data";
import { useDebouncedCallback } from "use-debounce";
import { AppProvider } from "@/contexts/app-context";
import {
  sampleDashboardTemplate,
  generateSampleLayout,
} from "@/lib/dashboard-templates";

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: dashboards, isLoading: dashboardsLoading } = useDashboards();
  const { data: defaultDashboard, isLoading: defaultLoading } =
    useDefaultDashboard();
  const createDashboard = useCreateDashboard();
  const updateDashboard = useUpdateDashboard();
  const deleteDashboard = useDeleteDashboard();
  const { refresh, isRefreshing, timeUntilNext } = useDashboardRefresh();

  const [currentDashboard, setCurrentDashboard] = React.useState<
    DashboardLayout | undefined
  >();

  // Helper function to update URL parameters
  const updateUrlDashboardId = React.useCallback(
    (dashboardId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (dashboardId) {
        params.set("dashboard-id", dashboardId);
      } else {
        params.delete("dashboard-id");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Set initial dashboard from URL parameter, auto-open first dashboard, or default dashboard
  React.useEffect(() => {
    if (dashboards && dashboards.length > 0 && !currentDashboard) {
      const dashboardIdFromUrl = searchParams.get("dashboard-id");

      if (dashboardIdFromUrl) {
        // Try to find dashboard from URL parameter
        const dashboardFromUrl = dashboards.find(
          (d) => d.id === dashboardIdFromUrl
        );
        if (dashboardFromUrl) {
          setCurrentDashboard(dashboardFromUrl);
          return;
        }
      }

      // If no URL parameter (accessing root), automatically open the first dashboard
      if (!dashboardIdFromUrl) {
        const firstDashboard = dashboards[0];
        if (firstDashboard) {
          setCurrentDashboard(firstDashboard);
          updateUrlDashboardId(firstDashboard.id);
          return;
        }
      }

      // Fall back to default dashboard if dashboard from URL not found
      if (defaultDashboard) {
        setCurrentDashboard(defaultDashboard);
        updateUrlDashboardId(defaultDashboard.id);
      }
    }
  }, [
    dashboards,
    defaultDashboard,
    currentDashboard,
    searchParams,
    updateUrlDashboardId,
  ]);

  // Handle dashboard changes and persist layout changes
  const handleLayoutChange = React.useCallback(
    async (layout: any, layouts: any) => {
      if (!currentDashboard) return;

      try {
        await updateDashboard.mutateAsync({
          id: currentDashboard.id,
          data: {
            layout: layouts.lg || layout,
          },
        });
      } catch (error) {
        console.error("Failed to save layout changes:", error);
      }
    },
    [currentDashboard, updateDashboard]
  );

  // Handle dashboard switching
  const handleDashboardChange = React.useCallback(
    (dashboard: DashboardLayout) => {
      setCurrentDashboard(dashboard);
      updateUrlDashboardId(dashboard.id);
    },
    [updateUrlDashboardId]
  );

  // Handle creating new dashboard from modal
  const handleCreateNewDashboard = React.useCallback(
    async (data: {
      name: string;
      description?: string;
      widgets: WidgetConfig[];
      layout: GridLayoutItem[];
    }) => {
      try {
        const newDashboard = await createDashboard.mutateAsync({
          name: data.name,
          description: data.description,
          isDefault: false,
          widgets: data.widgets,
          layout: { lg: data.layout },
        });
        setCurrentDashboard(newDashboard);
        updateUrlDashboardId(newDashboard.id);
      } catch (error) {
        console.error("Failed to create dashboard:", error);
      }
    },
    [createDashboard, updateUrlDashboardId]
  );

  // Handle deleting current dashboard
  const handleDeleteCurrentDashboard = React.useCallback(async () => {
    if (!currentDashboard) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentDashboard.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteDashboard.mutateAsync(currentDashboard.id);
      setCurrentDashboard(undefined);
      updateUrlDashboardId(null);
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
      alert("Failed to delete dashboard. Please try again.");
    }
  }, [currentDashboard, deleteDashboard, updateUrlDashboardId]);

  // Handle deleting any dashboard from selector
  const handleDeleteDashboard = React.useCallback(
    async (dashboard: DashboardLayout) => {
      try {
        await deleteDashboard.mutateAsync(dashboard.id);

        // If the deleted dashboard was the current one, switch to another
        if (currentDashboard?.id === dashboard.id) {
          if (dashboards) {
            const remainingDashboards = dashboards.filter(
              (d) => d.id !== dashboard.id
            );
            if (remainingDashboards.length > 0) {
              const firstDashboard = remainingDashboards[0]!;
              setCurrentDashboard(firstDashboard);
              updateUrlDashboardId(firstDashboard.id);
            } else {
              setCurrentDashboard(undefined);
              updateUrlDashboardId(null);
            }
          } else {
            setCurrentDashboard(undefined);
            updateUrlDashboardId(null);
          }
        }
      } catch (error) {
        console.error("Failed to delete dashboard:", error);
        alert("Failed to delete dashboard. Please try again.");
      }
    },
    [currentDashboard, dashboards, deleteDashboard, updateUrlDashboardId]
  );

  // Handle adding widget to current dashboard
  const handleAddWidget = React.useCallback(
    async (widget: WidgetConfig) => {
      if (!currentDashboard) return;

      try {
        // Find the best position for the new widget based on the 'lg' layout
        const existingLgLayout = currentDashboard.layout?.lg || [];
        const maxY =
          existingLgLayout.length > 0
            ? Math.max(...existingLgLayout.map((item) => item.y + item.h))
            : 0;

        // Create new layout item for the widget
        // Get default size for this specific widget or fall back to widget type
        const defaultSize = getWidgetSize(widget);

        const newLayoutItem: GridLayoutItem = {
          i: widget.id,
          x: 0,
          y: maxY,
          w: defaultSize.w,
          h: defaultSize.h,
          minW: defaultSize.minW,
          minH: defaultSize.minH,
        };

        // Update dashboard with new widget and layout
        await updateDashboard.mutateAsync({
          id: currentDashboard.id,
          data: {
            widgets: [...currentDashboard.widgets, widget],
            layout: {
              ...currentDashboard.layout,
              lg: [...existingLgLayout, newLayoutItem],
            },
          },
        });

        // Update local state
        setCurrentDashboard({
          ...currentDashboard,
          widgets: [...currentDashboard.widgets, widget],
          layout: {
            ...currentDashboard.layout,
            lg: [...existingLgLayout, newLayoutItem],
          },
        });
      } catch (error) {
        console.error("Failed to add widget:", error);
        alert("Failed to add widget. Please try again.");
      }
    },
    [currentDashboard, updateDashboard]
  );

  // Handle removing widget from current dashboard
  const handleRemoveWidget = React.useCallback(
    async (widgetId: string) => {
      if (!currentDashboard) return;

      const confirmed = window.confirm(
        "Are you sure you want to remove this widget? This action cannot be undone."
      );

      if (!confirmed) return;

      try {
        // Remove widget and its layout item from the 'lg' breakpoint
        const updatedWidgets = currentDashboard.widgets.filter(
          (w) => w.id !== widgetId
        );
        const updatedLgLayout = (currentDashboard.layout?.lg || []).filter(
          (item) => item.i !== widgetId
        );

        await updateDashboard.mutateAsync({
          id: currentDashboard.id,
          data: {
            widgets: updatedWidgets,
            layout: { ...currentDashboard.layout, lg: updatedLgLayout },
          },
        });

        // Update local state
        setCurrentDashboard({
          ...currentDashboard,
          widgets: updatedWidgets,
          layout: { ...currentDashboard.layout, lg: updatedLgLayout },
        });
      } catch (error) {
        console.error("Failed to remove widget:", error);
        alert("Failed to remove widget. Please try again.");
      }
    },
    [currentDashboard, updateDashboard]
  );

  // Handle updating dashboard title
  const handleUpdateTitle = React.useCallback(
    async (newTitle: string) => {
      if (!currentDashboard) return;

      try {
        const updatedDashboard = await updateDashboard.mutateAsync({
          id: currentDashboard.id,
          data: {
            name: newTitle,
          },
        });

        // Update local state
        setCurrentDashboard({
          ...currentDashboard,
          name: newTitle,
          updatedAt: updatedDashboard.updatedAt,
        });
      } catch (error) {
        console.error("Failed to update dashboard title:", error);
        throw error; // Re-throw to let the component handle the error
      }
    },
    [currentDashboard, updateDashboard]
  );

  // Handle updating dashboard description
  const handleUpdateDescription = React.useCallback(
    async (newDescription: string) => {
      if (!currentDashboard) return;

      try {
        const updatedDashboard = await updateDashboard.mutateAsync({
          id: currentDashboard.id,
          data: {
            description: newDescription || undefined, // Convert empty string to undefined
          },
        });

        // Update local state
        setCurrentDashboard({
          ...currentDashboard,
          description: newDescription || undefined,
          updatedAt: updatedDashboard.updatedAt,
        });
      } catch (error) {
        console.error("Failed to update dashboard description:", error);
        throw error; // Re-throw to let the component handle the error
      }
    },
    [currentDashboard, updateDashboard]
  );

  // Handle resetting dashboard layout to default
  const handleResetLayout = React.useCallback(async () => {
    if (!currentDashboard) return;

    const confirmed = window.confirm(
      "Are you sure you want to reset the layout? This will arrange all widgets in an optimized layout without gaps."
    );

    if (!confirmed) return;

    try {
      // Generate smart layout for current widgets - automatically handles gaps and sizing
      const currentWidgetIds = currentDashboard.widgets.map((w) => w.id);
      const optimizedLayout = generateSmartLayout(currentWidgetIds);

      await updateDashboard.mutateAsync({
        id: currentDashboard.id,
        data: {
          layout: { lg: optimizedLayout },
        },
      });

      // Update local state
      setCurrentDashboard({
        ...currentDashboard,
        layout: { lg: optimizedLayout },
      });
    } catch (error) {
      console.error("Failed to reset layout:", error);
      alert("Failed to reset layout. Please try again.");
    }
  }, [currentDashboard, updateDashboard]);

  if (dashboardsLoading || defaultLoading) {
    return (
      <DashboardSidebarProvider
        dashboards={[]}
        currentDashboard={undefined}
        onDashboardChange={() => {}}
        onCreateNew={() => {}}
        onDelete={() => {}}
        onDeleteCurrent={() => {}}
        isCreating={false}
        isDeleting={false}
      >
        <SidebarInset>
          <div className="flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
          </div>
          <div className="flex-1 space-y-4 p-4 md:p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-96"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </DashboardSidebarProvider>
    );
  }

  return (
    <AppProvider initialDashboard={currentDashboard}>
      <DashboardSidebarProvider
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        onDashboardChange={handleDashboardChange}
        onCreateNew={handleCreateNewDashboard}
        onDelete={handleDeleteDashboard}
        onDeleteCurrent={handleDeleteCurrentDashboard}
        isCreating={createDashboard.isPending}
        isDeleting={deleteDashboard.isPending}
      >
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1 min-w-0 mr-4">
                {currentDashboard ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <h1 className="text-lg font-semibold truncate">
                      {currentDashboard.name}
                    </h1>
                    {currentDashboard.description && (
                      <span className="text-sm text-muted-foreground truncate">
                        {currentDashboard.description}
                      </span>
                    )}
                  </div>
                ) : (
                  <h1 className="text-lg font-semibold">CyberDash</h1>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentDashboard && (
                  <RefreshButton
                    onRefresh={refresh}
                    isRefreshing={isRefreshing}
                    timeUntilNext={timeUntilNext}
                    className="h-9"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(
                      "https://github.com/alexarciniaga/cyberDash/tree/main/docs",
                      "_blank"
                    )
                  }
                  className="h-9 w-9 p-0"
                  title="Open documentation on GitHub"
                >
                  <BookOpenIcon className="h-4 w-4" />
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 space-y-4 p-2 md:p-4 lg:p-6 xl:p-8">
            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <DateRangePicker />
              </div>
              {currentDashboard && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetLayout}
                    disabled={updateDashboard.isPending}
                    className="h-9"
                    title="Reset layout to default organization"
                  >
                    <RotateCcwIcon className="h-4 w-4 mr-2" />
                    Reset Layout
                  </Button>
                  <WidgetLibrary
                    currentWidgets={currentDashboard.widgets}
                    onAddWidget={handleAddWidget}
                    disabled={updateDashboard.isPending}
                  />
                </div>
              )}
            </div>

            {/* Dashboard Content */}
            {currentDashboard ? (
              <>
                <DashboardGrid
                  dashboardId={currentDashboard.id}
                  onRemoveWidget={handleRemoveWidget}
                />

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>✨ Drag and resize widgets to customize your dashboard</p>
                  <p className="mt-1">
                    Click "Add Widget" to add new components • Hover over
                    widgets to see remove option
                  </p>
                  <p className="mt-1">All changes are automatically saved</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="text-muted-foreground">
                    No dashboards found. Create your first dashboard to get
                    started.
                  </div>
                  <CreateDashboardModal
                    onCreateDashboard={handleCreateNewDashboard}
                    isCreating={createDashboard.isPending}
                  >
                    <Button disabled={createDashboard.isPending}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {createDashboard.isPending
                        ? "Creating..."
                        : "Create Dashboard"}
                    </Button>
                  </CreateDashboardModal>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </DashboardSidebarProvider>
    </AppProvider>
  );
}

export default function Page() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PageContent />
    </React.Suspense>
  );
}
