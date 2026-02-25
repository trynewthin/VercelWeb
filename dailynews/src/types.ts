// ── 基础新闻条目（默认） ──
export interface NewsItem {
    type?: "news";
    title: string;
    summary: string;
    source: string;
    time: string;
    tag?: string;
    url?: string;
}

// ── 引语块 ──
export interface QuoteItem {
    type: "quote";
    quote: string;
    author: string;
    role?: string;
    source?: string;
}

// ── 快讯/突发 ──
export interface AlertItem {
    type: "alert";
    level?: "breaking" | "urgent" | "info";
    title: string;
    summary?: string;
    time?: string;
}

// ── 数据统计卡片 ──
export interface StatsItem {
    type: "stats";
    title: string;
    metrics: Metric[];
}

export interface Metric {
    label: string;
    value: string;
    change?: string;
}

// ── 要点列表 ──
export interface ListItem {
    type: "list";
    title: string;
    points: string[];
    source?: string;
}

// ── 联合类型 ──
export type SectionItem = NewsItem | QuoteItem | AlertItem | StatsItem | ListItem;

export interface NewsSection {
    name: string;
    items: SectionItem[];
}

export interface DailyNews {
    sections: NewsSection[];
}
