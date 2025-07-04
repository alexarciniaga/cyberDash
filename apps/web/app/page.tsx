"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardGrid } from "@/components/dashboard-grid";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { WidgetLibrary } from "@/components/widget-library";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRangeProvider } from "@/contexts/date-range-context";
import { EditableTitle } from "@/components/editable-title";
import { EditableDescription } from "@/components/editable-description";
import { CreateDashboardModal } from "@/components/create-dashboard-modal";
import { Button } from "@/components/ui/button";
import { DashboardLayout, WidgetConfig, GridLayoutItem } from "@/lib/types";
import {
  useDashboards,
  useDefaultDashboard,
  useCreateDashboard,
  useUpdateDashboard,
  useDeleteDashboard,
} from "@/lib/hooks/use-dashboards";
import { PlusIcon, RotateCcwIcon, BookOpenIcon } from "lucide-react";
import { getWidgetSize, generateSmartLayout } from "@/lib/widget-library-data";

// Complete dashboard template with all available widgets - will be used as template for new dashboards
const sampleDashboardTemplate = {
  name: "New Dashboard",
  description: "Complete cybersecurity dashboard with all available widgets",
  isDefault: false,
  widgets: [
    // CISA KEV Widgets
    {
      id: "cisa-kev-count",
      type: "metric_card" as const,
      title: "CISA KEV Total",
      description: "Known Exploited Vulnerabilities",
      dataSource: "cisa" as const,
      metricId: "total_count",
      refreshInterval: 60,
    },
    {
      id: "cisa-top-vendor",
      type: "vendor_card" as const,
      title: "Top Vendor",
      description: "Most vulnerable vendor",
      dataSource: "cisa" as const,
      metricId: "top_vendor",
      refreshInterval: 30,
    },
    {
      id: "cisa-vendor-leaderboard",
      type: "list" as const,
      title: "Vendor Leaderboard",
      description: "Top vendors by vulnerability count",
      dataSource: "cisa" as const,
      metricId: "vendor_breakdown",
      refreshInterval: 300,
    },
    {
      id: "cisa-due-date-compliance",
      type: "metric_card" as const,
      title: "Due Date Compliance",
      description: "Percentage of vulnerabilities not approaching due date",
      dataSource: "cisa" as const,
      metricId: "due_date_compliance",
      refreshInterval: 30,
    },
    {
      id: "cisa-vendor-breakdown",
      type: "table" as const,
      title: "Vendor Breakdown",
      description: "Vulnerabilities by vendor",
      dataSource: "cisa" as const,
      metricId: "vendor_breakdown",
      refreshInterval: 300,
    },
    {
      id: "cisa-new-vulns-rate",
      type: "chart" as const,
      title: "New Vulnerabilities Rate",
      description: "Rate of new vulnerabilities over time",
      dataSource: "cisa" as const,
      metricId: "new_vulns_rate",
      refreshInterval: 60,
    },
    {
      id: "cisa-product-distribution",
      type: "chart" as const,
      title: "Product Distribution",
      description: "Distribution of vulnerabilities by product",
      dataSource: "cisa" as const,
      metricId: "product_distribution",
      chartType: "pie" as const,
      refreshInterval: 300,
    },
    // NVD CVE Widgets
    {
      id: "nvd-cve-critical",
      type: "metric_card" as const,
      title: "Critical CVEs",
      description: "CVSS Score ≥ 9.0",
      dataSource: "nvd" as const,
      metricId: "critical_count",
      refreshInterval: 30,
    },
    {
      id: "nvd-publication-trends",
      type: "chart" as const,
      title: "CVE Publication Trends",
      description: "CVEs published over time",
      dataSource: "nvd" as const,
      metricId: "publication_trends",
      refreshInterval: 60,
    },
    {
      id: "nvd-severity-distribution",
      type: "table" as const,
      title: "Severity Distribution",
      description: "CVEs by CVSS severity levels",
      dataSource: "nvd" as const,
      metricId: "severity_distribution",
      refreshInterval: 300,
    },
    {
      id: "nvd-recent-high-severity",
      type: "list" as const,
      title: "Recent High Severity",
      description: "Recently published high severity CVEs",
      dataSource: "nvd" as const,
      metricId: "recent_high_severity",
      refreshInterval: 30,
    },
    {
      id: "nvd-vuln-status-summary",
      type: "table" as const,
      title: "Vulnerability Status Summary",
      description: "Summary of vulnerability statuses",
      dataSource: "nvd" as const,
      metricId: "vuln_status_summary",
      refreshInterval: 60,
    },
    // MITRE ATT&CK Widgets
    {
      id: "mitre-technique-count",
      type: "metric_card" as const,
      title: "ATT&CK Techniques",
      description: "Total techniques in framework",
      dataSource: "mitre" as const,
      metricId: "technique_count",
      refreshInterval: 3600,
    },
    {
      id: "mitre-tactics-coverage",
      type: "table" as const,
      title: "MITRE Tactics Coverage",
      description: "ATT&CK tactics and technique counts",
      dataSource: "mitre" as const,
      metricId: "tactics_coverage",
      refreshInterval: 300,
    },
    {
      id: "mitre-platform-coverage",
      type: "table" as const,
      title: "Platform Coverage",
      description: "ATT&CK technique coverage by platform",
      dataSource: "mitre" as const,
      metricId: "platform_coverage",
      refreshInterval: 300,
    },
    {
      id: "mitre-recent-updates",
      type: "list" as const,
      title: "Recent Framework Updates",
      description: "Latest MITRE ATT&CK technique updates and additions",
      dataSource: "mitre" as const,
      metricId: "recent_updates",
      refreshInterval: 300,
    },
    {
      id: "mitre-top-techniques",
      type: "list" as const,
      title: "Most Versatile Techniques",
      description: "Techniques spanning multiple tactics and platforms",
      dataSource: "mitre" as const,
      metricId: "top_techniques",
      refreshInterval: 300,
    },
  ],
};

// Generate layout for complete dashboard using optimized positioning from console output
const generateSampleLayout = (): GridLayoutItem[] => {
  // Improved layout organized by data source with better flow and grouping
  return [
    // === TOP ROW: KEY METRICS (Most Important Summary Data) ===
    { i: "cisa-kev-count", x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "nvd-cve-critical", x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "mitre-technique-count", x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: "cisa-due-date-compliance", x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },

    // === CISA SECTION (Rows 3-10) ===
    { i: "cisa-top-vendor", x: 0, y: 3, w: 4, h: 3, minW: 3, minH: 3 },
    { i: "cisa-vendor-leaderboard", x: 4, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
    { i: "cisa-vendor-breakdown", x: 8, y: 3, w: 4, h: 4, minW: 4, minH: 4 },

    { i: "cisa-new-vulns-rate", x: 0, y: 7, w: 8, h: 4, minW: 6, minH: 4 },
    {
      i: "cisa-product-distribution",
      x: 8,
      y: 7,
      w: 4,
      h: 4,
      minW: 4,
      minH: 4,
    },

    // === NVD SECTION (Rows 11-18) ===
    { i: "nvd-publication-trends", x: 0, y: 11, w: 12, h: 4, minW: 8, minH: 4 },

    {
      i: "nvd-severity-distribution",
      x: 0,
      y: 15,
      w: 6,
      h: 4,
      minW: 4,
      minH: 4,
    },
    {
      i: "nvd-recent-high-severity",
      x: 6,
      y: 15,
      w: 6,
      h: 4,
      minW: 4,
      minH: 4,
    },

    {
      i: "nvd-vuln-status-summary",
      x: 0,
      y: 19,
      w: 12,
      h: 3,
      minW: 6,
      minH: 3,
    },

    // === MITRE SECTION (Rows 22-29) ===
    { i: "mitre-tactics-coverage", x: 0, y: 22, w: 6, h: 4, minW: 4, minH: 4 },
    { i: "mitre-platform-coverage", x: 6, y: 22, w: 6, h: 4, minW: 4, minH: 4 },

    { i: "mitre-recent-updates", x: 0, y: 26, w: 6, h: 3, minW: 4, minH: 3 },
    { i: "mitre-top-techniques", x: 6, y: 26, w: 6, h: 3, minW: 4, minH: 3 },
  ];
};

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: dashboards, isLoading: dashboardsLoading } = useDashboards();
  const { data: defaultDashboard, isLoading: defaultLoading } =
    useDefaultDashboard();
  const createDashboard = useCreateDashboard();
  const updateDashboard = useUpdateDashboard();
  const deleteDashboard = useDeleteDashboard();

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
          layout: data.layout,
        });
        setCurrentDashboard(newDashboard);
        updateUrlDashboardId(newDashboard.id);
      } catch (error) {
        console.error("Failed to create dashboard:", error);
      }
    },
    [createDashboard, updateUrlDashboardId]
  );

  // Simple handler for sidebar (creates with default template)
  const handleCreateNewDashboardSimple = React.useCallback(async () => {
    await handleCreateNewDashboard({
      name: `Dashboard ${(dashboards?.length || 0) + 1}`,
      description: "Customize this dashboard with your preferred widgets",
      widgets: sampleDashboardTemplate.widgets,
      layout: generateSampleLayout(),
    });
  }, [handleCreateNewDashboard, dashboards]);

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

      // No need to reload - the UI will automatically show the empty state if no dashboards remain
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
        // Find the best position for the new widget
        const existingLayout = currentDashboard.layout;
        const maxY =
          existingLayout.length > 0
            ? Math.max(...existingLayout.map((item) => item.y + item.h))
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
            layout: [...currentDashboard.layout, newLayoutItem],
          },
        });

        // Update local state
        setCurrentDashboard({
          ...currentDashboard,
          widgets: [...currentDashboard.widgets, widget],
          layout: [...currentDashboard.layout, newLayoutItem],
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
        // Remove widget and its layout item
        const updatedWidgets = currentDashboard.widgets.filter(
          (w) => w.id !== widgetId
        );
        const updatedLayout = currentDashboard.layout.filter(
          (item) => item.i !== widgetId
        );

        await updateDashboard.mutateAsync({
          id: currentDashboard.id,
          data: {
            widgets: updatedWidgets,
            layout: updatedLayout,
          },
        });

        // Update local state
        setCurrentDashboard({
          ...currentDashboard,
          widgets: updatedWidgets,
          layout: updatedLayout,
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
          layout: optimizedLayout,
        },
      });

      // Update local state
      setCurrentDashboard({
        ...currentDashboard,
        layout: optimizedLayout,
      });
    } catch (error) {
      console.error("Failed to reset layout:", error);
      alert("Failed to reset layout. Please try again.");
    }
  }, [currentDashboard, updateDashboard]);

  // Removed auto-generation of default dashboard - users should manually create dashboards

  if (dashboardsLoading || defaultLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar
          dashboards={[]}
          currentDashboard={undefined}
          onDashboardChange={() => {}}
          onCreateNew={() => {}}
          onDelete={() => {}}
          onDeleteCurrent={() => {}}
          isCreating={false}
          isDeleting={false}
        />
        <div className="flex-1 lg:ml-64">
          <div className="container mx-auto p-6 lg:pl-8 xl:pl-12">
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
        </div>
      </div>
    );
  }

  return (
    <DateRangeProvider defaultPreset="30d">
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar
          dashboards={dashboards}
          currentDashboard={currentDashboard}
          onDashboardChange={handleDashboardChange}
          onCreateNew={handleCreateNewDashboard}
          onDelete={handleDeleteDashboard}
          onDeleteCurrent={handleDeleteCurrentDashboard}
          isCreating={createDashboard.isPending}
          isDeleting={deleteDashboard.isPending}
        />

        <div className="flex-1 lg:ml-64">
          <div className="container mx-auto p-6 lg:pl-8 xl:pl-12">
            {/* Mobile Header */}
            <div className="mb-6 lg:hidden pl-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  {currentDashboard ? (
                    <EditableTitle
                      title={currentDashboard.name}
                      onSave={handleUpdateTitle}
                      variant="mobile"
                      disabled={updateDashboard.isPending}
                      placeholder="Dashboard name..."
                    />
                  ) : (
                    <h1 className="text-2xl font-bold tracking-tight">
                      CyberDash
                    </h1>
                  )}
                  {currentDashboard && (
                    <EditableDescription
                      description={currentDashboard.description}
                      onSave={handleUpdateDescription}
                      variant="mobile"
                      disabled={updateDashboard.isPending}
                      placeholder="Add dashboard description..."
                      fallback="Click to add description"
                    />
                  )}
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(
                        "https://github.com/alexarciniaga/cyberDash/tree/main/docs",
                        "_blank"
                      )
                    }
                    className="h-9"
                    title="Open documentation on GitHub"
                  >
                    <BookOpenIcon className="h-4 w-4" />
                  </Button>
                  {currentDashboard && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetLayout}
                        disabled={updateDashboard.isPending}
                        className="h-9"
                      >
                        <RotateCcwIcon className="h-4 w-4" />
                      </Button>
                      <WidgetLibrary
                        currentWidgets={currentDashboard.widgets}
                        onAddWidget={handleAddWidget}
                        disabled={updateDashboard.isPending}
                      />
                    </>
                  )}
                </div>
              </div>
              <DateRangePicker className="max-w-sm" />
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-6 lg:ml-[16px]">
              <div className="flex items-start justify-between">
                <div>
                  {currentDashboard ? (
                    <EditableTitle
                      title={currentDashboard.name}
                      onSave={handleUpdateTitle}
                      variant="desktop"
                      disabled={updateDashboard.isPending}
                      placeholder="Dashboard name..."
                    />
                  ) : (
                    <h1 className="text-3xl font-bold tracking-tight">
                      CyberDash
                    </h1>
                  )}
                  {currentDashboard ? (
                    <EditableDescription
                      description={currentDashboard.description}
                      onSave={handleUpdateDescription}
                      variant="desktop"
                      disabled={updateDashboard.isPending}
                      placeholder="Add dashboard description..."
                      fallback="Cybersecurity metrics dashboard with real-time threat intelligence"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      Cybersecurity metrics dashboard with real-time threat
                      intelligence
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <DateRangePicker />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(
                        "https://github.com/alexarciniaga/cyberDash/tree/main/docs",
                        "_blank"
                      )
                    }
                    className="h-9"
                    title="Open documentation on GitHub"
                  >
                    <BookOpenIcon className="h-4 w-4 mr-2" />
                    Docs
                  </Button>
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
              </div>
            </div>

            {currentDashboard ? (
              <>
                <DashboardGrid
                  dashboard={currentDashboard}
                  onLayoutChange={handleLayoutChange}
                  onRemoveWidget={handleRemoveWidget}
                  className="min-h-[600px]"
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
        </div>
      </div>
    </DateRangeProvider>
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
