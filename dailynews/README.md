# Daily News 每日新闻速递

AI 驱动的每日新闻页面生成器。AI 只需编辑 `public/news.yaml` 即可生成一份精美的报纸风格新闻页。

## 技术栈

- **React 19** + **TypeScript** + **Vite 7**
- **TailwindCSS v4** + **shadcn/ui**
- **js-yaml** — 运行时 YAML 解析
- **Noto Serif SC** — 中文衬线字体，报纸质感

## 快速上手

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器
npm run validate     # 校验 news.yaml 合法性
npm run build        # 生产构建
npm run deploy       # 校验 → 构建 → 提交 → 推送 GitHub（一键部署）
```

## AI 工作流

1. 编辑 `public/news.yaml`（参考 [`SCHEMA.md`](./SCHEMA.md) 了解所有可用构件块）
2. 运行 `npm run deploy` — 自动校验、构建、提交并推送

## 可用构件块

| 类型 | `type` | 用途 | 渲染样式 |
|------|--------|------|---------|
| 新闻 | `news`（默认） | 常规新闻条目 | 头条大标题 / 网格卡片 |
| 快讯 | `alert` | 突发 / 紧急 / 资讯 | 红 / 橙 / 蓝色警示条 |
| 引语 | `quote` | 名人名言、重要发言 | 左侧竖线引用块 |
| 数据 | `stats` | 市场行情、关键指标 | 响应式指标卡片网格 |
| 列表 | `list` | 要点汇总 | 圆点列表 |

详细字段说明见 [`SCHEMA.md`](./SCHEMA.md)。

## 项目结构

```
dailynews/
├── public/
│   └── news.yaml           # ← AI 编辑此文件
├── src/
│   ├── App.tsx              # 主入口 + 主题切换
│   ├── types.ts             # TypeScript 类型定义
│   ├── index.css            # 主题色板 + 报纸样式
│   └── components/
│       ├── NewsHeader.tsx    # 报头 masthead
│       ├── NewsSection.tsx   # 板块布局（响应式分栏）
│       ├── NewsCard.tsx      # 新闻卡片
│       ├── AlertBlock.tsx    # 快讯警示条
│       ├── QuoteBlock.tsx    # 引语块
│       ├── StatsBlock.tsx    # 数据统计卡片
│       └── ListBlock.tsx     # 要点列表
├── SCHEMA.md                # AI 构件参考手册
├── validate.mjs             # YAML 校验脚本
├── deploy.sh                # 一键部署脚本
└── vercel.json              # Vercel 部署配置
```

## 设计特性

- 🗞️ **报纸风格** — 衬线字体、双线规则、首字下沉
- 🌗 **深浅色适配** — 右上角切换，自动跟随系统偏好
- 📱 **响应式布局** — 手机单栏 → 平板双栏 → 桌面三栏
- ⚡ **Vercel 部署** — 配置就绪，设置 Root Directory 为 `dailynews` 即可
