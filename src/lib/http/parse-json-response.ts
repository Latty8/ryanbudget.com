/** Parse JSON from a fetch Response; avoids "Unexpected end of JSON input" on empty bodies. */
export async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function jsonResponseError(
  response: Response,
  fallback = "Server returned an invalid response."
): string {
  if (response.status >= 500) return "Server error — try again in a moment.";
  if (response.status === 503) return "Service temporarily unavailable.";
  return fallback;
}
