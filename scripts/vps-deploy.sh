#!/usr/bin/env bash
set -euo pipefail

cd /var/www/ryanbudget.me

# Install before sourcing .env.production — NODE_ENV=production skips devDependencies.
npm install --include=dev

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

npm run build

pm2 delete ryanbudget 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save

sleep 2
echo "--- health (local) ---"
curl -sf "http://127.0.0.1:3002/api/health" || { echo "FAIL: app not listening on 3002"; pm2 logs ryanbudget --lines 40 --nostream; exit 1; }
echo
echo "--- pm2 status ---"
pm2 status ryanbudget
