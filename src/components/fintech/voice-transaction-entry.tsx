"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NlpTransactionPreview } from "@/components/fintech/nlp-transaction-preview";
import { fintechIconButton, fintechMuted, GhostButton, PrimaryButton } from "@/components/fintech/ui";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { parseNaturalLanguageTransaction, type ParsedTransactionDraft } from "@/lib/ai/parse-transaction";
import { cn } from "@/lib/utils";

type Props = {
  categoryNames?: string[];
  currencyLabel?: string;
  onApply: (draft: ParsedTransactionDraft) => void;
  onCancel?: () => void;
  className?: string;
  compact?: boolean;
};

export function VoiceTransactionEntry({
  categoryNames,
  currencyLabel = "USD",
  onApply,
  onCancel,
  className,
  compact,
}: Props) {
  const { supported, listening, transcript, error, toggle, stop, setTranscript } = useSpeechRecognition();
  const [draft, setDraft] = useState<ParsedTransactionDraft | null>(null);

  useEffect(() => {
    if (!listening && transcript.length > 8) {
      const parsed = parseNaturalLanguageTransaction(transcript);
      if (parsed) setDraft(parsed);
    }
  }, [listening, transcript]);

  const parseManual = () => {
    const parsed = parseNaturalLanguageTransaction(transcript);
    if (!parsed) {
      toast.error("Could not understand that", {
        description: 'Try: "Add $45.50 for groceries at Walmart yesterday"',
      });
      return;
    }
    setDraft(parsed);
  };

  if (draft) {
    return (
      <NlpTransactionPreview
        draft={draft}
        source="rules"
        currencyLabel={currencyLabel}
        onConfirm={() => {
          onApply(draft);
          setDraft(null);
          setTranscript("");
        }}
        onDiscard={() => setDraft(null)}
        className={className}
      />
    );
  }

  return (
    <div className={cn("rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3", className)}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all",
            listening
              ? "bg-rose-500/15 text-rose-400 ring-2 ring-rose-400/40 animate-pulse"
              : "bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25",
            !supported && "opacity-40"
          )}
          aria-label={listening ? "Stop listening" : "Start voice entry"}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {listening ? "Listening…" : "Speak your transaction"}
          </p>
          <p className={cn("mt-0.5 text-xs", fintechMuted)}>
            {supported
              ? compact
                ? "Tap the mic and speak"
                : '"Add $45.50 for groceries at Walmart yesterday"'
              : "Use Chrome or Safari for voice, or type below"}
          </p>
        </div>
      </div>

      {transcript ? (
        <p className={cn("mt-3 rounded-lg bg-[var(--surface)] px-3 py-2 text-sm italic", fintechMuted)}>
          &ldquo;{transcript}&rdquo;
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!listening && transcript ? (
          <PrimaryButton type="button" className="!py-1.5 !text-xs" onClick={parseManual}>
            Preview transaction
          </PrimaryButton>
        ) : null}
        {listening ? (
          <GhostButton type="button" className="!py-1.5 !text-xs" onClick={stop}>
            Done speaking
          </GhostButton>
        ) : null}
        {onCancel ? (
          <GhostButton type="button" className="!py-1.5 !text-xs" onClick={onCancel}>
            Cancel
          </GhostButton>
        ) : null}
      </div>
    </div>
  );
}

export function VoiceMicButton({
  onTranscript,
  className,
}: {
  onTranscript: (text: string) => void;
  className?: string;
}) {
  const { supported, listening, transcript, error, toggle, stop } = useSpeechRecognition();

  useEffect(() => {
    if (!listening && transcript) onTranscript(transcript);
  }, [listening, transcript, onTranscript]);

  return (
    <button
      type="button"
      className={cn(
        fintechIconButton,
        listening && "text-rose-400 ring-2 ring-rose-400/30",
        className
      )}
      onClick={toggle}
      disabled={!supported}
      aria-label={listening ? "Stop voice input" : "Voice input"}
      title={error ?? undefined}
    >
      {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
