#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
#  Daily News — 自动校验 → 提交 → 推送脚本
# ──────────────────────────────────────────────
#
#  用法: bash dailynews/deploy.sh [提交信息]
#  默认提交信息: "📰 update daily news YYYY-MM-DD"
#
#  执行流程:
#    1. npm run validate  — YAML 格式校验
#    2. npm run build     — TypeScript + Vite 构建检查
#    3. git add           — 仅暂存 dailynews/ 下的变更
#    4. git commit        — 提交
#    5. git push          — 推送到 GitHub
# ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
REPO_ROOT="$(cd "$PROJECT_DIR/.." && pwd)"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
DIM='\033[2m'
NC='\033[0m'

info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "${RED}✗${NC} $1"; exit 1; }
step()  { echo -e "\n${DIM}──${NC} $1 ${DIM}──${NC}"; }

# 兼容 Windows/Git Bash：兜底解析 node/npm
resolve_bin() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
    return 0
  fi

  # Git Bash 常见位置
  local candidates=(
    "/c/Program Files/nodejs/${name}.exe"
    "/c/Program Files/nodejs/${name}"
    "/c/Program Files (x86)/nodejs/${name}.exe"
    "/c/Program Files (x86)/nodejs/${name}"
  )

  for c in "${candidates[@]}"; do
    if [ -x "$c" ]; then
      echo "$c"
      return 0
    fi
  done

  # Windows fallback: query through where.exe
  if command -v where.exe >/dev/null 2>&1; then
    local win_path
    win_path="$(where.exe "$name" 2>/dev/null | head -n 1 | tr -d '\r')"
    if [ -n "$win_path" ]; then
      echo "$win_path"
      return 0
    fi
  fi

  return 1
}

NODE_BIN="$(resolve_bin node || true)"
NPM_BIN="$(resolve_bin npm || true)"

[ -n "$NODE_BIN" ] || fail "未找到 node，可先在当前终端执行: node -v"

run_node() {
  if command -v node >/dev/null 2>&1; then
    node "$@"
    return $?
  fi
  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c node "$@"
    return $?
  fi
  "$NODE_BIN" "$@"
}

run_npm() {
  if command -v npm >/dev/null 2>&1; then
    npm "$@"
    return $?
  fi
  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c npm "$@"
    return $?
  fi
  "$NPM_BIN" "$@"
}

# ── Step 1: YAML 校验 ──
step "Step 1/4: YAML 格式校验"
cd "$PROJECT_DIR"
if run_node validate.mjs; then  info "校验通过"
else
  fail "YAML 校验失败，请修正后重试"
fi

# ── Step 2: 构建检查 ──
step "Step 2/4: TypeScript + Vite 构建"
if run_npm run build > /dev/null 2>&1; then
  info "构建成功"
else
  fail "构建失败，请修正后重试"
fi

# ── Step 3: Git 暂存 ──
step "Step 3/4: Git 暂存变更"
cd "$REPO_ROOT"

# 仅暂存 dailynews/ 目录下的文件
git add dailynews/

# 检查是否有变更
if git diff --cached --quiet -- dailynews/; then
  warn "没有检测到 dailynews/ 下的新变更，跳过提交"
  exit 0
fi

# 显示变更摘要
echo ""
git diff --cached --stat -- dailynews/
echo ""

# ── Step 4: 提交并推送 ──
step "Step 4/4: 提交并推送"
DATE=$(date +%Y-%m-%d)
MSG="${1:-📰 update daily news $DATE}"

git commit -m "$MSG"
info "已提交: $MSG"

git push origin master
info "已推送到 GitHub"

echo ""
info "部署完成 🎉"
