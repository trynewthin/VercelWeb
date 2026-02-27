import type { NewsItem } from "@/types";

export function NewsCard({
    item,
    variant = "default",
}: {
    item: NewsItem;
    variant?: "headline" | "default";
}) {
    const isHeadline = variant === "headline";

    const content = (
        <article
            className={`group ${isHeadline
                    ? "headline-card"
                    : "news-item-card style-card border border-border bg-card p-4"
                }`}
        >
            {/* Title */}
            <h3
                className={`news-card-title font-serif font-bold leading-snug text-foreground transition-colors duration-200
                     group-hover:text-accent
                     ${isHeadline ? "text-xl sm:text-2xl md:text-3xl mb-3" : "text-base sm:text-lg mb-2"}`}
            >
                {item.title}
                {item.url && (
                    <span className="ml-1 inline-block text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        ↗
                    </span>
                )}
            </h3>

            {/* Summary */}
            <p
                className={`font-serif leading-relaxed text-muted-foreground
                     ${isHeadline ? "text-base drop-cap" : "text-sm line-clamp-3"}`}
            >
                {item.summary}
            </p>

            {/* Meta row */}
            <div className="mt-3 flex items-center gap-2 font-sans text-xs text-muted-foreground/70">
                {item.tag && (
                    <span className="rounded border border-border px-1.5 py-0.5 font-medium uppercase tracking-wider text-accent">
                        {item.tag}
                    </span>
                )}
                <span>{item.source}</span>
                <span className="ml-auto tabular-nums">{item.time}</span>
            </div>
        </article>
    );

    if (item.url) {
        return (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block no-underline">
                {content}
            </a>
        );
    }

    return content;
}
