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

exec "$ROOT/node_modules/.bin/next" start -H "$HOSTNAME" -p "$PORT"
