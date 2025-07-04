"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/ui-utils";

interface EditableDescriptionProps {
  description?: string;
  onSave: (newDescription: string) => Promise<void> | void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  variant?: "desktop" | "mobile";
  fallback?: string;
}

export const EditableDescription = React.memo<EditableDescriptionProps>(
  function EditableDescription({
    description,
    onSave,
    className,
    placeholder = "Add description...",
    disabled = false,
    maxLength = 200,
    variant = "desktop",
    fallback = "Click to add description",
  }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(description || "");
    const [isLoading, setIsLoading] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Update edit value when description prop changes
    React.useEffect(() => {
      setEditValue(description || "");
    }, [description]);

    // Focus textarea when entering edit mode
    React.useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, [isEditing]);

    const handleStartEdit = React.useCallback(() => {
      if (disabled) return;
      setIsEditing(true);
      setEditValue(description || "");
    }, [disabled, description]);

    const handleCancel = React.useCallback(() => {
      setIsEditing(false);
      setEditValue(description || "");
    }, [description]);

    const handleSave = React.useCallback(async () => {
      const trimmedValue = editValue.trim();

      // Allow saving empty descriptions (to remove them)
      if (trimmedValue === description) {
        handleCancel();
        return;
      }

      setIsLoading(true);
      try {
        await onSave(trimmedValue);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to save description:", error);
        // Keep in edit mode on error
      } finally {
        setIsLoading(false);
      }
    }, [editValue, description, onSave, handleCancel]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSave();
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleCancel();
        }
      },
      [handleSave, handleCancel]
    );

    const handleTextareaChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditValue(e.target.value);
      },
      []
    );

    const isMobile = variant === "mobile";
    const descriptionClass = isMobile ? "text-sm" : "text-base";
    const iconSize = isMobile ? "h-3 w-3" : "h-3 w-3";
    const buttonSize = isMobile ? "h-6 w-6" : "h-6 w-6";

    const displayText = description || fallback;
    const hasDescription = Boolean(description);

    if (isEditing) {
      return (
        <div className={cn("group flex items-center gap-2 w-full", className)}>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={isLoading}
              rows={2}
              className={cn(
                "bg-transparent border-none outline-none w-full text-muted-foreground resize-none",
                descriptionClass
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
        title={
          disabled
            ? "Editing disabled"
            : hasDescription
              ? "Click to edit description"
              : "Click to add description"
        }
      >
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "truncate",
              descriptionClass,
              hasDescription
                ? "text-muted-foreground"
                : "text-muted-foreground/60 italic"
            )}
          >
            {displayText}
          </p>
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
EditableDescription.displayName = "EditableDescription";
