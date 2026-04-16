# 道衍 — 继续开发计划

## 任务一：复盘 + git commit + tag v1.3.0（修炼云同步）

### 复盘内容（e49bbd7，修炼数据云同步）

**新增/修改：**
- `src/hooks/useCultivation.ts` — 完整 DB 同步
  - `userId?: string` 参数
  - `loadedForUser` ref 防重复加载
  - `loadFromDB()` — 加载 profiles + cultivation_records（最新100条）
  - `migrateLocalToDB()` — 首次登录时将 localStorage 数据批量迁移到 DB
  - `checkIn()` → async，成功后同步写 cultivation_records + 更新 profiles
  - `completeTutorial()` → async，同步写 profiles.tutorial_completed
  - localStorage 仅在未登录时写入（避免冗余）
- `src/pages/CultivationPage.tsx`
  - 引入 `useAuth`, `AuthModal`
  - 未登录时顶部显示「数据仅本地」banner + 登录按钮
  - 已登录同步中时显示 Cloud spinner
  - `handleTutorialNext` 改 async，加 await

**已知限制（下个版本改进）：**
- 登录状态下 localStorage 不写入 → DB 写失败后刷新会丢失当次数据（小概率，可后续加 localStorage 兜底）

**验证清单：**
- [ ] 未登录：打卡正常保存到 localStorage，banner 显示
- [ ] 登录后：同步指示器出现，历史记录从 DB 加载
- [ ] 首次登录：旧 localStorage 数据自动迁移到 DB
- [ ] 换设备登录：打卡数据跨端同步

---

## 任务二：用户主页（v1.4.0）

### 背景
用户已有 auth + 修炼 DB 同步，但缺少一个集中展示个人成长轨迹的页面。

### 目标
新增 `/profile` 路由，展示：
1. 用户头像卡片（大号首字母 + 邮件）
2. 境界进度（当前境界名 + EP + 进度条）
3. 统计 3 格（总 EP、连续天数、累计打卡）
4. 本月打卡日历（按心境上色）
5. 最近 10 次打卡时间线

### 关键文件

| 文件 | 变更 |
|------|------|
| `src/pages/ProfilePage.tsx` | 新建，完整个人主页 |
| `src/router.tsx` | 添加 `/profile` 路由 |
| `src/components/NavigationSidebar.tsx` | 已登录时在用户区域添加「我的主页」链接 |

### ProfilePage 结构

```
ProfilePage
├── SEO (title="我的修行主页")
├── 返回按钮 (← 返回首页)
├── LoginBanner (未登录时提示)
│
├── [Header Card]
│   ├── 大头像圆 (首字母, 渐变背景)
│   ├── 邮箱 / "游客" 
│   └── 当前境界 Badge (color=realm.color)
│
├── [Stats Row] (3格)
│   ├── 总悟道点 EP
│   ├── 连续打卡天数 🔥
│   └── 累计打卡次数
│
├── [Realm Progress Card]
│   ├── 当前境界名 → 下一境界名
│   ├── Progress Bar
│   └── "还需 X 点升到下一境界"
│
├── [Monthly Calendar Card]
│   ├── 标题："本月打卡" + YYYY年M月
│   ├── 7列星期标题 (一 二 三 四 五 六 日)
│   └── 日期格子：有记录 → 彩色圆点；无 → 灰色小点
│
└── [History Timeline]
    ├── 标题："最近修行记录"
    └── 最近10条记录，每条：
        ├── 日期 + 心境 Badge
        ├── 无为指数 ⚡ + 道场 ✦ + 悟道点 +N
        ├── 心言 (截断 40字)
        └── 道衍回响 (collapsible details)
```

### 日历实现
```ts
// 获取当月所有天
const daysInMonth = new Date(year, month + 1, 0).getDate();
// 第一天是星期几（0=日 → 按 locale 调整偏移）
const firstDay = new Date(year, month, 1).getDay();
// 心境颜色映射
const moodColor = { transparent: "#10b981", tranquil: "#3b82f6", ripple: "#f59e0b", chaotic: "#ef4444" }
// 将 records 转为 Map<date-string, CheckInRecord>
```

### NavigationSidebar 变更
在已登录用户区域，用户名右侧加「主页」图标按钮（User 图标，navigates to `/profile`）

### 验证
1. 未登录：显示 banner，展示本地数据（可能为空）
2. 已登录：展示 DB 数据，头像显示邮件首字母
3. 本月有打卡记录：日历格子上有彩色点
4. 展开道衍回响：显示 AI 引导内容
5. 手机端：响应式，单列布局
