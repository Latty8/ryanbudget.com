#!/usr/bin/env bash
# Run on VPS: bash scripts/vps-diagnose.sh

set -u

echo "========== PM2 =========="
pm2 status ryanbudget 2>/dev/null || pm2 status

echo
echo "========== Port 3002 =========="
ss -tlnp | grep 3002 || echo "NOTHING listening on 3002"

echo
echo "========== Local app (bypass nginx) =========="
curl -sf "http://127.0.0.1:3002/api/health" && echo || echo "FAIL local health"
curl -s -o /dev/null -w "local /auth/callback => HTTP %{http_code}\n" "http://127.0.0.1:3002/auth/callback"

echo
echo "========== Through nginx (HTTPS) =========="
curl -sf "https://ryanbudget.me/api/health" && echo || echo "FAIL https health"
curl -s -o /dev/null -w "https /auth/callback => HTTP %{http_code}\n" "https://ryanbudget.me/auth/callback"

echo
echo "========== Build =========="
if [[ -f /var/www/ryanbudget.me/.next/BUILD_ID ]]; then
  echo "BUILD_ID: $(cat /var/www/ryanbudget.me/.next/BUILD_ID)"
else
  echo "MISSING .next/BUILD_ID — run npm run build"
fi

echo
echo "========== OAuth callback files on disk =========="
ls -la /var/www/ryanbudget.me/src/app/auth/callback/ 2>/dev/null || true
if [[ -f /var/www/ryanbudget.me/src/app/auth/callback/route.ts ]]; then
  echo "WARN: route.ts exists — OLD server callback (remove via git pull + rebuild)"
fi
if [[ -f /var/www/ryanbudget.me/src/app/auth/callback/page.tsx ]]; then
  echo "OK: page.tsx exists — client callback"
fi

echo
echo "========== Nginx proxy_pass for ryanbudget =========="
grep -r "proxy_pass\|ryanbudget" /etc/nginx/sites-enabled/ 2>/dev/null || true

echo
echo "========== Interpretation =========="
echo "  local health OK + https 502  => nginx points to wrong port (fix proxy_pass to 127.0.0.1:3002)"
echo "  local health FAIL             => app not running or wrong port"
echo "  callback HTTP 307             => old server route — git pull, rm -rf .next, npm run build, pm2 restart"
echo "  callback HTTP 200             => new client callback deployed correctly"
