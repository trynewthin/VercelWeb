import { useCallback, useState, useEffect, useRef } from "react";
import { useThemeStore, STYLE_LIST, type VisualStyle } from "@/store/theme";

/* ─── Sun / Moon toggle (dark mode) ─── */
export function ThemeToggle() {
    const { mode, toggleMode } = useThemeStore();
    const dark = mode === "dark";

    const toggle = useCallback(() => {
        document.documentElement.classList.add("transitioning");
        toggleMode();
        setTimeout(
            () => document.documentElement.classList.remove("transitioning"),
            350
        );
    }, [toggleMode]);

    return (
        <button
            onClick={toggle}
            aria-label="切换明暗模式"
            className="flex h-9 w-9 items-center justify-center rounded-full
                 border border-border bg-card text-foreground shadow-sm
                 transition-all duration-200 hover:bg-muted hover:shadow-md"
        >
            {dark ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                >
                    <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Zm-8-5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2 10Zm13 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 15 10Zm-2.05-4.95a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm-7.07 7.07a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM5.05 5.05a.75.75 0 0 1 0 1.06L3.99 7.17a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm7.07 7.07a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" />
                    <path
                        fillRule="evenodd"
                        d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                        clipRule="evenodd"
                    />
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                >
                    <path
                        fillRule="evenodd"
                        d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z"
                        clipRule="evenodd"
                    />
                </svg>
            )}
        </button>
    );
}

/* ─── Style chooser pill ─── */
function StyleOption({
    meta,
    active,
    onClick,
}: {
    meta: (typeof STYLE_LIST)[number];
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`group relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left
                 transition-all duration-200
                 ${active
                    ? "bg-accent/15 ring-2 ring-accent"
                    : "hover:bg-muted/60"
                }`}
        >
            <span className="mt-0.5 text-lg leading-none">{meta.icon}</span>
            <div className="min-w-0 flex-1">
                <p
                    className={`text-sm font-semibold leading-tight ${active ? "text-accent" : "text-foreground"
                        }`}
                >
                    {meta.label}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-1">
                    {meta.description}
                </p>
            </div>
            {active && (
                <span className="mt-1 shrink-0 text-accent">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
            )}
        </button>
    );
}

/* ─── Combined control bar ─── */
export function ThemeControlBar() {
    const { style, setStyle } = useThemeStore();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const currentMeta = STYLE_LIST.find((s) => s.id === style)!;

    return (
        <div
            ref={panelRef}
            className="fixed right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6"
        >
            {/* Style picker toggle */}
            <button
                onClick={() => setOpen(!open)}
                aria-label="切换视觉风格"
                className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card
                     px-3 text-sm font-medium text-foreground shadow-sm
                     transition-all duration-200 hover:bg-muted hover:shadow-md"
            >
                <span>{currentMeta.icon}</span>
                <span className="hidden sm:inline">{currentMeta.label}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                >
                    <path
                        fillRule="evenodd"
                        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {/* Dark mode toggle */}
            <ThemeToggle />

            {/* Dropdown panel */}
            {open && (
                <div
                    className="absolute right-0 top-12 w-64 rounded-2xl border border-border bg-card
                         p-2 shadow-xl
                         animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <p className="mb-1.5 px-3 pt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        视觉风格
                    </p>
                    <div className="space-y-0.5">
                        {STYLE_LIST.map((meta) => (
                            <StyleOption
                                key={meta.id}
                                meta={meta}
                                active={style === meta.id}
                                onClick={() => {
                                    setStyle(meta.id as VisualStyle);
                                    setOpen(false);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
