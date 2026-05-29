"use client";

export function PeriodSwitcher({
  boundsLabel,
  offset,
  onOffsetChange,
  viewingHint,
}: {
  boundsLabel: string;
  offset: number;
  onOffsetChange: (next: number) => void;
  viewingHint?: string;
}) {
  return (
    <div className="period-bar">
      {viewingHint ? (
        <span className="type-caption shrink-0">{viewingHint}</span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 sm:justify-start">
        <button
          type="button"
          className="btn-secondary shrink-0 px-3 py-2 font-mono text-lg leading-none"
          aria-label="Previous period"
          onClick={() => onOffsetChange(offset - 1)}
        >
          ‹
        </button>
        <span className="min-w-0 truncate px-2 text-center text-[15px] font-medium tracking-[-0.02em] text-[var(--foreground)] sm:flex-1 sm:text-left">
          {boundsLabel}
        </span>
        <button
          type="button"
          className="btn-secondary shrink-0 px-3 py-2 font-mono text-lg leading-none"
          aria-label="Next period"
          onClick={() => onOffsetChange(offset + 1)}
        >
          ›
        </button>
      </div>
      {offset !== 0 ? (
        <button
          type="button"
          className="btn-primary shrink-0 py-2 text-[15px]"
          onClick={() => onOffsetChange(0)}
        >
          Current period
        </button>
      ) : (
        <span className="type-caption hidden shrink-0 text-positive sm:inline">
          Current
        </span>
      )}
    </div>
  );
}
