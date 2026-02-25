#!/usr/bin/env node

/**
 * news.yaml 合法性校验脚本
 *
 * 用法: node validate.mjs [文件路径]
 * 默认校验: public/news.yaml
 *
 * 退出码: 0 = 通过, 1 = 失败
 */

import { readFileSync } from "fs";
import { load } from "js-yaml";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, process.argv[2] || "public/news.yaml");

// ─── 颜色辅助 ───
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const errors = [];
const warnings = [];

function error(path, msg) {
    errors.push(`  ${red("✗")} ${path}: ${msg}`);
}
function warn(path, msg) {
    warnings.push(`  ${yellow("⚠")} ${path}: ${msg}`);
}

// ─── 辅助 ───
function requireStr(obj, field, path) {
    if (typeof obj[field] !== "string" || obj[field].trim() === "") {
        error(`${path}.${field}`, "必填字段缺失或为空");
        return false;
    }
    return true;
}

function checkTime(val, path) {
    if (typeof val === "number") {
        error(path, `被解析为数字 ${val}，请加引号: "${String(val).padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2")}"`);
    } else if (typeof val === "string" && !/^\d{2}:\d{2}$/.test(val)) {
        error(path, `格式错误: "${val}"，应为 "HH:MM"（记得加引号）`);
    }
}

// ─── 1. 读取并解析 YAML ───
let raw;
try {
    raw = readFileSync(filePath, "utf-8");
} catch (e) {
    console.error(red(`✗ 无法读取文件: ${filePath}`));
    console.error(dim(`  ${e.message}`));
    process.exit(1);
}

let data;
try {
    data = load(raw);
} catch (e) {
    console.error(red(`✗ YAML 解析失败:`));
    console.error(dim(`  ${e.message}`));
    process.exit(1);
}

// ─── 2. 结构校验 ───
const VALID_TYPES = new Set(["news", "alert", "quote", "stats", "list"]);
const typeCounters = { news: 0, alert: 0, quote: 0, stats: 0, list: 0 };

if (!data || typeof data !== "object") {
    error("root", "文件顶层必须是一个对象");
} else if (!Array.isArray(data.sections)) {
    error("root.sections", "缺少 sections 数组");
} else if (data.sections.length === 0) {
    error("root.sections", "sections 数组不能为空");
} else {
    // 顶层未知字段
    for (const key of Object.keys(data)) {
        if (key !== "sections") warn(`root.${key}`, "未知顶层字段，将被忽略");
    }

    data.sections.forEach((section, si) => {
        const sp = `sections[${si}]`;

        requireStr(section, "name", sp);

        if (!Array.isArray(section.items)) {
            error(`${sp}.items`, "缺少 items 数组");
            return;
        }
        if (section.items.length === 0) {
            error(`${sp}.items`, "每个板块至少需要 1 条内容");
            return;
        }

        section.items.forEach((item, ii) => {
            const ip = `${sp}.items[${ii}]`;
            const type = item.type || "news";

            if (!VALID_TYPES.has(type)) {
                error(`${ip}.type`, `未知类型 "${type}"，可用: ${[...VALID_TYPES].join(", ")}`);
                return;
            }

            typeCounters[type]++;

            // ── 按类型校验 ──
            switch (type) {
                case "news": {
                    const knownFields = new Set(["type", "title", "summary", "source", "time", "tag", "url"]);
                    requireStr(item, "title", ip);
                    requireStr(item, "summary", ip);
                    requireStr(item, "source", ip);
                    if (item.time !== undefined) checkTime(item.time, `${ip}.time`);
                    else error(`${ip}.time`, "必填字段缺失或为空");
                    if (item.url !== undefined && typeof item.url === "string" && !/^https?:\/\//.test(item.url)) {
                        warn(`${ip}.url`, `不是合法 URL: "${item.url}"`);
                    }
                    for (const k of Object.keys(item)) {
                        if (!knownFields.has(k)) warn(`${ip}.${k}`, "未知字段，将被忽略");
                    }
                    break;
                }

                case "alert": {
                    const knownFields = new Set(["type", "level", "title", "summary", "time"]);
                    requireStr(item, "title", ip);
                    if (item.level && !["breaking", "urgent", "info"].includes(item.level)) {
                        error(`${ip}.level`, `无效值 "${item.level}"，可用: breaking, urgent, info`);
                    }
                    if (item.time !== undefined) checkTime(item.time, `${ip}.time`);
                    for (const k of Object.keys(item)) {
                        if (!knownFields.has(k)) warn(`${ip}.${k}`, "未知字段，将被忽略");
                    }
                    break;
                }

                case "quote": {
                    const knownFields = new Set(["type", "quote", "author", "role", "source"]);
                    requireStr(item, "quote", ip);
                    requireStr(item, "author", ip);
                    for (const k of Object.keys(item)) {
                        if (!knownFields.has(k)) warn(`${ip}.${k}`, "未知字段，将被忽略");
                    }
                    break;
                }

                case "stats": {
                    const knownFields = new Set(["type", "title", "metrics"]);
                    requireStr(item, "title", ip);
                    if (!Array.isArray(item.metrics)) {
                        error(`${ip}.metrics`, "缺少 metrics 数组");
                    } else if (item.metrics.length === 0) {
                        error(`${ip}.metrics`, "至少需要 1 个指标");
                    } else {
                        item.metrics.forEach((m, mi) => {
                            const mp = `${ip}.metrics[${mi}]`;
                            requireStr(m, "label", mp);
                            if (m.value === undefined || m.value === "") {
                                error(`${mp}.value`, "必填字段缺失或为空");
                            } else if (typeof m.value === "number") {
                                warn(`${mp}.value`, `被解析为数字，建议加引号: "${m.value}"`);
                            }
                            const metricKnown = new Set(["label", "value", "change"]);
                            for (const k of Object.keys(m)) {
                                if (!metricKnown.has(k)) warn(`${mp}.${k}`, "未知字段");
                            }
                        });
                    }
                    for (const k of Object.keys(item)) {
                        if (!knownFields.has(k)) warn(`${ip}.${k}`, "未知字段，将被忽略");
                    }
                    break;
                }

                case "list": {
                    const knownFields = new Set(["type", "title", "points", "source"]);
                    requireStr(item, "title", ip);
                    if (!Array.isArray(item.points)) {
                        error(`${ip}.points`, "缺少 points 数组");
                    } else if (item.points.length === 0) {
                        error(`${ip}.points`, "至少需要 1 条要点");
                    } else {
                        item.points.forEach((p, pi) => {
                            if (typeof p !== "string" || p.trim() === "") {
                                error(`${ip}.points[${pi}]`, "要点必须是非空字符串");
                            }
                        });
                    }
                    for (const k of Object.keys(item)) {
                        if (!knownFields.has(k)) warn(`${ip}.${k}`, "未知字段，将被忽略");
                    }
                    break;
                }
            }
        });
    });
}

// ─── 3. 输出结果 ───
console.log();
console.log(dim(`校验文件: ${filePath}`));
console.log();

if (warnings.length > 0) {
    console.log(yellow(`⚠ ${warnings.length} 个警告:`));
    warnings.forEach((w) => console.log(w));
    console.log();
}

if (errors.length > 0) {
    console.log(red(`✗ ${errors.length} 个错误:`));
    errors.forEach((e) => console.log(e));
    console.log();
    console.log(red("校验未通过"));
    process.exit(1);
} else {
    const totalSections = data.sections.length;
    const totalItems = Object.values(typeCounters).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(typeCounters)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}:${v}`)
        .join(" ");

    console.log(green("✓ 校验通过"));
    console.log(dim(`  ${totalSections} 个板块，${totalItems} 条内容 (${breakdown})`));
    process.exit(0);
}
