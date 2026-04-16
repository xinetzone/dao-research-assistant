# 认证系统实现方案

## Context

当前状态：
- 无任何用户认证，所有页面公开访问，AI 调用无门槛
- 修炼/悟道点数据存 localStorage（客户端可随意修改）
- document_collections 无 user_id，所有用户共享同一份数据
- 商业化目标：悟道点作为货币，服务端存储是必要前提

目标：
- 加邮件+密码认证（登录/注册 Modal）
- AI 对话需登录才能发送
- 修炼打卡/悟道点迁移至服务端 DB（防刷）
- 文档集合绑定用户

---

## 数据库迁移（一次执行）

```sql
-- 1. profiles 表（每个用户一条，由 trigger 自动创建）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  enlightenment_points INTEGER NOT NULL DEFAULT 0,
  check_in_streak INTEGER NOT NULL DEFAULT 0,
  total_check_ins INTEGER NOT NULL DEFAULT 0,
  last_check_in_date TEXT,
  tutorial_completed BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. cultivation_records 表
CREATE TABLE cultivation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  mood TEXT NOT NULL,
  wu_wei_score INTEGER NOT NULL,
  dao_field_active BOOLEAN NOT NULL DEFAULT false,
  insight TEXT NOT NULL DEFAULT '',
  points_earned INTEGER NOT NULL DEFAULT 0,
  ai_guidance TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE cultivation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "records_own" ON cultivation_records USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. document_collections 加 user_id
ALTER TABLE document_collections ADD COLUMN user_id UUID REFERENCES auth.users(id);
DROP POLICY IF EXISTS "Allow all on document_collections" ON document_collections;
CREATE POLICY "collections_own" ON document_collections
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. 新用户注册时自动建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 新增文件

### `src/contexts/AuthContext.tsx`
- `AuthProvider`：监听 `supabase.auth.onAuthStateChange`，提供 user/session/loading
- `useAuth()` hook：`{ user, session, loading, signIn, signUp, signOut }`
- 遵循 Supabase 最佳实践：先注册监听，再 getSession

### `src/components/AuthModal.tsx`
- shadcn `<Dialog>` 包裹
- 两个 Tab：登录 / 注册
- 字段：email + password（注册时加 confirm password）
- 错误展示 + loading 状态
- Props：`open`, `onOpenChange`, `defaultTab?: "login" | "signup"`

---

## 修改文件

### `src/App.tsx`
- 用 `<AuthProvider>` 包裹 `<RouterProvider>`

### `src/hooks/useAuth.ts`（新建，导出给需要 auth 的组件使用）
实际上 useAuth 从 AuthContext 导出，直接 import { useAuth } from "@/contexts/AuthContext"

### `src/components/NavigationSidebar.tsx`
- 底部 footer 新增用户区域：
  - 未登录：显示"登录/注册"按钮 → 打开 AuthModal
  - 已登录：显示邮箱首字母 avatar + email + 登出按钮

### `src/pages/Index.tsx`
- `handleSubmit` 检查 `user` 是否存在
- 未登录 → 保存 `pendingQuery` + 打开 AuthModal
- AuthModal 关闭后若 user 已存在且有 pendingQuery → 自动发送

### `src/pages/CultivationPage.tsx`
- 检查 auth，未登录时在页面顶部显示提示 Banner + 登录按钮
- 已登录时加载 profile 数据（DB），覆盖 localStorage

### `src/hooks/useCultivation.ts`
- 接收可选的 `userId?: string` 参数
- 若有 userId：
  - 初始化时从 `profiles` + `cultivation_records` 加载（迁移 localStorage 数据到 DB）
  - `checkIn()` 同时写 `cultivation_records` + 更新 `profiles`
  - localStorage 作为缓存（离线兜底）
- 若无 userId：保持原有 localStorage 逻辑不变

### `src/hooks/useDocumentCollections.ts`
- `createCollection()` 加上 `user_id: userId`
- `fetchCollections()` 依赖 RLS 自动过滤（无需修改查询本身）

---

## 认证开关策略

| 功能 | 未登录 | 已登录 |
|------|--------|--------|
| 帛书阅读 `/daodejing` | 公开 ✅ | 公开 ✅ |
| AI 对话（发送） | 弹 AuthModal | 正常 |
| 修炼打卡 | 顶部提示 Banner | 正常（DB存储）|
| 文档集合（CRUD） | 弹 AuthModal | 正常（用户隔离）|

---

## 验证步骤

1. 注册新账号 → profiles 表自动出现对应记录
2. 未登录发送 AI 消息 → 弹登录弹窗
3. 登录后输入框内容自动发送（不需重新输入）
4. 修炼打卡后刷新页面 → 悟道点不丢失
5. 不同账号各自看到各自的文档集合
6. 登出后文档集合列表为空
