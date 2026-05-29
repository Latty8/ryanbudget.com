"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_ACCENT_HEX, useThemeStore } from "@/store/useThemeStore";

const ACCENT_PRESETS = [
  { hex: "#0071e3", label: "Blue" },
  { hex: "#5e5ce6", label: "Indigo" },
  { hex: "#30d158", label: "Green" },
  { hex: "#ff9f0a", label: "Orange" },
  { hex: "#ff375f", label: "Pink" },
  { hex: "#bf5af2", label: "Purple" },
  { hex: "#64d2ff", label: "Cyan" },
  { hex: "#8e8e93", label: "Gray" },
];

export function AppearanceMenu() {
  const appearance = useThemeStore((s) => s.appearance);
  const accentHex = useThemeStore((s) => s.accentHex);
  const setAppearance = useThemeStore((s) => s.setAppearance);
  const setAccentHex = useThemeStore((s) => s.setAccentHex);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost gap-2 px-3 py-2"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Appearance"
      >
        <span
          className="size-3.5 shrink-0 rounded-full ring-1 ring-[var(--border-strong)]"
          style={{ backgroundColor: accentHex }}
          aria-hidden
        />
        <span className="hidden sm:inline">Appearance</span>
      </button>

      {open && (
        <div
          className="surface-card absolute right-0 z-[100] mt-2 w-[min(100vw-2.5rem,18.5rem)] p-5"
          role="dialog"
          aria-label="Appearance settings"
        >
          <p className="type-caption mb-3">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            <ModeBtn
              active={appearance === "light"}
              onClick={() => setAppearance("light")}
              label="Light"
            >
              <SunIcon className="h-5 w-5" />
            </ModeBtn>
            <ModeBtn
              active={appearance === "dark"}
              onClick={() => setAppearance("dark")}
              label="Dark"
            >
              <MoonIcon className="h-5 w-5" />
            </ModeBtn>
            <ModeBtn
              active={appearance === "system"}
              onClick={() => setAppearance("system")}
              label="Auto"
            >
              <SystemIcon className="h-5 w-5" />
            </ModeBtn>
          </div>

          <p className="type-caption mb-3 mt-6">Accent</p>
          <div className="flex flex-wrap gap-2.5">
            {ACCENT_PRESETS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                title={label}
                onClick={() => setAccentHex(hex)}
                className={`relative size-9 rounded-full transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] ${
                  accentHex.toLowerCase() === hex.toLowerCase()
                    ? "ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--surface)]"
                    : "ring-1 ring-[var(--border-subtle)]"
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <span className="type-caption shrink-0">Custom</span>
            <input
              type="color"
              value={
                /^#[0-9A-Fa-f]{6}$/.test(accentHex)
                  ? accentHex
                  : DEFAULT_ACCENT_HEX
              }
              onChange={(e) => setAccentHex(e.target.value)}
              className="field h-10 w-full max-w-[7rem] cursor-pointer p-1"
            />
            <button
              type="button"
              className="btn-ghost shrink-0 px-2 py-1 text-xs"
              onClick={() => setAccentHex(DEFAULT_ACCENT_HEX)}
            >
              Reset
            </button>
          </label>
        </div>
      )}
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-field)] border px-2 py-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
          : "border-[var(--border-subtle)] bg-transparent text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
      />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
      />
    </svg>
  );
}
