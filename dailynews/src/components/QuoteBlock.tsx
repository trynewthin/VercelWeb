import type { QuoteItem } from "@/types";

export function QuoteBlock({ item }: { item: QuoteItem }) {
    return (
        <blockquote className="relative border-l-4 border-accent py-2 pl-5 pr-2">
            <p className="font-serif text-lg italic leading-relaxed text-foreground">
                "{item.quote}"
            </p>
            <footer className="mt-3 flex items-center gap-2 font-sans text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">— {item.author}</span>
                {item.role && <span className="text-muted-foreground/70">{item.role}</span>}
                {item.source && (
                    <>
                        <span>·</span>
                        <span>{item.source}</span>
                    </>
                )}
            </footer>
        </blockquote>
    );
}
