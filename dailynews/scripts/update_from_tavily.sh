#!/usr/bin/env bash
set -euo pipefail

# Daily News: Tavily search (authoritative allowlist) -> generate public/news.yaml -> validate -> deploy

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LIMIT="${LIMIT:-30}"
TARGET_DATE="${TARGET_DATE:-}"

# Ensure dependencies installed
if [ ! -d node_modules ]; then
  echo "Installing dependencies (npm install --no-audit --no-fund)..."
  npm install --no-audit --no-fund
fi

if [[ -n "$TARGET_DATE" ]]; then
  TARGET_DATE="$TARGET_DATE" LIMIT="$LIMIT" node scripts/generate_from_tavily.mjs
else
  LIMIT="$LIMIT" node scripts/generate_from_tavily.mjs
fi

npm run validate
npm run deploy
