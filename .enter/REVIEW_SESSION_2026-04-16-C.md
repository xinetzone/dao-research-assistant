# 道衍 — Session Review 2026-04-16 (C 场)

## 概览

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-16 |
| **Commits** | 6 个核心（3c7c279 … 96e42f2） |
| **涉及文件** | 8 个（新建 2 + 修改 6） |
| **本次 Tag** | `v1.2.0` |
| **主题** | 认证系统：注册/登录/退出 + 两个启动 Bug 修复 |

---

## Bug 修复：handle_new_user 触发器 (22b147a)

### 现象
注册新用户时报 `Database error saving new user`。

### 根因
`handle_new_user` 触发器函数没有 `SECURITY DEFINER`，INSERT 进 `profiles` 表时被 RLS 策略阻断（auth trigger 运行在 `authenticated` 角色，但 profiles 的 INSERT 策略要求 `auth.uid() = id`，而此时会话 UID 尚未建立）。

### 修复
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```
`SECURITY DEFINER` 使函数以 owner (postgres) 权限执行，绕过 RLS。

---

## Bug 修复：pendingQuery Race Condition (96e42f2)

### 现象
注册成功后弹窗关闭，但之前输入的问题没有自动发送，或认证弹窗再次弹出。

### 根因
```ts
// 旧代码 — 有竞态
const handleAuthSuccess = useCallback(() => {
  setTimeout(() => handleSubmit(q), 100);
}, [pendingQuery, handleSubmit]);
// ↑ handleSubmit 在此闭包里 user=null（state 还未应用）
// 100ms 后 handleSubmit 运行仍见 user=null → 再次触发认证门槛
```

流程时序：
```
signUp 成功
  → onAuthStateChange 异步排队 setUser(newUser)   ← 未立即应用
  → onSuccess() 同步调用 → handleAuthSuccess
  → setTimeout(handleSubmit, 100)                 ← 捕获的是 user=null 闭包
100ms 后:
  handleSubmit 看到 user=null → 打开认证弹窗 → pendingQuery 再次触发
```

### 修复
用 `useEffect` 监听 `user` 变化，React 保证 effect 在状态应用后运行：
```ts
useEffect(() => {
  if (user && pendingQuery) {
    const q = pendingQuery;
    setPendingQuery(null);
    handleSubmit(q);   // 此时 user !== null，不触发认证门槛
  }
}, [user, pendingQuery, handleSubmit]);
```

---

## 认证系统架构 (3c7c279)

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/contexts/AuthContext.tsx` | `AuthProvider` + `useAuth()` hook，`onAuthStateChange` 监听 |
| `src/components/AuthModal.tsx` | 登录/注册弹窗，tab 切换，密码显隐，友好错误提示 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/App.tsx` | `<AuthProvider>` 包裹整个应用 |
| `src/components/NavigationSidebar.tsx` | 底部用户区：已登录→头像+邮箱+退出；未登录→登录/注册按钮 |
| `src/pages/Index.tsx` | Soft auth gate：未登录发送 → 保存 `pendingQuery` → 弹出认证框 → 登录后自动重发 |
| `src/hooks/useDocumentCollections.ts` | `createCollection` 自动写入 `user_id` |

### 数据库（migration_20260416_085511000）

```sql
profiles            -- 用户积分、打卡连续、完成次数
cultivation_records -- 每日修行记录（RLS 按 user_id）
document_collections.user_id -- 文档集合归属
handle_new_user()   -- SECURITY DEFINER 触发器，注册时自动建 profile
```

### 认证流程图
```
用户输入问题
    ↓
user === null?
   是 → setPendingQuery(q) → setAuthOpen(true) → 弹窗
   否 → sendMessage(...)
            ↓ (弹窗内完成注册/登录)
onAuthStateChange → setUser(newUser)  [React state 已更新]
            ↓
useEffect([user, pendingQuery, handleSubmit])
            ↓
user && pendingQuery → handleSubmit(q)  ← user 已是非 null
```

---

## 经验总结

### 1. Supabase Auth 触发器必须加 SECURITY DEFINER
任何对有 RLS 表的写操作触发器，必须设 `SECURITY DEFINER`，否则 INSERT 会被 RLS 拦截。

### 2. onSuccess 回调 vs useEffect 的时序差异
- `onSuccess()` 是同步调用，此时 React 的 `setUser` 更新**尚未应用**
- `useEffect([user])` 在 React **commit 阶段之后**运行，此时 state 一定已更新
- 凡是"登录成功后执行某操作"的模式，应优先用 `useEffect` 而非 `onSuccess` 回调

### 3. RLS 设计原则（本项目）
```
profiles:
  SELECT — auth.uid() = id
  INSERT — auth.uid() = id  ← 触发器用 SECURITY DEFINER 绕过
  UPDATE — auth.uid() = id

cultivation_records:
  ALL — auth.uid() = user_id

document_collections:
  SELECT — 无限制（公开浏览）或 auth.uid() = user_id（私有）
  INSERT — 认证用户（user_id 由代码写入）
  DELETE — auth.uid() = user_id
```

---

## Commits 清单

| Commit | 类型 | 内容 |
|--------|------|------|
| `3c7c279` | feat | 认证系统核心（AuthContext / AuthModal / App / Sidebar / Index / useDocumentCollections） |
| `22b147a` | fix | handle_new_user 触发器加 SECURITY DEFINER |
| `96e42f2` | fix | pendingQuery race condition — useEffect 替换 onSuccess 回调 |
| `16945b3` | docs | 计划文件更新 |
| `410fcaf` | refactor | retire github-token-tmp |
| `c75127b` | docs | 计划文件 |
