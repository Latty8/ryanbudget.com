"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SwipeTransactionRowProps = {
  children: React.ReactNode;
  onDelete: () => void;
  isLight: boolean;
};

export function SwipeTransactionRow({ children, onDelete, isLight }: SwipeTransactionRowProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const swiping = useRef(false);

  return (
    <div className="relative overflow-hidden md:overflow-visible">
      <div
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-rose-600 text-white md:hidden"
        aria-hidden={offset > -20}
      >
        <Trash2 className="h-5 w-5" />
      </div>
      <div
        className={cn(
          "relative grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-4 py-3 transition-transform duration-150 last:border-0",
          isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-neutral-800/95"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(event) => {
          startX.current = event.touches[0]?.clientX ?? 0;
          swiping.current = true;
        }}
        onTouchMove={(event) => {
          if (!swiping.current) return;
          const delta = (event.touches[0]?.clientX ?? 0) - startX.current;
          if (delta < 0) setOffset(Math.max(delta, -96));
        }}
        onTouchEnd={() => {
          swiping.current = false;
          if (offset < -64) {
            onDelete();
            setOffset(0);
          } else {
            setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
