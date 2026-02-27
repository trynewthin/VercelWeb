import { useEffect, useState } from "react";
import yaml from "js-yaml";
import type { DailyNews } from "@/types";
import { NewsHeader } from "@/components/NewsHeader";
import { NewsSection } from "@/components/NewsSection";
import { ThemeControlBar } from "@/components/ThemeControls";
import { useThemeStore } from "@/store/theme";

/* ── Sync store → DOM attributes ── */
function useSyncThemeToDom() {
    const mode = useThemeStore((s) => s.mode);
    const style = useThemeStore((s) => s.style);

    useEffect(() => {
        const root = document.documentElement;
        if (mode === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [mode]);

    useEffect(() => {
        document.documentElement.setAttribute("data-style", style);
    }, [style]);
}

export function App() {
    useSyncThemeToDom();

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
        <div className="app-container min-h-screen bg-background">
            <ThemeControlBar />

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