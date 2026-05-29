"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export function PlaidLinkButton({
  onSuccess,
  disabled,
}: {
  onSuccess: () => void;
  disabled?: boolean;
}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" });
      const data = (await res.json()) as {
        linkToken?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not start bank link");
      }
      setLinkToken(data.linkToken ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start bank link");
      setLinkToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchToken();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchToken]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        const res = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to link account");
        }
        onSuccess();
        void fetchToken();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to link account");
      }
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn-primary"
        disabled={disabled || loading || !ready || !linkToken}
        onClick={() => open()}
      >
        {loading ? "Preparing…" : "Connect bank"}
      </button>
      {error ? (
        <p className="text-sm text-negative">{error}</p>
      ) : null}
    </div>
  );
}
