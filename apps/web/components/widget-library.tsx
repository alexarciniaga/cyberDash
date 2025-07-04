"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WidgetConfig } from "@/lib/types";
import {
  PlusIcon,
  BarChart3Icon,
  TableIcon,
  ListIcon,
  Activity,
  Shield,
  Target,
  TrendingUpIcon,
  SearchIcon,
  GaugeIcon,
} from "lucide-react";
import { cn } from "@/lib/ui-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WIDGET_LIBRARY, WIDGET_TYPE_INFO } from "@/lib/widget-library-data";

// Widget library data is imported from shared module

interface WidgetLibraryProps {
  currentWidgets: WidgetConfig[];
  onAddWidget: (widget: WidgetConfig) => void;
  disabled?: boolean;
}

// Memoized widget item component
const WidgetItem = React.memo<{
  widget: any;
  onAddWidget: (widget: WidgetConfig) => void;
  currentWidgets: WidgetConfig[];
}>(({ widget, onAddWidget, currentWidgets }) => {
  const typeInfo =
    WIDGET_TYPE_INFO[widget.type as keyof typeof WIDGET_TYPE_INFO];
  const TypeIcon = typeInfo?.icon || Activity;
  const WidgetIcon = widget.icon || Activity;

  // Calculate usage count for this widget template
  const usageCount = React.useMemo(() => {
    // Count widgets that have the same base ID (before any "-1", "-2" suffixes)
    return currentWidgets.filter((currentWidget) => {
      // Extract base ID by removing suffix patterns like "-1", "-2", etc.
      const baseCurrentId = currentWidget.id.replace(/-\d+$/, "");
      return baseCurrentId === widget.id;
    }).length;
  }, [currentWidgets, widget.id]);

  const handleClick = React.useCallback(() => {
    onAddWidget(widget);
  }, [widget, onAddWidget]);

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:bg-accent/50"
    >
      <div className="p-2 bg-muted rounded-md">
        <WidgetIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{widget.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {widget.description}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Usage counter badge */}
        {usageCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary border-primary/20 cursor-help"
                >
                  {usageCount} used
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  This widget is currently used {usageCount} time
                  {usageCount !== 1 ? "s" : ""} on your dashboard
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Badge variant="secondary" className={cn("text-xs", typeInfo.color)}>
          <TypeIcon className="h-3 w-3 mr-1" />
          {widget.type.replace("_", " ")}
        </Badge>
      </div>
    </div>
  );
});
WidgetItem.displayName = "WidgetItem";

// Memoized widget category component
const WidgetCategory = React.memo<{
  category: string;
  widgets: any[];
  onAddWidget: (widget: WidgetConfig) => void;
  currentWidgets: WidgetConfig[];
}>(({ category, widgets, onAddWidget, currentWidgets }) => (
  <div>
    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
      {category}
    </h3>
    <div className="space-y-2">
      {widgets.map((widget: any) => (
        <WidgetItem
          key={widget.id}
          widget={widget}
          onAddWidget={onAddWidget}
          currentWidgets={currentWidgets}
        />
      ))}
    </div>
  </div>
));
WidgetCategory.displayName = "WidgetCategory";

export const WidgetLibrary = React.memo<WidgetLibraryProps>(
  function WidgetLibrary({ currentWidgets, onAddWidget, disabled = false }) {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    // Flatten all widgets for search with memoization
    const allWidgets = React.useMemo(() => {
      const widgets: Array<
        WidgetConfig & { searchTerms: string[]; icon: any; category: string }
      > = [];
      Object.entries(WIDGET_LIBRARY).forEach(([category, categoryWidgets]) => {
        widgets.push(...categoryWidgets);
      });
      return widgets;
    }, []);

    // Filter widgets based on search term with memoization
    const filteredCategories = React.useMemo(() => {
      if (!searchTerm.trim()) {
        return WIDGET_LIBRARY;
      }

      const filtered: Record<string, any[]> = {};
      const lowerSearchTerm = searchTerm.toLowerCase();

      Object.entries(WIDGET_LIBRARY).forEach(([category, widgets]) => {
        const matchingWidgets = widgets.filter(
          (widget) =>
            widget.title.toLowerCase().includes(lowerSearchTerm) ||
            widget.description.toLowerCase().includes(lowerSearchTerm) ||
            widget.searchTerms.some((term) =>
              term.toLowerCase().includes(lowerSearchTerm)
            ) ||
            category.toLowerCase().includes(lowerSearchTerm)
        );

        if (matchingWidgets.length > 0) {
          filtered[category] = matchingWidgets;
        }
      });

      return filtered;
    }, [searchTerm]);

    // Memoized add widget handler
    const handleAddWidget = React.useCallback(
      (widget: WidgetConfig) => {
        // Generate unique ID if widget already exists, but keep the original title
        const finalWidget = { ...widget };
        const existingIds = currentWidgets.map((w) => w.id);

        if (existingIds.includes(widget.id)) {
          let counter = 1;
          let newId = `${widget.id}-${counter}`;
          while (existingIds.includes(newId)) {
            counter++;
            newId = `${widget.id}-${counter}`;
          }
          finalWidget.id = newId;
          // Keep the original title - no (1), (2) suffixes
          // The widgets will display the same title but have unique IDs internally
        }

        onAddWidget(finalWidget);
        setOpen(false);
      },
      [currentWidgets, onAddWidget]
    );

    // Memoized search handler
    const handleSearchChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
      },
      []
    );

    const hasFilteredResults = Object.keys(filteredCategories).length > 0;

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Widget Library</DialogTitle>
            <DialogDescription>
              Search and add widgets to customize your dashboard. All widgets
              use live data from your database.
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="px-6 pb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Widget List */}
          <div className="px-6 max-h-[500px] overflow-y-auto">
            {!hasFilteredResults ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No widgets found matching &quot;{searchTerm}&quot;
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredCategories).map(
                  ([category, widgets]) => (
                    <WidgetCategory
                      key={category}
                      category={category}
                      widgets={widgets}
                      onAddWidget={handleAddWidget}
                      currentWidgets={currentWidgets}
                    />
                  )
                )}
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> All widgets are verified to work with your
                current database. You can add multiple instances of the same
                widget to create custom dashboard layouts. The usage counter
                shows how many times each widget is currently used on your
                dashboard.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
WidgetLibrary.displayName = "WidgetLibrary";
