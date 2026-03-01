#!/usr/bin/env bash
set -euo pipefail

# Generate-only stage: Tavily search -> write public/news.yaml (EN) then STOP for manual translation.
# Usage: LIMIT=30 TARGET_DATE=YYYY-MM-DD bash scripts/update_from_tavily.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LIMIT="${LIMIT:-30}"
TARGET_DATE="${TARGET_DATE:-}"

# Ensure dependencies installed (needed for validate/deploy later, but keep it here to avoid surprises)
if [ ! -d node_modules ]; then
  echo "Installing dependencies (npm install --no-audit --no-fund)..."
  npm install --no-audit --no-fund
fi

if [[ -n "$TARGET_DATE" ]]; then
  TARGET_DATE="$TARGET_DATE" LIMIT="$LIMIT" node scripts/generate_from_tavily.mjs
else
  LIMIT="$LIMIT" node scripts/generate_from_tavily.mjs
fi

echo ""
echo "=== PAUSE: translation required ==="
echo "public/news.yaml 已生成（当前可能是英文）。请先由打工人翻译 title/summary 为中文，然后再运行："
echo "  npm run deploy:after-translate"
echo "(该命令会执行 validate + deploy，并提交推送)"
