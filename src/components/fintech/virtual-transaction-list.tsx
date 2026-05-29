"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

const ROW_HEIGHT = 72;

type VirtualTransactionListProps<T extends { id: string }> = {
  rows: T[];
  isLight: boolean;
  renderRow: (row: T) => React.ReactNode;
  className?: string;
};

export function VirtualTransactionList<T extends { id: string }>({
  rows,
  isLight,
  renderRow,
  className,
}: VirtualTransactionListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  if (rows.length === 0) return null;

  return (
    <div
      ref={parentRef}
      className={cn(
        "max-h-[min(70vh,720px)] overflow-y-auto overscroll-contain",
        className
      )}
      role="list"
      aria-label="Transactions list"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              role="listitem"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={cn(
                "flex items-center gap-3 border-b px-3",
                isLight ? "border-slate-200" : "border-slate-700/60"
              )}
            >
              {renderRow(row)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
