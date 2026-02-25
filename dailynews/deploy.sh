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

# ── Step 1: YAML 校验 ──
step "Step 1/4: YAML 格式校验"
cd "$PROJECT_DIR"
if node validate.mjs; then
  info "校验通过"
else
  fail "YAML 校验失败，请修正后重试"
fi

# ── Step 2: 构建检查 ──
step "Step 2/4: TypeScript + Vite 构建"
if npm run build > /dev/null 2>&1; then
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
