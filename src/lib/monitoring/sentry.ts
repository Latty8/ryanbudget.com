type SentryLevel = "info" | "warning" | "error";

/** Lightweight Sentry wrapper — no-ops when DSN is unset. */
export function captureMessage(message: string, level: SentryLevel = "info", extra?: Record<string, unknown>) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  if (!dsn) {
    if (process.env.NODE_ENV === "development") {
      console[level === "error" ? "error" : "log"](`[sentry:${level}]`, message, extra ?? "");
    }
    return;
  }

  void fetch("https://o0.ingest.sentry.io/api/0/envelope/", {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body: JSON.stringify({
      message,
      level,
      extra,
      tags: { app: "paycheck-planner" },
    }),
  }).catch(() => {
    // Avoid throwing from monitoring
  });
}

export function captureException(error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  captureMessage(message, "error", {
    ...extra,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
