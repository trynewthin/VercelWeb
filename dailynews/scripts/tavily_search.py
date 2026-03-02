#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path


def resolve_api_key() -> str:
    k = os.getenv("TAVILY_API_KEY", "").strip()
    if k:
        return k

    mcp_url = os.getenv("TAVILY_MCP_URL", "").strip()

    if not mcp_url:
        p = Path("/home/admin/.openclaw/tavily_mcp_url.txt")
        if p.exists():
            mcp_url = p.read_text(encoding="utf-8", errors="ignore").strip()

    if mcp_url:
        q = urllib.parse.urlparse(mcp_url).query
        params = urllib.parse.parse_qs(q)
        v = params.get("tavilyApiKey", [""])[0].strip()
        if v:
            return v

    return ""


def tavily_search(api_key: str, query: str, max_results: int, search_depth: str):
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": query,
        "max_results": max_results,
        "search_depth": search_depth,
        "include_answer": False,
        "include_images": False,
        "include_raw_content": False,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", required=True)
    ap.add_argument("--max-results", type=int, default=5)
    ap.add_argument("--search-depth", choices=["basic", "advanced"], default="basic")
    args = ap.parse_args()

    key = resolve_api_key()
    if not key:
        print(
            "ERROR: missing Tavily key. Set TAVILY_API_KEY or TAVILY_MCP_URL, or /home/admin/.openclaw/tavily_mcp_url.txt.",
            file=sys.stderr,
        )
        sys.exit(2)

    try:
        data = tavily_search(key, args.query, args.max_results, args.search_depth)
    except Exception as e:
        print(f"ERROR: Tavily request failed: {e}", file=sys.stderr)
        sys.exit(1)

    out = []
    for r in data.get("results", [])[: args.max_results]:
        out.append({"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("content", "")})

    print(json.dumps({"query": args.query, "results": out}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
