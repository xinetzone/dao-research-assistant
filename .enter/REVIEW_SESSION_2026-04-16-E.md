# 道衍 — Session Review 2026-04-16-E

## 概览

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-16 |
| **Commits** | e49bbd7 (v1.3.0) · 769fbe8 (v1.4.0) |
| **主题** | 修炼云同步 + 用户主页 |

---

## v1.3.0 — 修炼数据云同步

### 架构
- `useCultivation(userId?)` — 双模式：无 userId 用 localStorage，有 userId 走 Supabase
- 首次登录迁移：DB 空 + 本地有数据 → 批量 INSERT + UPDATE profiles
- `checkIn()` / `completeTutorial()` 均 async，登录后写 DB
- `loadedForUser` ref 防 StrictMode 双触发

### CultivationPage 变更
- 未登录 banner → 「登录以同步云端」
- 登录同步中 → 细 spinner 横幅
- `handleTutorialNext` 改为 async

---

## v1.4.0 — 用户主页 `/profile`

### 五大区块

| 区块 | 实现要点 |
|------|---------|
| 头像卡片 | 邮件首字母 + 境界颜色渐变圆形 + 境界 Badge |
| 统计 3 格 | 复用 `cult-stat` CSS class，EP / 连续天 / 累计次数 |
| 境界进度条 | `progressPercent` 基于 (currentEP - realmMin) / (nextMin - realmMin) |
| 本月日历 | 7列周一起始，`recordsByDate` Map 驱动，心境颜色着色 |
| 历史时间线 | 最近10条，竖线连接，可展开道衍回响 |

### 技术亮点
- 日历 key：`"YYYY-M-D"` 格式，与 `new Date(r.date)` 解析对齐
- 颜色复用 cultivation 心境色系（transparent/tranquil/ripple/chaotic）
- 未登录时展示 localStorage 数据（不强制登录）

### 路由 & 导航
- `src/router.tsx` 新增 `/profile` 路由
- `NavigationSidebar` 用户区加 `User` 图标按钮 → `/profile`

---

## Bug 排查

**测试结论：无新增错误**
- 控制台所有错误均来自 2026-04-15~04-16 早期版本（DaodejingPage `<p>` 嵌套 + BookOpen 未定义）
- 均已在 v0.8.4 前修复，非本轮变更引入

---

## 版本序列

| Tag | 内容 |
|-----|------|
| v1.2.0 | 认证系统（注册/登录/退出 + DB + race condition fix）|
| v1.3.0 | 修炼数据云同步（DB read/write + 迁移 + banner）|
| v1.4.0 | 用户主页（日历 + 进度条 + 时间线）|
