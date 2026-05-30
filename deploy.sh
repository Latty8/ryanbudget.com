#!/usr/bin/env bash
# One-command deploy for the VPS.
#
#   ./deploy          Pull latest, install, build, restart
#   ./deploy quick    Restart only (no build)
#
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-}"

if [[ "$MODE" == "quick" ]]; then
  echo "Restarting..."
  pm2 restart ryanbudget 2>/dev/null || pm2 start ecosystem.config.cjs
  pm2 save
  sleep 2
  curl -sf "http://127.0.0.1:3002/api/health" && echo && echo "Done."
  exit 0
fi

echo "Deploying..."
[[ -d .git ]] && git pull --ff-only || true

npm install --include=dev

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

npm run build

pm2 delete ryanbudget 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

sleep 2
curl -sf "http://127.0.0.1:3002/api/health" && echo
echo "Deploy complete."
