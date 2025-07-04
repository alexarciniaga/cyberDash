"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WidgetConfig, GridLayoutItem } from "@/lib/types";
import {
  WIDGET_LIBRARY,
  WIDGET_TYPE_INFO,
  getWidgetSize,
  generateSmartLayout,
} from "@/lib/widget-library-data";
import { Activity } from "lucide-react";
import { cn } from "@/lib/ui-utils";

// Widget library data is imported from shared module

interface DashboardFormData {
  name: string;
  description: string;
  selectedWidgets: string[];
}

interface CreateDashboardModalProps {
  onCreateDashboard: (data: {
    name: string;
    description?: string;
    widgets: WidgetConfig[];
    layout: GridLayoutItem[];
  }) => void;
  isCreating?: boolean;
  children: React.ReactNode;
}

export function CreateDashboardModal({
  onCreateDashboard,
  isCreating = false,
  children,
}: CreateDashboardModalProps) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<DashboardFormData>({
    defaultValues: {
      name: "",
      description: "",
      selectedWidgets: [],
    },
  });

  // Flatten all widgets for easier access
  const allWidgets = React.useMemo(() => {
    const widgets: WidgetConfig[] = [];
    Object.entries(WIDGET_LIBRARY).forEach(([category, categoryWidgets]) => {
      widgets.push(...categoryWidgets);
    });
    return widgets;
  }, []);

  // Generate smart layout for selected widgets - automatically handles gaps and sizing

  const onSubmit = (data: DashboardFormData) => {
    const selectedWidgetConfigs = allWidgets.filter((widget) =>
      data.selectedWidgets.includes(widget.id)
    );

    const layout = generateSmartLayout(data.selectedWidgets);

    onCreateDashboard({
      name: data.name,
      description: data.description || undefined,
      widgets: selectedWidgetConfigs,
      layout,
    });

    form.reset();
    setOpen(false);
  };

  const selectedWidgets = form.watch("selectedWidgets");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="!max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-lg">Create New Dashboard</DialogTitle>
          <DialogDescription className="text-sm">
            Create a custom dashboard with your preferred widgets and layout.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Dashboard name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Dashboard Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Security Dashboard"
                          {...field}
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Description (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A comprehensive view of our security metrics..."
                          {...field}
                          className="min-h-[80px] resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Describe what this dashboard will be used for.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">
                    Selected Widgets ({selectedWidgets.length})
                  </h4>
                  {selectedWidgets.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No widgets selected. Choose widgets from the right panel.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {selectedWidgets.map((widgetId) => {
                        const widget = allWidgets.find(
                          (w) => w.id === widgetId
                        );
                        if (!widget) return null;

                        const TypeIcon =
                          WIDGET_TYPE_INFO[widget.type]?.icon || Activity;

                        return (
                          <div
                            key={widgetId}
                            className="flex items-center gap-3 text-sm p-3 bg-muted rounded-lg"
                          >
                            <TypeIcon className="h-4 w-4" />
                            <span className="font-medium flex-1">
                              {widget.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {widget.type.replace("_", " ")}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Widget Selection */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Available Widgets</h4>
                    <FormField
                      control={form.control}
                      name="selectedWidgets"
                      render={({ field }) => {
                        const allWidgetIds = allWidgets.map((w) => w.id);
                        const isAllSelected = allWidgetIds.every((id) =>
                          field.value?.includes(id)
                        );

                        return (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={isAllSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange(allWidgetIds);
                                    } else {
                                      field.onChange([]);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-medium cursor-pointer">
                                Select All ({allWidgetIds.length})
                              </FormLabel>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-6 pr-2">
                    {Object.entries(WIDGET_LIBRARY).map(
                      ([category, widgets]) => (
                        <div key={category}>
                          <h5 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                            {category}
                          </h5>
                          <div className="space-y-3">
                            {widgets.map((widget) => {
                              const WidgetIcon = widget.icon || Activity;
                              const typeInfo = WIDGET_TYPE_INFO[widget.type];
                              const TypeIcon = typeInfo?.icon || Activity;

                              return (
                                <FormField
                                  key={widget.id}
                                  control={form.control}
                                  name="selectedWidgets"
                                  render={({ field }) => (
                                    <FormItem>
                                      <div className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                                        <FormControl>
                                          <Checkbox
                                            checked={
                                              field.value?.includes(
                                                widget.id
                                              ) || false
                                            }
                                            onCheckedChange={(checked) => {
                                              const current = field.value || [];
                                              if (checked) {
                                                field.onChange([
                                                  ...current,
                                                  widget.id,
                                                ]);
                                              } else {
                                                field.onChange(
                                                  current.filter(
                                                    (id) => id !== widget.id
                                                  )
                                                );
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                          <div className="p-2 bg-muted rounded-md">
                                            <WidgetIcon className="h-5 w-5" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <FormLabel className="text-sm font-medium cursor-pointer block mb-1">
                                              {widget.title}
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                              {widget.description}
                                            </p>
                                          </div>
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              "text-xs",
                                              typeInfo.color
                                            )}
                                          >
                                            <TypeIcon className="h-3 w-3 mr-1" />
                                            {widget.type.replace("_", " ")}
                                          </Badge>
                                        </div>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCreating}
                className="px-6"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="px-6">
                {isCreating ? "Creating..." : "Create Dashboard"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
