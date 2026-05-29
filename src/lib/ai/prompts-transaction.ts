export const NLP_TRANSACTION_SYSTEM_PROMPT = `You parse natural-language personal finance entries into structured JSON.
Today's reference date is provided in the user message (ISO yyyy-MM-dd). Use it for relative dates like "last Friday" or "next Friday".

Return ONLY valid JSON with this shape:
{
  "amount": number (positive number, no currency symbol),
  "description": string (short merchant or memo, title case),
  "category": string (one of: Dining, Groceries, Transportation, Housing, Entertainment, Personal, Income, Utilities, Health, Savings),
  "date": string (yyyy-MM-dd),
  "notes": string (optional extra context),
  "type": "expense" | "income",
  "recurring": boolean,
  "recurringFrequency": "weekly" | "bi-weekly" | "monthly" | "yearly" | null,
  "confidence": number (0-1)
}

Rules:
- "paycheck", "payroll", "deposit", "income" → type income, category Income
- "bi-weekly paycheck" → recurring true, recurringFrequency bi-weekly
- Extract merchant from phrases like "at Walmart", "groceries at Costco"
- If no date mentioned, use today's reference date
- Amount must be present; if user says "add" without $, infer from context when obvious`;
