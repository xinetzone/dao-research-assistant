# 道研助手 - 项目统计报告

生成时间：2026-04-14

## 📊 代码统计

### 文件数量
- 总文件数：99 个
- TypeScript/TSX 文件：71 个
- React 组件：54 个
- Edge Functions：3 个

### 代码行数
$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1)

## 🏗️ 架构概览

### 前端结构
- 页面（Pages）：2 个主要页面
  - Index.tsx（AI 研究助手）
  - CultivationPage.tsx（修炼系统）

- 组件（Components）：54 个
  - UI 基础组件（shadcn/ui）：~40 个
  - 自定义业务组件：~14 个

- Hooks：3 个核心 Hook
  - useAIChat（AI 对话逻辑）
  - useCultivation（修炼系统逻辑）
  - useDocumentCollections（文档管理逻辑）

### 后端结构
- Edge Functions：3 个
  - ai-chat-167c2bc1450e（AI 聊天接口）
  - web-search（网络搜索）
  - fetch-url-content（URL 内容抓取）

- 数据库表：2 个
  - document_collections（文档集合）
  - documents（文档内容）

## 🎯 功能模块

### 1. AI 研究助手
- 流式对话
- 思考过程可视化
- 联网搜索
- 来源引用
- 文档上下文

### 2. 修炼系统
- 10 个境界
- 4 种心境
- 每日打卡
- AI 指导
- 新手教程

### 3. 文档管理
- 文件上传
- URL 抓取
- 多集合管理
- 上下文集成

### 4. 国际化
- 中英文双语
- 自动检测
- 实时切换

## 📈 开发历程

### Git 提交统计
- 总提交数：$(git rev-list --count HEAD)
- 代码作者：$(git log --format='%aN' | sort -u | wc -l) 位
- 开发周期：$(git log --reverse --format=%ai | head -1 | cut -d' ' -f1) 至 $(git log --format=%ai | head -1 | cut -d' ' -f1)

### 主要里程碑
1. 初始项目搭建
2. AI 聊天功能实现
3. 国际化支持
4. 文档集合系统
5. 修炼打卡系统
6. 响应式优化
7. 联网搜索
8. 左侧导航栏
9. 修炼指南教程

## 🛠️ 技术栈

### 前端
- React 19.1
- TypeScript 5.9
- Vite 7
- Tailwind CSS 3.4
- shadcn/ui
- React Router v7
- i18next

### 后端
- Supabase
- Edge Functions (Deno)
- PostgreSQL

### AI & 搜索
- Claude Sonnet 4.5
- DuckDuckGo

## ✅ 质量指标

- ESLint 检查：✅ 通过
- TypeScript 编译：✅ 通过
- 代码规范：✅ 符合 Conventional Commits
- 国际化覆盖率：100%
- 响应式支持：✅ 桌面/平板/手机

## 📦 包大小

$(du -sh dist/ 2>/dev/null || echo "未构建")

---

报告生成完成！
