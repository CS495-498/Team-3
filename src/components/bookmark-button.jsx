"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BookmarkButton({
  active = false,
  onToggle,
  className,
  disabled,
  size = "icon-sm",
  titleWhenInactive = "Save to bookmarks",
  titleWhenActive = "Remove bookmark",
}) {
  const Icon = active ? BookmarkCheck : Bookmark;

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      className={cn(
        "rounded-full border-white/70 bg-white/80 backdrop-blur text-slate-700 hover:bg-white focus-visible:ring-purple-300",
        active && "border-purple-500 text-purple-600 hover:text-purple-700",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
      aria-pressed={active}
      aria-label={active ? titleWhenActive : titleWhenInactive}
      title={active ? titleWhenActive : titleWhenInactive}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle?.();
      }}
      disabled={disabled}
    >
      <Icon className="size-4" />
    </Button>
  );
}
