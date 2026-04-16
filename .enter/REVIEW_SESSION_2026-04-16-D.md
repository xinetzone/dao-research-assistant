# 道衍 — Session Review 2026-04-16-D

## 概览

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-16 下午场 |
| **Commits** | e49bbd7 |
| **本次 Tag** | `v1.3.0` |
| **主题** | 修炼数据云同步 |

---

## 修炼数据云同步（e49bbd7）

### 架构设计

```
未登录用户               已登录用户
     │                       │
localStorage  ←────────  首次登录迁移
     │                       │
     ↓                  Supabase DB
  useCultivation(undefined)  useCultivation(userId)
```

### useCultivation.ts 变更详解

| 新增项 | 说明 |
|--------|------|
| `userId?: string` 参数 | 驱动 DB/本地双模式 |
| `isSyncing` state | 加载 DB 时的 UI 反馈 |
| `loadedForUser` ref | 防止重复加载（StrictMode 双触发防护）|
| `loadFromDB()` | 并发拉取 profiles + 最新 100 条 cultivation_records |
| `migrateLocalToDB()` | 首次登录时批量 INSERT + UPDATE profiles |
| `checkIn()` async | 本地 setState 后，写 cultivation_records + 更新 profiles |
| `completeTutorial()` async | 写 profiles.tutorial_completed + enlightenment_points |

**关键决策：localStorage 仅在未登录时写入**
- 登录后 localStorage 不再更新，避免冗余写入
- 已知风险：DB 写失败时刷新会丢失当次数据（极低概率，后续可加 localStorage 兜底）

### CultivationPage.tsx 变更

- `useAuth()` 获取 `user`，传入 `useCultivation(user?.id)`
- 未登录：顶部橙色 banner「未登录，数据仅保存在本设备 | 登录以同步云端」
- 已登录同步中：顶部蓝色细条「正在同步修炼数据...」
- `handleTutorialNext` 改为 async（支持 await completeTutorial）
- 两处 checkIn 调用均加 await

### 数据流验证

1. **全新用户注册** → profiles 触发器创建空 profile → 首次修行打卡 → checkIn() → INSERT cultivation_records + UPDATE profiles ✓
2. **老用户首次登录**（有 localStorage 数据）→ DB profile.total_check_ins=0 → 触发 migrateLocalToDB → 批量迁移 ✓
3. **已有 DB 数据的用户登录** → loadFromDB 拉取，不迁移 ✓
4. **换设备登录** → loadFromDB 拉取最新100条，跨端数据一致 ✓

---

## Bug 修复记录（本场之前）

| Bug | 根因 | 修复 |
|-----|------|------|
| 注册报 "Database error saving new user" | handle_new_user 触发器无 SECURITY DEFINER | 加 SECURITY DEFINER + ON CONFLICT DO NOTHING |
| 登录后 pending query 没有发送/二次弹窗 | onSuccess 同步回调时 React user state 未更新，handleSubmit 闭包见 user=null | 改用 useEffect([user, pendingQuery]) 监听 user 变化 |

---

## 版本历史（v1.2.0 → v1.3.0）

| 版本 | 内容 |
|------|------|
| v1.2.0 | 认证系统 (AuthContext + AuthModal + DB migrations + SECURITY DEFINER fix + race condition fix) |
| v1.3.0 | 修炼数据云同步 (DB load/save + localStorage migrate + login banner + sync indicator) |

---

## 下一步：用户主页 v1.4.0

`/profile` 页面：头像卡片 + 境界进度 + 统计 3 格 + 本月日历 + 历史时间线
