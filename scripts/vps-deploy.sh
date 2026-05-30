#!/usr/bin/env bash
set -euo pipefail

cd /var/www/ryanbudget.me

echo "==> Stopping app (brief 502 while rebuilding is normal)"
pm2 delete ryanbudget 2>/dev/null || true

echo "==> Installing dependencies (before sourcing env)"
npm install --include=dev

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

echo "==> Building"
npm run build

if [[ ! -f .next/BUILD_ID ]]; then
  echo "ERROR: Build failed — .next/BUILD_ID missing"
  exit 1
fi

echo "==> Starting app (fork mode)"
pm2 start ecosystem.config.cjs --update-env
pm2 save

echo "==> Waiting for app..."
sleep 3

echo "--- local health ---"
curl -sf "http://127.0.0.1:3002/api/health" || {
  echo "FAIL: app not listening on 3002"
  pm2 logs ryanbudget --lines 50 --nostream
  exit 1
}
echo

echo "--- callback route (must be 200 HTML page, NOT 307 redirect) ---"
CALLBACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3002/auth/callback")
echo "GET /auth/callback => HTTP $CALLBACK_STATUS"
if [[ "$CALLBACK_STATUS" != "200" ]]; then
  echo "WARN: Expected HTTP 200 (client callback page)."
  echo "      HTTP 307 means old server route is still deployed — run git pull and rebuild."
fi

echo "--- pm2 status ---"
pm2 status ryanbudget
