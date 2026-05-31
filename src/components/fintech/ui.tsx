"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { DialogPortal } from "@/components/ui/dialog-portal";
import { cn } from "@/lib/utils";
import { useFintechTheme, useShellTheme } from "@/components/fintech/theme";

export { useShellTheme };

/** Calm surface card — solid background, light border, no glass blur */
export const fintechSurface =
  "rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-colors duration-200 hover:border-[var(--border-strong)]";
export const fintechGlass = fintechSurface;
export const fintechHero =
  "rounded-[var(--radius-card)] bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-from)] to-[var(--hero-to)] text-white shadow-sm";
export const fintechMuted = "text-[var(--muted)]";
export const fintechForeground = "text-[var(--foreground)]";
export const fintechDisplay = "font-semibold tracking-tight text-[var(--foreground)]";
export const fintechLabel =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]";
export const fintechDivide = "divide-[var(--border-subtle)]";
export const fintechLink =
  "font-medium text-[var(--accent)] underline-offset-2 transition-colors duration-200 hover:text-[var(--accent-deep)] hover:underline";

/** Shared horizontal padding for list/card rows */
export const fintechCardBody = "px-4 py-4 sm:px-5 sm:py-4";

/** Expandable row toggle at card footer */
export const fintechCardToggle =
  "flex min-h-11 w-full items-center justify-between px-4 text-left text-xs font-medium text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] sm:px-5";

/** 44px minimum touch target for icon-only controls */
export const fintechIconButton =
  "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] active:scale-[0.97] disabled:opacity-40";

/** Destructive variant for card row icon buttons */
export const fintechDeleteIconButton =
  "border-transparent text-rose-500 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500";

export function FilterChip({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 active:scale-[0.97]",
        active
          ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
          : "border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SegmentToggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string; prominent?: boolean }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] p-1",
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-11 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98]",
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm"
                : opt.prominent
                  ? "text-[var(--accent-deep)] ring-1 ring-[var(--accent)]/35 hover:bg-[var(--accent-muted)] hover:text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressRing({
  pct,
  color = "var(--accent)",
  size = 72,
  stroke = 6,
  label,
  sublabel,
}: {
  pct: number;
  color?: string;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.min(100, Math.max(0, pct)) / 100 * c;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[var(--border)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        {label ? (
          <p className="text-sm font-bold tabular-nums leading-none text-[var(--foreground)]">{label}</p>
        ) : (
          <p className="text-xs font-bold tabular-nums text-[var(--foreground)]">{Math.round(pct)}%</p>
        )}
        {sublabel ? <p className="mt-0.5 text-[9px] font-medium text-[var(--muted)]">{sublabel}</p> : null}
      </div>
    </div>
  );
}

export function ProgressBar({
  pct,
  over,
  className,
  size = "default",
  accentColor,
}: {
  pct: number;
  over?: boolean;
  className?: string;
  size?: "default" | "slim";
  accentColor?: string;
}) {
  const width = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-[var(--surface-elevated)]",
        size === "slim" ? "h-1" : "h-1.5",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          !accentColor && (over ? "bg-[var(--negative)]" : "bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent)]")
        )}
        style={
          accentColor
            ? { width: `${width}%`, backgroundColor: over ? "var(--negative)" : accentColor }
            : { width: `${width}%` }
        }
      />
    </div>
  );
}

/** Solid panel for forms — no glass bleed-through */
export const fintechModalPanel =
  "rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--modal-solid)] shadow-[var(--shadow-modal)]";

/** Neutral insight / coach sub-panel */
export const fintechInsightBox =
  "rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3";

/** Accent-tinted insight highlight */
export const fintechInsightAccent =
  "rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-muted)] p-3";

export const fintechInsightPositive =
  "rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3";

export const fintechInsightWarning =
  "rounded-xl border border-amber-500/25 bg-amber-500/5 p-3";

export function ColorSwatchPicker({
  colors,
  value,
  onChange,
  className,
}: {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="listbox" aria-label="Color">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="option"
          aria-selected={value === color}
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            "h-10 w-10 rounded-full border-2 transition-all duration-200 active:scale-95 sm:h-9 sm:w-9",
            value === color
              ? "scale-105 border-[var(--foreground)]"
              : "border-transparent hover:border-[var(--border-strong)]"
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function ModalOverlay({
  open,
  onClose,
  children,
  title,
  variant = "solid",
  panelClassName,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** `solid` — opaque form panel; `glass` — slightly translucent */
  variant?: "glass" | "solid";
  panelClassName?: string;
  /** Sticky footer (Save/Cancel) — keeps actions visible on mobile */
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  const panelClass = cn(
    fintechModalPanel,
    variant === "glass" && "bg-[var(--surface)]/95 backdrop-blur-md",
    "w-full max-w-md shadow-[var(--shadow-modal)]",
    footer && "flex max-h-[min(90dvh,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] flex-col overflow-hidden p-0",
    panelClassName
  );

  const maxHeight =
    "max-h-[min(90dvh,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))]";

  return (
    <DialogPortal open={open} layer="modal">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[var(--overlay)]/90"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative z-10 mx-auto w-full overscroll-contain",
          footer
            ? panelClass
            : cn(
                maxHeight,
                "overflow-y-auto p-4 pb-safe sm:p-6",
                panelClass
              )
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {footer ? (
          <>
            {title ? (
              <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
                <h2 id="modal-title" className={cn("text-lg", fintechDisplay)}>
                  {title}
                </h2>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6">
              {children}
            </div>
            <div className="shrink-0 border-t border-[var(--border-subtle)] px-4 py-4 pb-safe sm:px-6">
              {footer}
            </div>
          </>
        ) : (
          <>
            {title ? (
              <h2 id="modal-title" className={cn("mb-5 text-lg", fintechDisplay)}>
                {title}
              </h2>
            ) : null}
            {children}
          </>
        )}
      </motion.div>
    </DialogPortal>
  );
}

export function ShellCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        fintechSurface,
        "rounded-xl p-4 sm:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <p className={cn("text-sm font-semibold", fintechForeground)}>{title}</p>
      {description ? <p className={cn("mt-1 text-xs leading-relaxed", fintechMuted)}>{description}</p> : null}
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={cn("text-xs font-medium", fintechMuted)}>
      {children}
    </label>
  );
}

export function ShellInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full min-h-11 rounded-[var(--radius-field)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-base sm:text-sm text-[var(--foreground)] shadow-[var(--shadow-inner)] outline-none transition-all duration-200 placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)]",
        className
      )}
      {...props}
    />
  );
}

export function ShellSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full min-h-11 rounded-[var(--radius-field)] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-base sm:text-sm text-[var(--foreground)] outline-none transition focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)]",
        className
      )}
      {...props}
    />
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-field)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm transition-all duration-200 hover:brightness-105 active:scale-[0.97] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-field)] border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] active:scale-[0.97]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-field)] border border-rose-500/40 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all duration-200 hover:bg-rose-500/10 active:scale-[0.98] disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-elevated)]",
        className
      )}
    />
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center gap-4 px-4 py-14 text-center sm:py-16" role="status">
      <div className={cn(fintechSurface, "rounded-2xl p-4")}>
        <Icon className={cn("h-8 w-8", fintechMuted)} aria-hidden strokeWidth={1.5} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className={cn("text-base font-semibold", fintechForeground)}>{title}</p>
        <p className={cn("text-sm leading-relaxed", fintechMuted)}>{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function PageFrame({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="page-enter space-y-6 md:space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2.5">
          <h1 className={cn("text-2xl font-bold tracking-tight md:text-[1.875rem]", fintechDisplay)}>
            {title}
          </h1>
          {description ? (
            <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function MotionSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
