#!/usr/bin/env bash
# Alias for deploy.sh — run: bash scripts/vps-deploy.sh
exec "$(dirname "$0")/../deploy.sh" "$@"
