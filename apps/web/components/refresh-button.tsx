"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  timeUntilNext?: number;
  className?: string;
}

export function RefreshButton({
  onRefresh,
  isRefreshing,
  timeUntilNext,
  className,
}: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className={className}
      title={`Refresh dashboard data${timeUntilNext ? ` (auto-refresh in ${timeUntilNext}s)` : ""}`}
    >
      <RefreshCwIcon
        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
      />
      <span className="ml-2 hidden sm:inline">
        {isRefreshing
          ? "Refreshing..."
          : `Refresh${timeUntilNext ? ` (${timeUntilNext}s)` : ""}`}
      </span>
    </Button>
  );
}
