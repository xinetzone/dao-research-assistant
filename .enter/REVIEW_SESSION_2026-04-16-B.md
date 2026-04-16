# 道研 复盘报告 — 2026-04-16 下午/晚间场
> v0.8.3 文档上下文功能 + GitHub Tag 删除 + v0.8.4 超时修复

---

## 一、本轮新功能总览

| 版本 | commit | 内容 |
|------|--------|------|
| v0.8.3 | `8cf38e4` | 文档上下文注入（用户文档 → AI）：新增 `DAOYAN_SYSTEM_WITH_USER_DOCS`；边缘函数 `MAX_SYSTEM_LENGTH` 20k→200k |
| v0.8.3 | `e63aeb3` | GitHub Tag 删除：新增 `github-delete-tags` 函数；`github-tag` v2 支持 `action:"delete"` |
| v0.8.4 | `e596af0` | 超时 Bug 修复：文档请求 30s→60s 超时；新增 `receivedContentData` 防止空气泡残留 |
| v0.8.4+ | 本次 | 清理死代码：删除 `receivedAnyData`（只写不读） |

---

## 二、功能详细复盘

### 功能 A：用户文档上下文注入

**目标：** 用户在对话页面激活"文档集合"后，AI 回复应优先基于用户上传的文档内容。

**实现路径：**
```
用户选择集合
  → Index.tsx:handleSubmit() 调用 getCollectionContext(collectionId)
  → useDocumentCollections:getCollectionContext() 查 Supabase documents 表
  → 拼接为 Markdown 格式字符串 docContext
  → sendMessage(query, model, docContext)
  → useAIChat:sendMessage() 构建请求体
  → system: DAOYAN_SYSTEM_WITH_USER_DOCS(docContext)
  → Edge Function ai-chat-167c2bc1450e 接收 system，转发 Claude
```

**关键变更（v0.8.3）：**
- `src/data/system-prompt.ts` 新增 `DAOYAN_SYSTEM_WITH_USER_DOCS()`
  - 区别于原来的 `DAOYAN_SYSTEM_WITH_DOCS()`（后者用于"章节阅读"场景）
  - 新函数标签写为"用户上传的参考文档（最高优先级）"，语义更准确
- `useAIChat.ts` 引入改为 `DAOYAN_SYSTEM_WITH_USER_DOCS`
- Edge Function `MAX_SYSTEM_LENGTH` 20000 → 200000（旧值直接导致大文档被拒绝）

**注意点：**
- `DAOYAN_SYSTEM_WITH_DOCS` 与 `DAOYAN_SYSTEM_WITH_USER_DOCS` 并存：
  - 前者用于 DaodejingPage（阅读章节时注入注释/章节内容）
  - 后者用于 Index.tsx（对话页文档集合功能）
  - 两者语义不同，命名区分清晰 ✅

---

### 功能 B：GitHub Tag 删除

**目标：** 支持通过 Edge Function 删除 GitHub 仓库的错误 tag（曾误发 v1.0.0/v1.1.0）。

**实现方案（双冗余）：**

1. **`github-tag` v2（修改）** — 在原创建逻辑前加 `action:"delete"` 分支：
   ```typescript
   if (body.action === "delete") {
     const tagsToDelete = Array.isArray(body.tags) ? body.tags : [body.tag];
     // DELETE /repos/{owner}/{repo}/git/refs/tags/{name}
   }
   ```
   支持单个（`body.tag`）和批量（`body.tags` 数组）两种入参

2. **`github-delete-tags`（新增）** — 独立专用函数，功能与 v2 delete 分支等价

**为什么两个函数？**
- `github-tag` v2 用于后续正常 CI 流程中偶尔需要清理
- `github-delete-tags` 是当时临时调用用的，两者可共存，无冲突

**潜在改进点（低优先级）：**
- `github-delete-tags` 缺少 JSON parse 异常处理，若 body 格式错误会抛 500
- 两个函数有功能重叠，后续可考虑删除 `github-delete-tags`，统一用 `github-tag` v2

---

### 功能 C：超时 + 空气泡 Bug 修复（v0.8.4）

**触发条件：** 文档集合激活 → 查询"数学" → AI 气泡卡在"思考中..."

**根因（双因素）：**

| 因素 | 旧行为 | 影响 |
|------|--------|------|
| 超时过短 | `enableWebSearch ? 60s : 30s`，文档上下文走 30s | 帛书~30k + 用户文档 = system 巨大，30s 内模型只发 `message_start` 元数据，未输出内容就被中断 |
| 空气泡残留 | AbortError 后用 `receivedAnyData=true` 判断"有数据" | `message_start` 即让 `receivedAnyData=true`，但内容为空；代码只 `setIsStreaming:false` 不清除 bubble |

**修复方案：**

```typescript
// Fix 1: 文档上下文同样延长超时
const timeoutMs = (enableWebSearch || !!documentContext) ? 60000 : 30000;

// Fix 2: 新增 receivedContentData 精确追踪实际内容
let receivedContentData = false;
// 在 content_block_delta 有文本时才置 true

// Fix 3: AbortError 用 receivedContentData 决策
if (!receivedContentData) {
  // 无实际内容 → 清除空气泡 + 显示超时错误
  setError("请求超时，请稍后重试");
  setMessages(prev => prev.slice(0, -1));
} else {
  // 有部分内容 → 保留已收到的内容，isStreaming:false
  setMessages(prev => updateLastAssistant(prev, { isStreaming: false }));
}
```

**本次额外清理：**
- `receivedAnyData` 变量（只写不读的死代码）已彻底删除

---

## 三、测试清单

### 文档上下文功能

| 测试场景 | 预期行为 | 状态 |
|---------|---------|------|
| 无文档集合激活，正常提问 | 使用 `DAOYAN_SYSTEM_PROMPT`，30s 超时 | ✅ 逻辑不变 |
| 激活文档集合，提问与文档相关 | 使用 `DAOYAN_SYSTEM_WITH_USER_DOCS`，60s 超时，AI 优先引用文档 | 待人工测试 |
| 激活文档集合，文档内容很大（>20k字） | 不被 `MAX_SYSTEM_LENGTH=200000` 拦截，正常发出请求 | ✅ 已验证（v0.8.3 修复后 network 日志显示正常传输） |
| 超时场景（模型响应 >60s） | 超时后：空气泡消失，显示"请求超时，请稍后重试" | ✅ 逻辑修复完成 |
| 部分内容收到后超时 | 保留已收到内容，isStreaming:false | ✅ 逻辑修复完成 |

### GitHub Tag 功能

| 测试场景 | 预期行为 | 状态 |
|---------|---------|------|
| 调用 `github-tag` 创建 tag | 成功创建 annotated tag | ✅ 原逻辑不变 |
| 调用 `github-tag` v2 删除 tag（单个） | `{ v:2, results:[{tag:"v1.0.0", status:"deleted"}] }` | ✅ 已在实战中验证（删除了错误 tag） |
| 调用 `github-tag` v2 删除 tag（批量） | results 数组逐一返回状态 | 待验证 |
| 调用 `github-delete-tags` 删除 | 与 v2 delete 等价 | ✅ 实战已用 |

---

## 四、控制台错误分析

运行 `get_console_logs` 检查，发现的 error 均为**旧版本遗留问题**，与本轮新功能无关：

1. **`<p>` 内嵌套 `<p>/<div>` 水合错误**（2026-04-15 12:xx）
   - 来源：`DaodejingPage.tsx` 章节卡片中 Tooltip 嵌入 `<p>` 内
   - 状态：已存在，与本轮无关，优先级低（不影响主功能）

2. **`BookOpen is not defined`**（2026-04-16 02:23）
   - 来源：旧 build，v0.8.2 hotfix 后已修复

3. **`Cannot access 'T' before initialization`**（2026-04-15 12:25）
   - DaodejingPage 临时性 build 错误，已自愈

**本轮新功能无新增运行时错误** ✅

---

## 五、总结

本轮三个核心改动全部通过代码审查，逻辑正确，无新增 lint 错误：

- **文档上下文注入**：命名语义清晰（区分章节阅读 vs 用户文档），MAX_SYSTEM_LENGTH 限制已放宽，路径完整
- **GitHub Tag 删除**：两个函数逻辑一致，实战验证有效
- **超时/空气泡修复**：根因分析准确（双因素），`receivedContentData` 的精确度优于原 `receivedAnyData`，死代码已清除

**待跟进事项（低优先级）：**
1. DaodejingPage `<p>` 水合警告（Tooltip 嵌套结构问题）
2. `github-delete-tags` 可考虑后续废弃，统一 `github-tag` v2
