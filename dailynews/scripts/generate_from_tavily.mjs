#!/usr/bin/env node
/**
 * Generate public/news.yaml using Tavily search (via ~/.openclaw/skills/tavily-mcp-search/scripts/tavily_search.py).
 * Goal: cleaner, authoritative news.
 */

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

function shanghaiDate(d = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function shanghaiTimeHM(d) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(d);
}

function parseDateSafe(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function cleanText(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function clip(s, max) {
  s = cleanText(s);
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function domainFromUrl(u) {
  try {
    const url = new URL(u);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function yamlEscape(s) {
  s = String(s ?? "");
  const needsQuote = /[:\n\r\t]|^\s|\s$|^[-?:,[\]{}#&*!|>'\"%@`]/.test(s);
  if (!needsQuote) return s;
  const escaped = s.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
  return `\"${escaped}\"`;
}

function classifyByDomain(url) {
  const d = domainFromUrl(url).toLowerCase();
  if (/reuters|apnews|bbc\.|theguardian|wsj|ft\.|economist|aljazeera|dw\.com|france24|nytimes/.test(d)) return "🌍 国际";
  if (/cna\.com\.sg|japantimes|nhk|koreaherald|straitstimes|scmp/.test(d)) return "🌏 亚太";
  if (/caixin|yicai|36kr|thepaper|xinhua|cgtn|people\.cn/.test(d)) return "🇨🇳 中国";
  if (/bloomberg|marketwatch|cnbc|investing|coindesk/.test(d)) return "💰 财经";
  if (/nature|science|arstechnica|techcrunch|theverge/.test(d)) return "💻 科技";
  return "🧩 其他";
}

const LIMIT = Number(process.env.LIMIT || 30);
const target = process.env.TARGET_DATE || (() => {
  const now = new Date();
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return shanghaiDate(y);
})();

const targetDateObj = parseDateSafe(target + "T12:00:00+08:00") || new Date();
const targetHuman = target; // YYYY-MM-DD

const python = "python3";
const tavilyPy = "/home/admin/.openclaw/skills/tavily-mcp-search/scripts/tavily_search.py";

function tavily(query, maxResults = 8, depth = "advanced") {
  const out = execFileSync(python, [tavilyPy, "--query", query, "--max-results", String(maxResults), "--search-depth", depth], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const data = JSON.parse(out);
  return data.results || [];
}

// Authoritative domains (avoid blogs/forums)
const allowDomains = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "theguardian.com",
  "aljazeera.com",
  "dw.com",
  "france24.com",
  "economist.com",
  "ft.com",
  "wsj.com",
  "nytimes.com",
  "npr.org",
  "washingtonpost.com",
  "cnn.com",
  "sky.com",
  "abcnews.go.com",
  "cbsnews.com",
  "time.com",
  "lemonde.fr",
  "elpais.com",
  "spiegel.de",
  "cna.com.sg",
  "nhk.or.jp",
  "japantimes.co.jp",
  "straitstimes.com",
  "scmp.com",
  "xinhuanet.com",
  "news.cn",
  "people.com.cn",
  "cctv.com",
  "chinanews.com.cn",
  "gov.cn",
  "chinadaily.com.cn",
  "caixin.com",
  "yicai.com",
  "thepaper.cn",
  "36kr.com",
];

function isBadUrl(url) {
  const u = url.toLowerCase();
  // Filter index/section/gallery/live pages that aren't single news items
  const deny = [
    /\/pictures\//,
    /\/gallery\//,
    /\/section\//,
    /\/topics\//,
    /\/tag\//,
    /\/topic\//,
    /\/hub\//,
    /\/index\.html$/,
    /\/live\//,
    /\/live-/,
    /\/liveblog\//,
    /-live-/, // e.g., reuters "crisis-live"
  ];
  if (deny.some((re) => re.test(u))) return true;

  // Guardian newspaper front page like /theguardian/2026/feb/27
  if (/theguardian\.com\/theguardian\/\d{4}\/\w{3}\/\d{1,2}\/?$/.test(u)) return true;

  // NYTimes section landing pages
  if (/nytimes\.com\/(?:ca\/)?section\//.test(u)) return true;

  // SCMP category landing pages and homepages
  if (/scmp\.com\/$/.test(u)) return true;
  if (/scmp\.com\/news\/[a-z-]+\/?$/.test(u)) return true;

  // AP hub pages
  if (/apnews\.com\/hub\//.test(u)) return true;

  // BBC topic/region landing pages
  if (/bbc\.com\/news\/world\/[a-z_]+\/?$/.test(u)) return true;

  // Japan Times landing pages
  if (/japantimes\.co\.jp\/(?:latest-news|latest_news)\/?$/.test(u)) return true;
  // generic homepage-only URLs
  try {
    const uu = new URL(url);
    if (uu.pathname === "/" || uu.pathname === "") return true;
  } catch {}

  return false;
}

function allowlistFilter(url) {
  const d = domainFromUrl(url).toLowerCase();
  if (!allowDomains.some((x) => d === x || d.endsWith("." + x))) return false;
  if (isBadUrl(url)) return false;
  return true;
}

// Query plan (simple + broad). Tavily doesn’t guarantee date filtering; we include date tokens.
const queries = [
  // World / geopolitics
  { section: "🌍 国际", q: `top world news ${targetHuman} site:reuters.com OR site:apnews.com OR site:bbc.com OR site:theguardian.com` },
  { section: "🌍 国际", q: `Europe news ${targetHuman} site:reuters.com OR site:bbc.com OR site:spiegel.de OR site:lemonde.fr OR site:elpais.com` },
  { section: "🌍 国际", q: `Middle East news ${targetHuman} site:reuters.com OR site:aljazeera.com OR site:dw.com` },
  { section: "🌍 国际", q: `Africa news ${targetHuman} site:reuters.com OR site:bbc.com OR site:apnews.com` },
  { section: "🌍 国际", q: `Latin America news ${targetHuman} site:reuters.com OR site:apnews.com OR site:bbc.com` },

  // Asia-Pacific
  { section: "🌏 亚太", q: `Asia Pacific news ${targetHuman} site:cna.com.sg OR site:straitstimes.com OR site:scmp.com OR site:nhk.or.jp OR site:japantimes.co.jp` },

  // China
  { section: "🇨🇳 中国", q: `China news policy economy ${targetHuman} site:xinhuanet.com OR site:news.cn OR site:people.com.cn OR site:cctv.com OR site:chinanews.com.cn OR site:gov.cn OR site:chinadaily.com.cn OR site:caixin.com OR site:yicai.com OR site:thepaper.cn OR site:36kr.com` },

  // Business / markets
  { section: "💰 财经", q: `global markets stocks bonds oil ${targetHuman} site:reuters.com OR site:ft.com OR site:wsj.com` },
  { section: "💰 财经", q: `central banks inflation rates ${targetHuman} site:reuters.com OR site:ft.com OR site:economist.com` },

  // Tech / science / health / climate
  { section: "💻 科技", q: `technology AI cybersecurity ${targetHuman} site:reuters.com OR site:apnews.com OR site:bbc.com` },
  { section: "💻 科技", q: `space science research ${targetHuman} site:apnews.com OR site:bbc.com OR site:reuters.com` },
  { section: "🧩 其他", q: `public health disease WHO ${targetHuman} site:reuters.com OR site:apnews.com OR site:bbc.com` },
  { section: "🧩 其他", q: `climate extreme weather energy transition ${targetHuman} site:reuters.com OR site:bbc.com OR site:apnews.com` },
];

const all = [];
for (const item of queries) {
  let results = [];
  try {
    results = tavily(item.q, 12, "advanced");
  } catch (e) {
    // continue; Tavily may rate limit occasionally
    continue;
  }
  for (const r of results) {
    const url = cleanText(r.url);
    if (!url) continue;
    if (!allowlistFilter(url)) continue;
    all.push({
      sectionHint: item.section,
      title: cleanText(r.title),
      snippet: cleanText(r.snippet || r.content || ""),
      url,
      source: domainFromUrl(url) || "Tavily",
    });
  }
}

// de-dup
const seen = new Set();
const deduped = [];
for (const r of all) {
  const key = `u:${r.url}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(r);
}

// cap per domain
const perDomainCap = 4;
const perDomain = new Map();
const picked = [];
for (const r of deduped) {
  const d = r.source;
  const c = perDomain.get(d) || 0;
  if (c >= perDomainCap) continue;
  perDomain.set(d, c + 1);
  picked.push(r);
  if (picked.length >= LIMIT) break;
}

if (picked.length === 0) {
  console.error(`No Tavily results after filtering for ${targetHuman}.`);
  process.exit(1);
}

// group sections
const sections = new Map();
for (const r of picked) {
  const sec = r.sectionHint || classifyByDomain(r.url);
  if (!sections.has(sec)) sections.set(sec, []);
  sections.get(sec).push(r);
}

const headline = picked[0];
const lines = [];
lines.push("sections:");

lines.push(`  - name: ${yamlEscape("🔥 头条")}`);
lines.push("    items:");
lines.push("      - title: " + yamlEscape(clip(headline.title, 72)));
lines.push("        summary: " + yamlEscape(clip(headline.snippet || headline.title, 180)));
lines.push("        source: " + yamlEscape(headline.source));
lines.push("        time: " + yamlEscape(shanghaiTimeHM(targetDateObj)));
lines.push("        url: " + yamlEscape(headline.url));
lines.push("");

const order = ["🌍 国际", "🌏 亚太", "🇨🇳 中国", "💰 财经", "💻 科技", "🧩 其他"];
for (const name of order) {
  const items = sections.get(name);
  if (!items || items.length === 0) continue;
  lines.push(`  - name: ${yamlEscape(name)}`);
  lines.push("    items:");
  for (const r of items) {
    if (r === headline) continue;
    lines.push("      - title: " + yamlEscape(clip(r.title, 72)));
    lines.push("        summary: " + yamlEscape(clip(r.snippet || r.title, 180)));
    lines.push("        source: " + yamlEscape(r.source));
    lines.push("        time: " + yamlEscape(shanghaiTimeHM(targetDateObj)));
    lines.push("        tag: " + yamlEscape(name.replace(/^..\s/, "")));
    lines.push("        url: " + yamlEscape(r.url));
  }
  lines.push("");
}

const outPath = path.resolve(process.cwd(), "public/news.yaml");
fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
console.log(`Wrote ${outPath} for date ${targetHuman} with ${picked.length} items (Tavily).`);
