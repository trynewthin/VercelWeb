import type { AlertItem } from "@/types";

const levelStyles = {
    breaking: {
        bg: "bg-red-500/10 dark:bg-red-500/15",
        border: "border-red-500/50",
        badge: "bg-red-500 text-white",
        label: "突发",
    },
    urgent: {
        bg: "bg-amber-500/10 dark:bg-amber-500/15",
        border: "border-amber-500/50",
        badge: "bg-amber-500 text-white",
        label: "紧急",
    },
    info: {
        bg: "bg-blue-500/10 dark:bg-blue-500/15",
        border: "border-blue-500/50",
        badge: "bg-blue-500 text-white",
        label: "快讯",
    },
} as const;

export function AlertBlock({ item }: { item: AlertItem }) {
    const level = item.level || "info";
    const style = levelStyles[level];

    return (
        <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}>
                    {style.label}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-base font-bold leading-snug text-foreground sm:text-lg">
                        {item.title}
                    </h3>
                    {item.summary && (
                        <p className="mt-1.5 font-serif text-sm leading-relaxed text-muted-foreground">
                            {item.summary}
                        </p>
                    )}
                    {item.time && (
                        <span className="mt-2 inline-block font-sans text-xs tabular-nums text-muted-foreground/70">
                            {item.time}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
