# Session Review 2026-04-16-G — v1.7.0 展示首页优化

## 任务目标
展示首页优化 — 未登录用户看到更魄力的展示页

## 实现内容

### v1.7.0 — 展示首页视觉增强 (Index.tsx + SearchBar.tsx)

**变更文件：**
- `src/pages/Index.tsx` (+100 行)
- `src/components/SearchBar.tsx` (+1 行)

**核心逻辑：** 在 `!hasStartedChat` 区块内，按登录状态分流展示：

```tsx
{user ? (
  /* 已登录：紧凑 Hero (保持不变) */
  <div className="dao-card dao-tape ... text-center">
    <BookOpen /> <h1>道衍</h1> <p>subtitle</p>
    {/* status badges for collection/webSearch */}
  </div>
) : (
  /* 未登录：Showcase Landing */
  <div className="space-y-5">
    {/* Hero Card */}
    <div className="dao-card dao-tape ...">
      {/* 渐变大标题 */}
      <h1 style={{ background: "linear-gradient(135deg, foreground→primary)",
                   WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        道衍
      </h1>
      {/* Stats 栏 */}
      <div className="flex gap-4 ...">
        <span>81 帛书原章</span> | <span>10 修炼境界</span> | <span>ψ=ψ(ψ) 万物理论</span>
      </div>
      {/* 双 CTA */}
      <Button onClick={() => setAuthOpen(true)}>立即开始修行</Button>
      <Button variant="outline" onClick={() => document.getElementById("dao-search-input")?.focus()}>
        先探索一下
      </Button>
    </div>
    {/* 4个特性卡 (2×2 Grid) */}
    <div className="grid grid-cols-2 gap-3">
      帛书老子 · 修炼打卡 · 联网搜索 · 文档知识库
    </div>
  </div>
)}
```

**SearchBar.tsx 修改：**
```tsx
<textarea
  id="dao-search-input"  // 新增
  ref={textareaRef}
  ...
/>
```
支持"先探索一下"按钮 `document.getElementById("dao-search-input")?.focus()` 定位。

## 构建验证
- `npm run lint` → 0 errors, 1 pre-existing warning (AuthContext)
- `npm run build` → ✓ built in 4.49s，2052 modules transformed，无错误

## Commit & Tag
```
92824c5  feat(landing): 未登录展示页视觉增强 — 大图Hero+特性卡+Stats+CTA v1.7.0
tag: v1.7.0
```

## GitHub Push 状态
仍受 workspace DNS 限制（无法解析 Supabase 项目域名）。
v1.2.0 ~ v1.7.0 所有提交安全在 workspace origin/main，等待手动推送。
