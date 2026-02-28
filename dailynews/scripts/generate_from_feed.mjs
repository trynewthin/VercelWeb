#!/usr/bin/env node
/**
 * Generate public/news.yaml from local feed CLI entries.
 *
 * Inputs:
 *  - FEED_JSON: path to a JSON file produced by `feed get entries -o json`
 *  - TARGET_DATE: YYYY-MM-DD in Asia/Shanghai to include (defaults to yesterday in Asia/Shanghai)
 *  - LIMIT: max number of items (default 30)
 *
 * Output:
 *  - writes to public/news.yaml
 */

import fs from "fs";
import path from "path";

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

function classify(entry) {
  const t = (entry.feedTitle || "").toLowerCase();
  const u = (entry.url || "").toLowerCase();
  const d = domainFromUrl(entry.url || "").toLowerCase();
  const text = `${t} ${u} ${d}`;

  // rough heuristics (can be refined later)
  if (/(hnrss|ycombinator|github\.com|dev|swift|ios|android|tech|ai|docker|cloud|program|code)/.test(text)) return "💻 科技";
  if (/(verge|bbc|guardian|reuters|apnews|nytimes|wsj|economist|dw\.com|aljazeera)/.test(text)) return "🌍 国际";
  if (/(36kr|finance|market|stock|econom|bloomberg|ft\.com|coin|crypto|invest)/.test(text)) return "💰 财经";
  if (/(movie|music|game|podcast|entertain|culture|art|design|sspai)/.test(text)) return "🎬 文化";

  return "🧩 其他";
}

function yamlEscape(s) {
  s = String(s ?? "");
  const needsQuote = /[:\n\r\t]|^\s|\s$|^[-?:,[\]{}#&*!|>'\"%@`]/.test(s);
  if (!needsQuote) return s;
  const escaped = s.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
  return `\"${escaped}\"`;
}

const FEED_JSON = process.env.FEED_JSON || process.argv[2];
if (!FEED_JSON) {
  console.error("Missing FEED_JSON (env or arg)");
  process.exit(2);
}

const LIMIT = Number(process.env.LIMIT || 30);
const target = process.env.TARGET_DATE || (() => {
  const now = new Date();
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return shanghaiDate(y);
})();

const raw = fs.readFileSync(FEED_JSON, "utf-8");
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error("Invalid JSON in FEED_JSON:", e.message);
  process.exit(2);
}

const entries = (Array.isArray(data) ? data : data.entries || [])
  .map((e) => {
    const date = parseDateSafe(e.date || e.published_at || e.publishedAt || e.published || e.publishedAt || e.created_at || e.createdAt || e.fetched_at);
    const url = e.url || e.link || "";
    const feedTitle = e.feed_title || e.feedTitle || e.feed || e.feed_name || "";
    const title = e.title || "";
    const summary = e.summary || e.content_md || e.content_html || e.content || e.description || "";
    return {
      id: e.id ?? e._id ?? null,
      date,
      url,
      feedTitle: cleanText(feedTitle) || domainFromUrl(url) || "RSS",
      title: cleanText(title),
      summary: cleanText(summary),
    };
  })
  .filter((e) => e.date && e.title);

const todays = entries.filter((e) => shanghaiDate(e.date) === target);

// de-dup by URL/title
const seen = new Set();
const deduped = [];
for (const e of todays.sort((a, b) => b.date - a.date)) {
  const key = e.url ? `u:${e.url}` : `t:${e.title.toLowerCase()}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(e);
}

// diversity: cap per source
const perSourceCap = 4;
const perSource = new Map();
const picked = [];
for (const e of deduped) {
  const k = e.feedTitle;
  const c = perSource.get(k) || 0;
  if (c >= perSourceCap) continue;
  perSource.set(k, c + 1);
  picked.push(e);
  if (picked.length >= LIMIT) break;
}

if (picked.length === 0) {
  console.error(`No entries for target date ${target}.`);
  process.exit(1);
}

// build sections
const sections = new Map();
for (const e of picked) {
  const sec = classify(e);
  if (!sections.has(sec)) sections.set(sec, []);
  sections.get(sec).push(e);
}

const headline = picked[0];

const lines = [];
lines.push("sections:");

// headline
lines.push(`  - name: ${yamlEscape("🔥 头条")}`);
lines.push("    items:");
lines.push("      - title: " + yamlEscape(clip(headline.title, 72)));
lines.push("        summary: " + yamlEscape(clip(headline.summary || headline.title, 140)));
lines.push("        source: " + yamlEscape(headline.feedTitle));
lines.push("        time: " + yamlEscape(shanghaiTimeHM(headline.date)));
if (headline.url) lines.push("        url: " + yamlEscape(headline.url));
lines.push("");

const order = ["💻 科技", "💰 财经", "🌍 国际", "🎬 文化", "🧩 其他"];
for (const name of order) {
  const items = sections.get(name);
  if (!items || items.length === 0) continue;
  lines.push(`  - name: ${yamlEscape(name)}`);
  lines.push("    items:");
  for (const e of items) {
    if (e === headline) continue;
    lines.push("      - title: " + yamlEscape(clip(e.title, 72)));
    lines.push("        summary: " + yamlEscape(clip(e.summary || e.title, 140)));
    lines.push("        source: " + yamlEscape(e.feedTitle));
    lines.push("        time: " + yamlEscape(shanghaiTimeHM(e.date)));
    lines.push("        tag: " + yamlEscape(name.replace(/^..\s/, "")));
    if (e.url) lines.push("        url: " + yamlEscape(e.url));
  }
  lines.push("");
}

const outPath = path.resolve(process.cwd(), "public/news.yaml");
fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
console.log(`Wrote ${outPath} for date ${target} with ${picked.length} items.`);
