import type { DailyNews } from "@/types";

export function NewsHeader({ data }: { data: DailyNews }) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
    });

    const totalItems = data.sections.reduce((sum, s) => sum + s.items.length, 0);

    return (
        <header className="mb-8 select-none">
            {/* Top thin rule */}
            <hr className="newspaper-rule mb-4" />

            {/* Date & stats row */}
            <div className="mb-3 flex items-center justify-between text-xs tracking-wider text-muted-foreground uppercase">
                <span className="font-sans font-medium">{formattedDate}</span>
                <span className="font-sans">{data.sections.length} 板块 · {totalItems} 条</span>
            </div>

            {/* Masthead */}
            <h1 className="text-center font-serif text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl">
                每日新闻速递
            </h1>

            {/* Subtitle */}
            <p className="mt-2 text-center font-serif text-base italic text-muted-foreground sm:text-lg">
                AI 精选 · 今日要闻
            </p>

            {/* Bottom double rule */}
            <hr className="newspaper-rule mt-4" />
        </header>
    );
}
