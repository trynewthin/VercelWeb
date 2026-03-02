#!/usr/bin/env node
/**
 * Discover authoritative RSS/Atom/JSON feeds via Tavily search.
 * Output:
 *  - OPML file (default: dailynews/sources/authoritative.opml)
 *
 * Notes:
 *  - We DO NOT scrape aggressively; we only do light HTML fetch to find <link rel="alternate" ...>.
 */

import fs from "fs";
import path from "path";
import { execFileSync, execSync } from "child_process";

const tavilyPy = "/home/openclaw-workspace/agents/worker/skills/tavily-mcp-search/scripts/tavily_search.py";

function shanghaiDate(d = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

function clean(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function domain(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isFeedUrl(u) {
  const s = u.toLowerCase();
  return (
    s.endsWith(".rss") ||
    s.endsWith(".xml") ||
    s.endsWith(".atom") ||
    s.includes("/rss") ||
    s.includes("/atom") ||
    s.includes("feed=") ||
    s.endsWith("/feed") ||
    s.endsWith("/feed/") ||
    s.endsWith("feed.xml") ||
    s.endsWith("atom.xml") ||
    s.endsWith("rss.xml") ||
    s.endsWith("feed.json")
  );
}

function tavily(query, maxResults = 8, depth = "advanced") {
  const out = execFileSync("python3", [tavilyPy, "--query", query, "--max-results", String(maxResults), "--search-depth", depth], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const data = JSON.parse(out);
  return data.results || [];
}

function fetchHtml(u) {
  // small, fast fetch; follow redirects; cap size
  try {
    return execSync(`curl -fsSL --max-time 20 ${JSON.stringify(u)} | head -c 200000`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function extractFeedsFromHtml(html, baseUrl) {
  const feeds = new Set();
  if (!html) return feeds;

  // <link rel="alternate" type="application/rss+xml" href="...">
  const linkRe = /<link\s+[^>]*rel=["']alternate["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  const typeRe = /type=["']([^"']+)["']/i;

  const base = new URL(baseUrl);

  const matches = html.match(linkRe) || [];
  for (const tag of matches) {
    const hrefM = tag.match(hrefRe);
    const typeM = tag.match(typeRe);
    const type = (typeM?.[1] || "").toLowerCase();
    const href = hrefM?.[1];
    if (!href) continue;
    if (!(type.includes("rss") || type.includes("atom") || type.includes("json"))) continue;
    try {
      feeds.add(new URL(href, base).toString());
    } catch {
      // ignore
    }
  }

  // common patterns in anchor tags
  const aRe = /href=["']([^"']+\/(?:feed|rss|atom)(?:\.xml)?)["']/gi;
  let m;
  while ((m = aRe.exec(html))) {
    const href = m[1];
    try {
      feeds.add(new URL(href, base).toString());
    } catch {}
  }

  return feeds;
}

function opmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

const outPath = process.env.OUT_OPML || process.argv[2] || "sources/authoritative.opml";
const today = shanghaiDate();

const categories = [
  {
    name: "国际（权威媒体）",
    queries: [
      "Reuters RSS feed",
      "AP News RSS feed",
      "BBC RSS feeds",
      "DW RSS feed",
      "Al Jazeera RSS",
      "Le Monde RSS feed English",
    ],
  },
  {
    name: "机构/数据（官方）",
    queries: [
      "UN News RSS",
      "WHO RSS",
      "IMF RSS feed",
      "World Bank RSS feed",
      "ECB press release RSS",
      "Federal Reserve RSS feed",
    ],
  },
  {
    name: "中国（官方/权威）",
    queries: [
      "新华社 RSS",
      "人民网 RSS",
      "央视 RSS",
      "中国政府网 RSS",
      "中国日报 RSS",
      "中新网 RSS",
    ],
  },
];

const found = new Map(); // feedUrl -> {title, siteUrl, category}

for (const cat of categories) {
  for (const q of cat.queries) {
    let results = [];
    try {
      results = tavily(q, 8, "advanced");
    } catch {
      continue;
    }
    for (const r of results) {
      const url = clean(r.url);
      if (!url) continue;

      // If it's already a feed-ish url, keep it
      if (isFeedUrl(url)) {
        const u = url;
        if (!found.has(u)) found.set(u, { title: clean(r.title) || domain(u), siteUrl: "", category: cat.name });
        continue;
      }

      // Otherwise fetch html and extract feed links
      const html = fetchHtml(url);
      const feeds = extractFeedsFromHtml(html, url);
      for (const f of feeds) {
        if (!isFeedUrl(f)) continue;
        if (!found.has(f)) found.set(f, { title: domain(f) || clean(r.title) || "feed", siteUrl: url, category: cat.name });
      }
    }
  }
}

// Build OPML outlines
const grouped = new Map();
for (const [feedUrl, meta] of found.entries()) {
  if (!grouped.has(meta.category)) grouped.set(meta.category, []);
  grouped.get(meta.category).push({ feedUrl, ...meta });
}

for (const items of grouped.values()) {
  items.sort((a, b) => a.feedUrl.localeCompare(b.feedUrl));
}

const opml = [];
opml.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
opml.push("<opml version=\"2.0\">");
opml.push("  <head>");
opml.push(`    <title>Authoritative Feeds (discovered ${today})</title>`);
opml.push("  </head>");
opml.push("  <body>");

for (const [catName, items] of grouped.entries()) {
  opml.push(`    <outline text=\"${opmlEscape(catName)}\">`);
  for (const it of items) {
    const text = it.title || domain(it.feedUrl) || it.feedUrl;
    opml.push(
      `      <outline type=\"rss\" text=\"${opmlEscape(text)}\" xmlUrl=\"${opmlEscape(it.feedUrl)}\" htmlUrl=\"${opmlEscape(it.siteUrl || "")}\" />`
    );
  }
  opml.push("    </outline>");
}

opml.push("  </body>");
opml.push("</opml>");

const absOut = path.isAbsolute(outPath) ? outPath : path.resolve(process.cwd(), outPath);
fs.mkdirSync(path.dirname(absOut), { recursive: true });
fs.writeFileSync(absOut, opml.join("\n") + "\n", "utf-8");

console.log(`Wrote OPML: ${absOut} (${found.size} candidate feeds)`);
