#!/usr/bin/env bash
set -euo pipefail

# Deploy stage: validate + deploy (commit+push)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Ensure deps
if [ ! -d node_modules ]; then
  echo "Installing dependencies (npm install --no-audit --no-fund)..."
  npm install --no-audit --no-fund
fi

npm run validate
npm run deploy
