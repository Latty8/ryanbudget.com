"use client";

import {
  isCategoryEmoji,
  resolveCategoryIcon,
} from "@/lib/categories/category-icon-registry";
import { cn } from "@/lib/utils";

export { resolveCategoryIcon, isCategoryEmoji } from "@/lib/categories/category-icon-registry";

export function CategoryIconBadge({
  icon,
  /** @deprecated Use `icon` — kept for callers passing lucide name as `name` */
  name,
  color,
  size = "md",
}: {
  icon?: string;
  name?: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const iconKey = icon ?? name ?? "CircleDollarSign";
  const dim =
    size === "sm"
      ? "h-8 w-8 rounded-lg"
      : size === "lg"
        ? "h-11 w-11 rounded-xl"
        : "h-9 w-9 rounded-lg";
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  if (isCategoryEmoji(iconKey)) {
    const emojiSize = size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center ring-1 ring-[var(--border-subtle)]",
          dim,
          emojiSize
        )}
        style={{
          backgroundColor: `${color}12`,
        }}
        aria-hidden
      >
        {iconKey}
      </span>
    );
  }

  const Icon = resolveCategoryIcon(iconKey);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center ring-1 ring-[var(--border-subtle)]",
        dim
      )}
      style={{
        backgroundColor: `${color}12`,
        color,
      }}
    >
      <Icon className={iconSize} aria-hidden />
    </span>
  );
}
