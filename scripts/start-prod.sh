#!/usr/bin/env bash
# Loads .env.production and starts Next.js (used by PM2).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3002}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "WARNING: MONGODB_URI is not set — registration and cloud sync will fail." >&2
  echo "Create .env.production in $ROOT with MONGODB_URI=..." >&2
fi

if [[ -z "${NEXTAUTH_SECRET:-}" ]]; then
  echo "WARNING: NEXTAUTH_SECRET is not set — OAuth bridge may be unavailable." >&2
  echo "Add NEXTAUTH_SECRET=\$(openssl rand -base64 32) to .env.production" >&2
fi

exec "$ROOT/node_modules/.bin/next" start -H "$HOSTNAME" -p "$PORT"
