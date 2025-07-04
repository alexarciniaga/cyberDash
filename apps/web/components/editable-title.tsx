"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/ui-utils";

interface EditableTitleProps {
  title: string;
  onSave: (newTitle: string) => Promise<void> | void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  variant?: "desktop" | "mobile";
}

export const EditableTitle = React.memo<EditableTitleProps>(
  function EditableTitle({
    title,
    onSave,
    className,
    placeholder = "Enter title...",
    disabled = false,
    maxLength = 100,
    variant = "desktop",
  }: EditableTitleProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(title);
    const [isLoading, setIsLoading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Update edit value when title prop changes
    React.useEffect(() => {
      setEditValue(title);
    }, [title]);

    // Focus input when entering edit mode
    React.useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleStartEdit = React.useCallback(() => {
      if (disabled) return;
      setIsEditing(true);
      setEditValue(title);
    }, [disabled, title]);

    const handleCancel = React.useCallback(() => {
      setIsEditing(false);
      setEditValue(title);
    }, [title]);

    const handleSave = React.useCallback(async () => {
      const trimmedValue = editValue.trim();

      // Don't save if empty or unchanged
      if (!trimmedValue || trimmedValue === title) {
        handleCancel();
        return;
      }

      setIsLoading(true);
      try {
        await onSave(trimmedValue);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to save title:", error);
        // Keep in edit mode on error
      } finally {
        setIsLoading(false);
      }
    }, [editValue, title, onSave, handleCancel]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleCancel();
        }
      },
      [handleSave, handleCancel]
    );

    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
      },
      []
    );

    const isMobile = variant === "mobile";
    const titleClass = isMobile ? "text-2xl" : "text-3xl";
    const iconSize = isMobile ? "h-3 w-3" : "h-4 w-4";
    const buttonSize = isMobile ? "h-7 w-7" : "h-8 w-8";

    if (isEditing) {
      return (
        <div className={cn("group flex items-center gap-2 w-full", className)}>
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={isLoading}
              className={cn(
                "bg-transparent border-none outline-none w-full font-bold tracking-tight",
                titleClass
              )}
              style={{
                fontSize: "inherit",
                lineHeight: "inherit",
                fontFamily: "inherit",
                fontWeight: "inherit",
                letterSpacing: "inherit",
                margin: 0,
                padding: 0,
                boxShadow: "none",
                appearance: "none",
                WebkitAppearance: "none",
                border: "none",
                outline: "none",
                background: "transparent",
              }}
            />
          </div>
          <div className="flex items-center gap-1 ml-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className={cn(
                "p-0 hover:bg-green-100 hover:text-green-700",
                buttonSize
              )}
            >
              <CheckIcon className={iconSize} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className={cn(
                "p-0 hover:bg-red-100 hover:text-red-700",
                buttonSize
              )}
            >
              <XIcon className={iconSize} />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "group flex items-center gap-2 w-full cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={handleStartEdit}
        title={disabled ? "Editing disabled" : "Click to edit title"}
      >
        <div className="flex-1 min-w-0">
          <h1 className={cn("font-bold tracking-tight", titleClass)}>
            {title}
          </h1>
        </div>
        {!disabled && (
          <div className="flex items-center gap-1 ml-1 flex-shrink-0">
            <PencilIcon
              className={cn(
                "opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0",
                iconSize
              )}
            />
          </div>
        )}
      </div>
    );
  }
);
EditableTitle.displayName = "EditableTitle";
