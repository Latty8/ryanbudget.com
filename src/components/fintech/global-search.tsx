"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRouter } from "next/navigation";
import { Command, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  buildPaletteItems,
  groupPaletteItems,
  type PaletteItem,
} from "@/lib/command-palette/items";
import { PALETTE_SECTION_LABELS } from "@/lib/command-palette/labels";
import { loadRecentPalette, recordPaletteSelection } from "@/lib/command-palette/recent";
import { fintechForeground, fintechIconButton, fintechMuted, fintechSurface } from "@/components/fintech/ui";
import {
  formatTransactionAmountDisplay,
  transactionAmountClassName,
} from "@/lib/transactions/format-transaction-display";
import { useAppDataStore } from "@/store/useAppDataStore";
import { useTransactionRulesStore } from "@/store/useTransactionRulesStore";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

export function openGlobalSearch() {
  window.dispatchEvent(new CustomEvent("planner:open-search"));
}

export function GlobalSearchTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        fintechIconButton,
        "min-h-10 gap-2 px-3 text-[var(--muted)]",
        className
      )}
      onClick={openGlobalSearch}
      aria-label="Command palette (Ctrl+K)"
    >
      <Search className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span className="hidden text-xs sm:inline">Search</span>
      <kbd className="hidden rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)] md:inline">
        ⌘K
      </kbd>
    </button>
  );
}

function runPaletteItem(item: PaletteItem, router: ReturnType<typeof useRouter>) {
  if (item.action === "new-transaction") {
    window.dispatchEvent(new CustomEvent("planner:new-transaction"));
    return;
  }
  if (item.action === "export-data") {
    router.push("/settings");
    return;
  }
  if (item.href) router.push(item.href);
}

export function GlobalSearchPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 100);
  const [activeIndex, setActiveIndex] = useState(0);
  const [, startTransition] = useTransition();

  const { transactions, accounts, categories, goals, currency } = useAppDataStore(
    useShallow((s) => ({
      transactions: s.demoTransactions,
      accounts: s.accounts,
      categories: s.categories,
      goals: s.goals,
      currency: s.preferences.currency,
    }))
  );
  const rules = useTransactionRulesStore((s) => s.rules);

  const [recent, setRecent] = useState(loadRecentPalette);

  useEffect(() => {
    if (open) setRecent(loadRecentPalette());
  }, [open]);

  const flatItems = useMemo(
    () =>
      buildPaletteItems({
        query: debouncedQuery,
        transactions,
        accounts,
        categories,
        goals,
        rules,
        recent,
      }),
    [debouncedQuery, transactions, accounts, categories, goals, rules, recent]
  );

  const isSearching = query !== debouncedQuery;

  const grouped = useMemo(() => groupPaletteItems(flatItems), [flatItems]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const activate = useCallback(
    (item: PaletteItem) => {
      recordPaletteSelection({
        id: item.id,
        title: item.title,
        href: item.href,
        action: item.action,
      });
      close();
      runPaletteItem(item, router);
    },
    [close, router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      const inPaletteInput = open && target === inputRef.current;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (!inPaletteInput && tag === "textarea") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, flatItems.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && flatItems[activeIndex]) {
        e.preventDefault();
        activate(flatItems[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flatItems, activeIndex, close, activate]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("planner:open-search", onOpen);
    return () => window.removeEventListener("planner:open-search", onOpen);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 p-0 pt-0 backdrop-blur-sm sm:p-4 sm:pt-[10vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-label="Command palette"
            className={cn(
              fintechSurface,
              "flex max-h-[min(92dvh,100%)] w-full max-w-xl flex-col overflow-hidden shadow-[var(--shadow-modal)] sm:max-h-none sm:rounded-[var(--radius-card)]"
            )}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-3">
              <Command className="h-4 w-4 shrink-0 text-[var(--accent)]" strokeWidth={2} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  const next = e.target.value;
                  setQuery(next);
                  startTransition(() => setActiveIndex(0));
                }}
                placeholder="Search transactions, rules, funds, net worth…"
                className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-[var(--muted)]"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className={fintechIconButton} onClick={close} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:max-h-[min(60vh,28rem)]">
              {isSearching ? (
                <div className="space-y-2 px-2 py-4" aria-busy="true">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-11 animate-pulse rounded-[var(--radius-inner)] bg-[var(--surface-elevated)]" />
                  ))}
                </div>
              ) : flatItems.length === 0 ? (
                <p className={cn("px-3 py-10 text-center text-sm", fintechMuted)}>No matches</p>
              ) : (
                grouped.map(({ section, items }) => (
                  <div key={section} className="mb-2">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      {PALETTE_SECTION_LABELS[section]}
                    </p>
                    <ul>
                      {items.map((row) => {
                        const index = flatItems.findIndex((f) => f.id === row.id);
                        const Icon = row.icon;
                        const active = index === activeIndex;
                        return (
                          <li key={row.id}>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center gap-3 rounded-[var(--radius-inner)] px-3 py-2.5 text-left transition-colors",
                                active ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30" : "hover:bg-[var(--surface-hover)]"
                              )}
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => activate(row)}
                            >
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-inner)]",
                                  active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--surface-elevated)] text-[var(--muted)]"
                                )}
                              >
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={cn("block truncate text-sm font-medium", fintechForeground)}>
                                  {row.title}
                                </span>
                                {row.subtitle ? (
                                  <span className={cn("block truncate text-xs", fintechMuted)}>{row.subtitle}</span>
                                ) : null}
                              </span>
                              {row.amount != null ? (
                                <span
                                  className={cn(
                                    "shrink-0 text-sm font-semibold tabular-nums",
                                    transactionAmountClassName(row.amount)
                                  )}
                                >
                                  {formatTransactionAmountDisplay(row.amount, currency)}
                                </span>
                              ) : row.section === "Actions" ? (
                                <kbd className="hidden rounded border border-[var(--border-subtle)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)] sm:inline">
                                  ↵
                                </kbd>
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-3 py-2 text-[10px] text-[var(--muted)]">
              <span className="flex flex-wrap gap-2">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </span>
              <span className="font-medium text-[var(--accent)]">Command palette</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
