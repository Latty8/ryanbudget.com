const DISTINCT_KEY = "ph_distinct_id";

function getDistinctId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DISTINCT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DISTINCT_KEY, id);
  }
  return id;
}

/**
 * Client analytics — sends to PostHog when `NEXT_PUBLIC_POSTHOG_KEY` is set.
 */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key) {
    const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
    void fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: name,
        properties: { ...properties, $lib: "paycheck-planner" },
        distinct_id: getDistinctId(),
      }),
    }).catch(() => undefined);
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", name, properties);
  }
}
