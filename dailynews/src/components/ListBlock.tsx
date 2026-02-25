import type { ListItem } from "@/types";

export function ListBlock({ item }: { item: ListItem }) {
    return (
        <div>
            <h3 className="mb-3 font-serif text-base font-bold text-foreground">
                {item.title}
            </h3>
            <ul className="space-y-2">
                {item.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span className="font-serif">{point}</span>
                    </li>
                ))}
            </ul>
            {item.source && (
                <p className="mt-3 font-sans text-xs text-muted-foreground/60">
                    来源：{item.source}
                </p>
            )}
        </div>
    );
}
