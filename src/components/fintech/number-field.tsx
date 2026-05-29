"use client";

import { useState } from "react";
import { ShellInput } from "@/components/fintech/ui";
import { cn } from "@/lib/utils";

const DECIMAL_PATTERN = /^-?\d*\.?\d*$/;

type NumberFieldProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
  /** Select all text on focus so Backspace/Delete clears quickly. */
  selectAllOnFocus?: boolean;
};

export function NumberField({
  value,
  onChange,
  min = 0,
  placeholder = "0",
  className,
  id,
  "aria-label": ariaLabel,
  selectAllOnFocus = true,
}: NumberFieldProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "." || trimmed === "-") {
      onChange(0);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return;
    onChange(Math.max(min, parsed));
  };

  return (
    <ShellInput
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={cn(className)}
      value={focused ? text : value === 0 ? "" : String(value)}
      onFocus={(event) => {
        const input = event.currentTarget;
        setFocused(true);
        const initial = value === 0 ? "" : String(value);
        setText(initial);
        if (selectAllOnFocus) {
          requestAnimationFrame(() => input.select());
        }
      }}
      onBlur={() => {
        setFocused(false);
        commit(text);
      }}
      onChange={(event) => {
        const next = event.target.value;
        if (next !== "" && !DECIMAL_PATTERN.test(next)) return;
        setText(next);
        if (next === "" || next === "." || next === "-") {
          onChange(0);
          return;
        }
        const parsed = Number(next);
        if (Number.isFinite(parsed)) onChange(Math.max(min, parsed));
      }}
    />
  );
}
