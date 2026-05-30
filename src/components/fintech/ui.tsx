"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFintechTheme } from "@/components/fintech/theme";

export function useShellTheme() {
  const { theme } = useFintechTheme();
  return { isLight: theme === "light" };
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
        "rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, description }: { title: string; description?: string }) {
  const { isLight } = useShellTheme();
  return (
    <div className="mb-3">
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className={cn("mt-1 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{description}</p>
      ) : null}
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  const { isLight } = useShellTheme();
  return (
    <label htmlFor={htmlFor} className={cn("text-xs font-medium", isLight ? "text-slate-600" : "text-slate-400")}>
      {children}
    </label>
  );
}

export function ShellInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const { isLight } = useShellTheme();
  return (
    <input
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/40",
        isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-600 bg-neutral-900 text-slate-100",
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
  const { isLight } = useShellTheme();
  return (
    <select
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/40",
        isLight ? "border-slate-300 bg-white text-slate-900" : "border-slate-600 bg-neutral-900 text-slate-100",
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
        "rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900",
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
  const { isLight } = useShellTheme();
  return (
    <button
      className={cn(
        "rounded-xl border px-3 py-2 text-sm",
        isLight ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-slate-600 text-slate-200 hover:bg-neutral-900",
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
        "rounded-xl border border-rose-500/50 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className }: { className?: string }) {
  const { isLight } = useShellTheme();
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border",
        isLight ? "border-slate-200 bg-slate-100" : "border-slate-700 bg-neutral-800/80",
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
  const { isLight } = useShellTheme();
  return (
    <div className="grid place-items-center gap-2 px-4 py-12 text-center" role="status">
      <div className={cn("rounded-full p-3", isLight ? "bg-slate-100" : "bg-neutral-900")}>
        <Icon className={cn("h-6 w-6", isLight ? "text-slate-500" : "text-slate-400")} aria-hidden />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className={cn("max-w-sm text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{description}</p>
      {action}
    </div>
  );
}

export function PageFrame({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-10 pb-24 md:pb-0">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
        {description ? <p className="text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </header>
      {children}
    </div>
  );
}
