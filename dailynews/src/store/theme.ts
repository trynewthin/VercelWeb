import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── 视觉风格定义 ──
export type VisualStyle =
    | "newspaper"   // 经典报纸（默认）
    | "magazine"    // 现代杂志
    | "terminal"    // 终端 / 黑客
    | "elegant"     // 优雅衬线
    | "brutalist";  // 粗野主义

export type ThemeMode = "light" | "dark";

export interface StyleMeta {
    id: VisualStyle;
    label: string;
    description: string;
    icon: string;  // emoji
}

export const STYLE_LIST: StyleMeta[] = [
    { id: "newspaper", label: "经典报纸", description: "复古印刷风格，双线分隔，衬线字体", icon: "📰" },
    { id: "magazine", label: "现代杂志", description: "彩色卡片，圆角设计，几何元素", icon: "📖" },
    { id: "terminal", label: "终端风格", description: "黑绿配色，等宽字体，扫描线效果", icon: "💻" },
    { id: "elegant", label: "优雅经典", description: "大面积留白，金色点缀，精致排版", icon: "✨" },
    { id: "brutalist", label: "粗野主义", description: "粗边框，高对比，大胆排版", icon: "🔲" },
];

// ── Store ──
interface ThemeState {
    mode: ThemeMode;
    style: VisualStyle;
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
    setStyle: (style: VisualStyle) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: "light",
            style: "newspaper",
            setMode: (mode) => set({ mode }),
            toggleMode: () =>
                set((s) => ({ mode: s.mode === "light" ? "dark" : "light" })),
            setStyle: (style) => set({ style }),
        }),
        {
            name: "dailynews-theme",
        }
    )
);
