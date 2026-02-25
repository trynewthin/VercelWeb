#Requires -Version 5.1
<#
.SYNOPSIS
    Daily News — 自动校验 → 提交 → 推送脚本 (PowerShell 版)
.DESCRIPTION
    执行流程:
      1. npm run validate  — YAML 格式校验
      2. npm run build     — TypeScript + Vite 构建检查
      3. git add           — 仅暂存 dailynews/ 下的变更
      4. git commit        — 提交
      5. git push          — 推送到 GitHub
.PARAMETER Message
    自定义提交信息，默认: "📰 update daily news YYYY-MM-DD"
.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -Message "fix: 修复新闻格式"
#>

param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

$ProjectDir = $PSScriptRoot
$RepoRoot = Split-Path $ProjectDir -Parent

function Write-Step($text) { Write-Host "`n-- $text --" -ForegroundColor DarkGray }
function Write-OK($text)   { Write-Host "✓ $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "⚠ $text" -ForegroundColor Yellow }
function Write-Fail($text) { Write-Host "✗ $text" -ForegroundColor Red; exit 1 }

# ── Step 1: YAML 校验 ──
Write-Step "Step 1/4: YAML 格式校验"
Set-Location $ProjectDir
node validate.mjs
if ($LASTEXITCODE -ne 0) { Write-Fail "YAML 校验失败，请修正后重试" }
Write-OK "校验通过"

# ── Step 2: 构建检查 ──
Write-Step "Step 2/4: TypeScript + Vite 构建"
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "构建失败，请修正后重试" }
Write-OK "构建成功"

# ── Step 3: Git 暂存 ──
Write-Step "Step 3/4: Git 暂存变更"
Set-Location $RepoRoot

git add dailynews/

$diff = git diff --cached --name-only -- dailynews/
if (-not $diff) {
    Write-Warn "没有检测到 dailynews/ 下的新变更，跳过提交"
    exit 0
}

Write-Host ""
git diff --cached --stat -- dailynews/
Write-Host ""

# ── Step 4: 提交并推送 ──
Write-Step "Step 4/4: 提交并推送"
$date = Get-Date -Format "yyyy-MM-dd"
if (-not $Message) { $Message = "📰 update daily news $date" }

git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Fail "提交失败" }
Write-OK "已提交: $Message"

git push origin master
if ($LASTEXITCODE -ne 0) { Write-Fail "推送失败" }
Write-OK "已推送到 GitHub"

Write-Host ""
Write-OK "部署完成 🎉"
