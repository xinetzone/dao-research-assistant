# 道衍 — Session Review 2026-04-16-F

## 概览

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-16 |
| **Commits** | 3 个 (93d3d58 → cbb576e) |
| **Tags** | v1.5.0, v1.6.0 |

---

## v1.5.0 — DaodejingPage 架构清理

### 背景
DaodejingPage 中 `TOCPanel` 组件通过 prop 接收 `t` 函数（来自父组件的 `useTranslation()`），是典型的反模式。每次父组件重渲染，`t` prop 都会是新引用，引发不必要的子组件更新。

### 变更
- `TOCPanel` 改为内部调用 `const { t } = useTranslation()`
- 移除 prop 接口中的 `t` 字段
- 移除两处调用点的 `t={t}` prop

### 旧错误复盘
控制台中的老错误（`<p>` 嵌套 + TDZ）均为 April 15 旧 build（`BDjiuIjy.js`）产物：
- `<p>` 嵌套：已在 `AnnotatedText` 改用 `<div>` + TooltipContent 改用 `<span>` 时修复
- TDZ `Cannot access 'T' before initialization`：旧 build 的 Rollup 重排问题，当前无此错误

---

## v1.6.0 — localStorage 离线兼容

### 背景
v1.3.0 的修炼云同步中，已登录用户只写 DB，不写 localStorage。若 DB 写入失败（网络超时）且用户刷新页面，数据丢失。

### 根因
```ts
// v1.3.0: 只有未登录才写 localStorage
useEffect(() => {
  if (!userId) saveLocalState(state);
}, [state, userId]);
```

### 修复
```ts
// v1.6.0: 始终写，作为离线缓存
useEffect(() => {
  saveLocalState(state);   // Always — offline safety net
}, [state]);
```

### 数据流（v1.6.0）
```
打卡操作
  ├── 更新 React state (即时)
  ├── 写 localStorage (作为缓存, 即时)
  └── 写 DB (异步, 若失败不影响本地数据)

下次打开页面
  ├── 已登录 → 从 DB 加载（权威）
  └── 未登录 → 从 localStorage 加载（本地缓存）
```

### 影响
| 场景 | v1.3.0 | v1.6.0 |
|------|--------|--------|
| 未登录打卡 | localStorage ✓ | localStorage ✓ |
| 已登录打卡，DB 正常 | DB only | DB + localStorage ✓ |
| 已登录打卡，DB 失败 | 数据丢失 | localStorage 保留 ✓ |
| 重新登录后迁移 | 已迁移不触发 | localStorage 有最新兜底 ✓ |

---

## 核心经验

### 云同步数据安全原则
- **本地优先**：始终保持本地副本，DB 是同步目标而非唯一存储
- **乐观更新**：先更新本地 state + localStorage，再异步同步 DB
- **降级兜底**：DB 失败不影响用户当前操作

### React 翻译 hook 最佳实践
- 子组件直接 `const { t } = useTranslation()` — 避免通过 prop 透传
- `useTranslation()` 有内部缓存，多次调用无性能问题
