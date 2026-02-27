import type { NewsSection as NewsSectionType, SectionItem, NewsItem } from "@/types";
import { NewsCard } from "./NewsCard";
import { QuoteBlock } from "./QuoteBlock";
import { AlertBlock } from "./AlertBlock";
import { StatsBlock } from "./StatsBlock";
import { ListBlock } from "./ListBlock";

function isNewsItem(item: SectionItem): item is NewsItem {
    return !item.type || item.type === "news";
}

function BlockRenderer({ item, isHeadline }: { item: SectionItem; isHeadline?: boolean }) {
    switch (item.type) {
        case "quote":
            return <QuoteBlock item={item} />;
        case "alert":
            return <AlertBlock item={item} />;
        case "stats":
            return <StatsBlock item={item} />;
        case "list":
            return <ListBlock item={item} />;
        default:
            return <NewsCard item={item as NewsItem} variant={isHeadline ? "headline" : "default"} />;
    }
}

export function NewsSection({ section, isFirst }: { section: NewsSectionType; isFirst?: boolean }) {
    // First news-type item of the first section gets headline treatment
    const firstNewsIdx = isFirst ? section.items.findIndex(isNewsItem) : -1;

    return (
        <section className="mb-8">
            {/* Section header */}
            <div className="mb-4 flex items-baseline gap-3">
                <h2 className="font-serif text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {section.name}
                </h2>
                <div className="h-px flex-1 bg-border" />
            </div>

            {/* Render items */}
            <div className="space-y-5">
                {/* Full-width blocks (alerts, quotes, stats, lists, and headline) */}
                {section.items.map((item, i) => {
                    const isHeadline = i === firstNewsIdx;
                    const isFullWidth = !isNewsItem(item) || isHeadline;

                    if (isFullWidth) {
                        return (
                            <div key={i} className={isHeadline ? "border-b border-border pb-5" : ""}>
                                <BlockRenderer item={item} isHeadline={isHeadline} />
                            </div>
                        );
                    }
                    return null;
                })}

                {/* Grid for remaining news items */}
                {(() => {
                    const gridItems = section.items
                        .map((item, i) => ({ item, i }))
                        .filter(({ item, i }) => isNewsItem(item) && i !== firstNewsIdx);

                    if (gridItems.length === 0) return null;

                    return (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {gridItems.map(({ item, i }) => (
                                <div key={i}>
                                    <BlockRenderer item={item} />
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Section end rule */}
            <hr className="newspaper-rule-thin mt-6" />
        </section>
    );
}
