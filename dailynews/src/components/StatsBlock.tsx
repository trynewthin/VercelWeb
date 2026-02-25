import type { StatsItem } from "@/types";

export function StatsBlock({ item }: { item: StatsItem }) {
    return (
        <div>
            <h3 className="mb-3 font-serif text-base font-bold text-foreground">
                {item.title}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {item.metrics.map((m, i) => (
                    <div key={i} className="rounded-lg border border-border/60 bg-card p-3 text-center">
                        <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                        <p className="mt-1 font-mono text-lg font-bold tabular-nums text-foreground">
                            {m.value}
                        </p>
                        {m.change && (
                            <p className={`mt-0.5 text-xs font-medium tabular-nums ${m.change.startsWith("+")
                                    ? "text-green-600 dark:text-green-400"
                                    : m.change.startsWith("-")
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-muted-foreground"
                                }`}>
                                {m.change}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
