import { NLP_TRANSACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts-transaction";
import type { ParsedTransactionDraft } from "@/lib/ai/parse-transaction";
import { parseNaturalLanguageTransaction } from "@/lib/ai/parse-transaction";
import { format } from "date-fns";

async function callOpenAI(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content ?? null;
}

async function callGrok(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY ?? process.env.GROK_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROK_MODEL ?? "grok-2-latest",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content ?? null;
}

function normalizeDraft(raw: Record<string, unknown>, baseDate: Date): ParsedTransactionDraft | null {
  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const description = String(raw.description ?? "").trim() || "Transaction";
  const category = String(raw.category ?? "Personal").trim();
  const date =
    typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
      ? raw.date
      : format(baseDate, "yyyy-MM-dd");

  const recurring = Boolean(raw.recurring);
  const freq = raw.recurringFrequency;
  const recurringFrequency =
    freq === "weekly" || freq === "bi-weekly" || freq === "monthly" || freq === "yearly"
      ? freq
      : undefined;

  return {
    amount,
    description,
    category,
    date,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
    type: raw.type === "income" ? "income" : "expense",
    recurring: recurring || undefined,
    recurringFrequency,
    confidence: Math.min(1, Math.max(0, Number(raw.confidence) || 0.85)),
  };
}

function parseLlmJson(raw: string, baseDate: Date): ParsedTransactionDraft | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeDraft(parsed, baseDate);
  } catch {
    return null;
  }
}

export async function parseNaturalLanguageWithAi(
  text: string,
  baseDate = new Date()
): Promise<{ parsed: ParsedTransactionDraft; source: "openai" | "grok" | "rules" } | null> {
  const today = format(baseDate, "yyyy-MM-dd");
  const userPrompt = `Reference date (today): ${today}\n\nParse this transaction:\n${text.trim()}`;

  const openAiRaw = await callOpenAI(NLP_TRANSACTION_SYSTEM_PROMPT, userPrompt);
  const openAi = openAiRaw ? parseLlmJson(openAiRaw, baseDate) : null;
  if (openAi) return { parsed: openAi, source: "openai" };

  const grokRaw = await callGrok(NLP_TRANSACTION_SYSTEM_PROMPT, userPrompt);
  const grok = grokRaw ? parseLlmJson(grokRaw, baseDate) : null;
  if (grok) return { parsed: grok, source: "grok" };

  const rules = parseNaturalLanguageTransaction(text, baseDate);
  if (!rules) return null;
  return { parsed: rules, source: "rules" };
}
