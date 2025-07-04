"use client";

import * as React from "react";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDateRange } from "@/contexts/app-context";

export type DateRangePreset = "24h" | "7d" | "30d" | "90d";
import { cn } from "@/lib/ui-utils";

const presetOptions: Array<{
  value: DateRangePreset;
  label: string;
  description: string;
}> = [
  { value: "24h", label: "Last 24 Hours", description: "Most recent data" },
  { value: "7d", label: "Last 7 Days", description: "Past week" },
  { value: "30d", label: "Last 30 Days", description: "Past month" },
  { value: "90d", label: "Last 90 Days", description: "Past quarter" },
];

interface DateRangePickerProps {
  className?: string;
}

export const DateRangePicker = React.memo<DateRangePickerProps>(
  function DateRangePicker({ className }) {
    const { preset, setPreset } = useDateRange();

    const handlePresetChange = React.useCallback(
      (newPreset: DateRangePreset) => {
        setPreset(newPreset);
      },
      [setPreset]
    );

    const currentPreset = React.useMemo(
      () => presetOptions.find((p) => p.value === preset),
      [preset]
    );

    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {/* Main Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="justify-between min-w-[200px] h-9"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {currentPreset?.label || "Select Range"}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            {presetOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handlePresetChange(option.value)}
                className="flex flex-col items-start gap-1 p-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      preset === option.value ? "bg-primary" : "bg-muted"
                    )}
                  />
                  <span className="font-medium">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-4">
                  {option.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);
DateRangePicker.displayName = "DateRangePicker";

// Helper function to format date for datetime-local input
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
