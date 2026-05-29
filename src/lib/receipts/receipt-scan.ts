import { formatLocalDate, parseLocalDate } from "@/lib/dates/parse-local-date";

export type ReceiptScanSuggestion = {
  description: string;
  amount: number;
  date: string;
  category: string;
  confidence: "high" | "medium" | "low";
  source: "openai-vision" | "heuristic";
};

const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /grocery|supermarket|walmart|costco|kroger|safeway|aldi/i, category: "Groceries" },
  { pattern: /restaurant|cafe|coffee|starbucks|mcdonald|chipotle|dining|grill|pizza/i, category: "Dining" },
  { pattern: /gas|shell|chevron|exxon|fuel|bp\s/i, category: "Transportation" },
  { pattern: /amazon|target|best\s*buy|home\s*depot|lowes/i, category: "Shopping" },
  { pattern: /pharmacy|cvs|walgreens|medical|clinic|hospital/i, category: "Health" },
  { pattern: /uber|lyft|transit|parking|toll/i, category: "Transportation" },
  { pattern: /rent|mortgage|landlord|apartment/i, category: "Housing" },
  { pattern: /netflix|spotify|hulu|entertainment|cinema|theater/i, category: "Entertainment" },
];

/** Extract merchant, total, and date from raw receipt text (OCR output or vision transcript). */
export function parseReceiptText(text: string, fileName?: string): ReceiptScanSuggestion {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let amount = 0;
  const amountPatterns = [
    /(?:total|amount\s*due|balance\s*due|grand\s*total)[:\s]*\$?\s*([\d,]+\.\d{2})/i,
    /\$\s*([\d,]+\.\d{2})\s*$/m,
    /(?:^|\s)([\d,]+\.\d{2})\s*(?:USD|CAD|EUR)?\s*$/im,
  ];
  for (const line of [...lines].reverse()) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        const parsed = Number.parseFloat(match[1].replace(/,/g, ""));
        if (parsed > amount && parsed < 50_000) {
          amount = parsed;
          break;
        }
      }
    }
    if (amount > 0) break;
  }

  let date = formatLocalDate(new Date());
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
  ];
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          if (match[0].includes("-") && match[1].length === 4) {
            date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
          } else if (/[a-z]/i.test(match[1])) {
            const parsed = new Date(match[0]);
            if (!Number.isNaN(parsed.getTime())) date = formatLocalDate(parsed);
          } else {
            const m = Number(match[1]);
            const d = Number(match[2]);
            let y = Number(match[3]);
            if (y < 100) y += 2000;
            const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            parseLocalDate(iso);
            date = iso;
          }
          break;
        } catch {
          // try next pattern
        }
      }
    }
    if (date !== formatLocalDate(new Date())) break;
  }

  const skipLine = (l: string) =>
    /total|subtotal|tax|change|visa|mastercard|amount|^\d|latte|item/i.test(l) || l.length > 50;

  const merchantFromHeader = lines
    .slice(0, 5)
    .find(
      (l) =>
        l.length > 2 &&
        l.length < 48 &&
        !skipLine(l) &&
        (/store|market|shop|cafe|restaurant|#\d/i.test(l) || /^[A-Z][A-Z0-9 '&.-]+$/.test(l))
    );

  const description =
    merchantFromHeader ??
    lines.find((l) => l.length > 2 && l.length < 48 && !skipLine(l)) ??
    fileName?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ??
    "Receipt purchase";

  let category = "Shopping";
  const blob = `${text} ${description}`;
  for (const { pattern, category: cat } of CATEGORY_KEYWORDS) {
    if (pattern.test(blob)) {
      category = cat;
      break;
    }
  }

  const confidence: ReceiptScanSuggestion["confidence"] =
    amount > 0 && description.length > 2 ? (amount > 0 && date ? "high" : "medium") : "low";

  return {
    description: description.slice(0, 80),
    amount,
    date,
    category,
    confidence,
    source: "heuristic",
  };
}

async function callOpenAIVision(imageUrl: string): Promise<ReceiptScanSuggestion | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Extract receipt data. Reply JSON only: { \"merchant\": string, \"total\": number, \"date\": \"YYYY-MM-DD\", \"category\": string }. Use common budget categories (Groceries, Dining, Transportation, Shopping, Health, Entertainment, Housing). Total is the final amount paid.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Read this receipt image and extract merchant, total, date, category." },
            { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      merchant?: string;
      total?: number;
      date?: string;
      category?: string;
    };
    const amount = typeof parsed.total === "number" ? parsed.total : Number(parsed.total) || 0;
    let date = formatLocalDate(new Date());
    if (parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      try {
        parseLocalDate(parsed.date);
        date = parsed.date;
      } catch {
        // keep today
      }
    }
    return {
      description: (parsed.merchant ?? "Receipt").slice(0, 80),
      amount: Math.abs(amount),
      date,
      category: parsed.category ?? "Shopping",
      confidence: amount > 0 ? "high" : "medium",
      source: "openai-vision",
    };
  } catch {
    return null;
  }
}

/** Scan receipt from a data URL or remote image URL (images only for vision). */
export async function scanReceiptImage(input: {
  imageUrl: string;
  mimeType: string;
  fileName?: string;
}): Promise<ReceiptScanSuggestion> {
  const isImage = input.mimeType.startsWith("image/");
  if (isImage && input.imageUrl) {
    const vision = await callOpenAIVision(input.imageUrl);
    if (vision && vision.amount > 0) return vision;
    if (vision) return vision;
  }

  if (input.fileName && !isImage) {
    return parseReceiptText("", input.fileName);
  }

  return parseReceiptText(input.fileName ?? "", input.fileName);
}
