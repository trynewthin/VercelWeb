#!/usr/bin/env bash
set -euo pipefail

# Daily News: fetch RSS -> generate public/news.yaml (yesterday, Asia/Shanghai) -> validate -> deploy

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PATH="/home/admin/go/bin:$PATH"

LIMIT="${LIMIT:-30}"
TARGET_DATE="${TARGET_DATE:-}"

TMP_JSON="/tmp/feed-entries.json"

feed fetch
feed get entries --limit 1000 -o json > "$TMP_JSON"

if [[ -n "$TARGET_DATE" ]]; then
  TARGET_DATE="$TARGET_DATE" LIMIT="$LIMIT" FEED_JSON="$TMP_JSON" node scripts/generate_from_feed.mjs
else
  LIMIT="$LIMIT" FEED_JSON="$TMP_JSON" node scripts/generate_from_feed.mjs
fi

# Ensure dependencies installed
if [ ! -d node_modules ]; then
  echo "Installing dependencies (npm install --no-audit --no-fund)..."
  npm install --no-audit --no-fund
fi


npm run validate
npm run deploy
