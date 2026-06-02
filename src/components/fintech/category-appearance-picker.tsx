"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CategoryIconBadge } from "@/components/fintech/category-icon";
import { FieldLabel, ShellInput } from "@/components/fintech/ui";
import { ENTITY_COLOR_SWATCHES } from "@/lib/fintech/color-swatches";
import {
  CATEGORY_EMOJI_OPTIONS,
  CATEGORY_ICON_NAMES,
} from "@/lib/categories/category-icon-registry";
import { cn } from "@/lib/utils";

type Tab = "icons" | "emoji";

type Props = {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  previewName?: string;
  className?: string;
};

function normalizeHex(value: string): string | null {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v.toLowerCase()}`;
  return null;
}

export function CategoryAppearancePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  previewName = "Preview",
  className,
}: Props) {
  const [tab, setTab] = useState<Tab>(() =>
    CATEGORY_EMOJI_OPTIONS.includes(icon as (typeof CATEGORY_EMOJI_OPTIONS)[number]) ? "emoji" : "icons"
  );
  const [iconSearch, setIconSearch] = useState("");
  const [customHex, setCustomHex] = useState(color.startsWith("#") ? color : `#${color}`);

  useEffect(() => {
    setCustomHex(color.startsWith("#") ? color : `#${color}`);
  }, [color]);

  const filteredIcons = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    if (!q) return CATEGORY_ICON_NAMES;
    return CATEGORY_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [iconSearch]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5">
        <CategoryIconBadge icon={icon} color={color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">{previewName}</p>
          <p className="truncate text-xs text-[var(--muted)]">Icon & accent color</p>
        </div>
      </div>

      <div>
        <FieldLabel>Icon</FieldLabel>
        <div
          className="mt-2 flex rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-0.5"
          role="tablist"
          aria-label="Icon type"
        >
          {(
            [
              ["icons", "Icons"],
              ["emoji", "Emoji"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition",
                tab === id
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "icons" ? (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <ShellInput
                placeholder="Search icons…"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="pl-9"
                aria-label="Search icons"
              />
            </div>
            <div
              className="grid max-h-[min(200px,35vh)] grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 sm:grid-cols-8"
              role="listbox"
              aria-label="Choose icon"
            >
              {filteredIcons.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={icon === name}
                  title={name}
                  onClick={() => onIconChange(name)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg transition",
                    icon === name
                      ? "bg-[var(--accent-muted)] ring-2 ring-[var(--accent)]"
                      : "hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <CategoryIconBadge icon={name} color={color} size="sm" />
                </button>
              ))}
            </div>
            {filteredIcons.length === 0 ? (
              <p className="text-center text-xs text-[var(--muted)]">No icons match your search.</p>
            ) : null}
          </div>
        ) : (
          <div
            className="mt-3 grid grid-cols-6 gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 sm:grid-cols-8"
            role="listbox"
            aria-label="Choose emoji"
          >
            {CATEGORY_EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                aria-selected={icon === emoji}
                title={emoji}
                onClick={() => onIconChange(emoji)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-xl transition",
                  icon === emoji
                    ? "bg-[var(--accent-muted)] ring-2 ring-[var(--accent)]"
                    : "hover:bg-[var(--surface-hover)]"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <FieldLabel>Color</FieldLabel>
        <div className="mt-2 flex flex-wrap gap-2" role="listbox" aria-label="Preset colors">
          {ENTITY_COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              role="option"
              aria-selected={color === swatch}
              aria-label={`Color ${swatch}`}
              onClick={() => {
                onColorChange(swatch);
                setCustomHex(swatch);
              }}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition-all active:scale-95",
                color === swatch
                  ? "scale-105 border-[var(--foreground)]"
                  : "border-transparent hover:border-[var(--border-strong)]"
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm">
            <span className="text-[var(--muted)]">Custom</span>
            <input
              type="color"
              value={normalizeHex(color) ?? normalizeHex(customHex) ?? "#38bdf8"}
              onChange={(e) => {
                const next = e.target.value;
                setCustomHex(next);
                onColorChange(next);
              }}
              className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Custom color"
            />
          </label>
          <ShellInput
            placeholder="#38bdf8"
            value={customHex}
            onChange={(e) => {
              const raw = e.target.value;
              setCustomHex(raw);
              const hex = normalizeHex(raw);
              if (hex) onColorChange(hex);
            }}
            className="w-28 font-mono text-sm"
            aria-label="Hex color"
          />
        </div>
      </div>
    </div>
  );
}
