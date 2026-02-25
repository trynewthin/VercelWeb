# Daily News — YAML 构件参考手册

本文件告知 AI 如何正确编写 `public/news.yaml`。

---

## 文件结构

```yaml
sections:
  - name: <板块名称>
    items:
      - <构件块>
      - <构件块>
```

共有 **5 种构件块**，通过 `type` 字段区分（默认为 `news`）。

---

## 构件块一览

### 1. `news` — 新闻条目（默认）

```yaml
- title: 新闻标题
  summary: 新闻摘要
  source: 信息来源
  time: "HH:MM"
  tag: 分类标签        # 可选
  url: https://...     # 可选
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ❌ | 不写或写 `news` |
| `title` | string | ✅ | 新闻标题 |
| `summary` | string | ✅ | 1-3 句摘要 |
| `source` | string | ✅ | 来源名称 |
| `time` | string | ✅ | `"HH:MM"`（**必须加引号**） |
| `tag` | string | ❌ | 分类标签 |
| `url` | string | ❌ | 原文链接 |

---

### 2. `alert` — 快讯/突发

```yaml
- type: alert
  level: breaking       # breaking | urgent | info
  title: 突发新闻标题
  summary: 详细描述     # 可选
  time: "HH:MM"         # 可选
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 固定 `alert` |
| `level` | string | ❌ | `breaking`(红) / `urgent`(橙) / `info`(蓝，默认) |
| `title` | string | ✅ | 快讯标题 |
| `summary` | string | ❌ | 补充描述 |
| `time` | string | ❌ | 发布时间 |

---

### 3. `quote` — 引语块

```yaml
- type: quote
  quote: 引语内容
  author: 发言人
  role: 职位/头衔       # 可选
  source: 来源媒体      # 可选
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 固定 `quote` |
| `quote` | string | ✅ | 引语正文 |
| `author` | string | ✅ | 发言人姓名 |
| `role` | string | ❌ | 职位头衔 |
| `source` | string | ❌ | 来源 |

---

### 4. `stats` — 数据统计

```yaml
- type: stats
  title: 今日市场数据
  metrics:
    - label: 上证指数
      value: "3,245.68"
      change: "+1.2%"    # 可选，正负号决定颜色
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 固定 `stats` |
| `title` | string | ✅ | 统计标题 |
| `metrics` | array | ✅ | 至少 1 个指标 |
| `metrics[].label` | string | ✅ | 指标名称 |
| `metrics[].value` | string | ✅ | 指标值（**加引号**） |
| `metrics[].change` | string | ❌ | 变化幅度，`+` 绿色 / `-` 红色 |

---

### 5. `list` — 要点列表

```yaml
- type: list
  title: 本周要点
  points:
    - 第一条要点
    - 第二条要点
  source: 综合报道       # 可选
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 固定 `list` |
| `title` | string | ✅ | 列表标题 |
| `points` | array | ✅ | 字符串数组，至少 1 条 |
| `source` | string | ❌ | 来源 |

---

## 常用板块名称

```
🔥 头条    💻 科技    🌍 国际    💰 财经
🏥 健康    🎮 游戏    🎬 娱乐    ⚽ 体育
📚 文化    🔬 科学    🏛️ 政策    🚀 创投
```

---

## 渲染规则

- **第一个板块的第一条 `news` 类型**会以头条样式渲染（大标题 + 首字下沉）
- `alert` / `quote` / `stats` / `list` 始终全宽显示
- 普通 `news` 以响应式网格排列（1/2/3 列）
- `tag` 以小标签显示，`url` 使卡片可点击

---

## ⚠️ 常见错误

1. **time / value 不加引号** → YAML 会解析为数字，必须写 `"08:30"` / `"3,245"`
2. **summary 含冒号** → 用引号包裹整个值
3. **缩进不一致** → 统一 **2 个空格**
4. **items 为空** → 每个 section 至少 1 条
5. **metrics 为空** → stats 类型至少 1 个指标
6. **points 为空** → list 类型至少 1 条要点
