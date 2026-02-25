import { useEffect, useState, useCallback } from "react";
import yaml from "js-yaml";
import type { DailyNews } from "@/types";
import { NewsHeader } from "@/components/NewsHeader";
import { NewsSection } from "@/components/NewsSection";

function ThemeToggle() {
    const [dark, setDark] = useState(() =>
        document.documentElement.classList.contains("dark")
    );

    const toggle = useCallback(() => {
        document.documentElement.classList.add("transitioning");
        const next = !dark;
        setDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
        setTimeout(() => document.documentElement.classList.remove("transitioning"), 350);
    }, [dark]);

    return (
        <button
            onClick={toggle}
            aria-label="切换主题"
            className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full
                 border border-border bg-card text-foreground shadow-sm
                 transition-all duration-200 hover:bg-muted hover:shadow-md
                 sm:right-6 sm:top-6"
        >
            {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Zm-8-5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2 10Zm13 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 15 10Zm-2.05-4.95a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm-7.07 7.07a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM5.05 5.05a.75.75 0 0 1 0 1.06L3.99 7.17a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm7.07 7.07a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" />
                    <path fillRule="evenodd" d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
                </svg>
            )}
        </button>
    );
}

export function App() {
    const [news, setNews] = useState<DailyNews | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/news.yaml")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then((text) => setNews(yaml.load(text) as DailyNews))
            .catch((err) => setError(err.message));
    }, []);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background font-serif text-destructive">
                <p>加载失败：{error}</p>
            </div>
        );
    }

    if (!news) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    <p className="font-serif text-sm text-muted-foreground">载入中…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <ThemeToggle />

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <NewsHeader data={news} />

                {news.sections.map((section, i) => (
                    <NewsSection key={i} section={section} isFirst={i === 0} />
                ))}

                {/* Footer */}
                <footer className="mt-8 text-center">
                    <hr className="newspaper-rule mb-4" />
                    <p className="font-serif text-xs italic text-muted-foreground">
                        — AI 编辑部 · {new Date().toLocaleDateString("zh-CN")} —
                    </p>
                </footer>
            </main>
        </div>
    );
}

export default App;