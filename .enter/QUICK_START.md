# 🚀 快速发布指南

## 前提条件

在开始之前，请确保：
- ✅ 已在 GitHub 创建 `xinetzone/dao-research-assistant` 仓库
- ✅ 仓库设置为 Public
- ✅ **不要勾选** "Initialize with README"（我们已经有了）
- ✅ 有该仓库的推送权限

## 方法一：使用自动化脚本（推荐）

在项目根目录执行：

```bash
bash publish-to-github.sh
```

脚本会自动：
1. 检查 Git 状态
2. 配置远程仓库
3. 推送主分支
4. 推送版本标签
5. 显示后续步骤

## 方法二：手动执行命令

### Step 1: 配置远程仓库

```bash
# 移除旧的 origin（如果存在）
git remote remove origin 2>/dev/null || true

# 添加 GitHub 仓库
git remote add origin https://github.com/xinetzone/dao-research-assistant.git

# 验证配置
git remote -v
```

### Step 2: 推送代码

```bash
# 推送主分支
git push -u origin main

# 推送标签
git push origin --tags
```

### Step 3: 验证

访问 https://github.com/xinetzone/dao-research-assistant 确认：
- ✅ 代码已上传
- ✅ README.md 正确显示
- ✅ LICENSE 文件存在
- ✅ v1.0.0 标签可见

## 发布后配置

### 1. 仓库设置

在 GitHub 仓库页面：

**About 部分** (右上角 ⚙️)：
- Description: `AI-powered research assistant fusing Daoist philosophy with modern technology 融合道家智慧与 AI 技术的研究助手`
- Topics: `ai`, `research`, `dao`, `cultivation`, `react`, `typescript`, `supabase`, `claude`, `i18n`

**Settings → General**:
- ✅ Enable Issues
- ✅ Enable Discussions
- ✅ Enable Projects (可选)
- ✅ Enable Wiki (可选)

### 2. 创建首个 Release

1. 点击右侧 "Releases" → "Create a new release"
2. 选择标签：v1.0.0
3. Release title: `v1.0.0 - Initial Release`
4. 描述内容：

```markdown
## 🎉 道研助手 v1.0.0

首个正式版本发布！这是一个融合道家智慧与现代 AI 技术的研究型对话助手。

### ✨ 核心特性

- 🤖 **AI 驱动研究** - Claude Sonnet 4.5 提供智能对话
- 🌐 **智能联网搜索** - 集成网络搜索，实时获取信息
- 📚 **文档集合系统** - 上传文档作为对话上下文
- 🧘 **修炼打卡系统** - 独特的个人成长游戏化设计
- 🌍 **国际化支持** - 完整的中英文双语
- 🎨 **现代化设计** - 响应式布局，完美适配所有设备

### 📦 技术栈

- React 19 + TypeScript 5.9
- Vite 7 + Tailwind CSS 3.4
- Supabase (Backend + Edge Functions)
- Claude Sonnet 4.5 (AI)
- shadcn/ui (UI Components)

### 📖 快速开始

```bash
git clone https://github.com/xinetzone/dao-research-assistant.git
cd dao-research-assistant
pnpm install
pnpm dev
```

详见 [README.md](https://github.com/xinetzone/dao-research-assistant#readme)

### 🙏 致谢

感谢所有开源项目和技术的支持！

---

**愿道研助手帮助每一位使用者，在信息洪流中找到属于自己的那份宁静与智慧 🌟**
```

5. 点击 "Publish release"

### 3. 保护主分支（可选，推荐）

Settings → Branches → Add branch protection rule:
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging

## 常见问题

### Q: 推送失败，提示 "authentication failed"

**A:** 可能需要配置 GitHub 认证：

使用 Personal Access Token:
```bash
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/xinetzone/dao-research-assistant.git
```

或使用 SSH:
```bash
git remote set-url origin git@github.com:xinetzone/dao-research-assistant.git
```

### Q: 推送失败，提示 "repository not found"

**A:** 请确认：
1. GitHub 仓库已创建
2. 仓库名称正确（dao-research-assistant）
3. 有该仓库的访问权限

### Q: 如何更新代码？

**A:** 日常开发推送：
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### Q: 如何发布新版本？

**A:** 创建新标签并推送：
```bash
git tag -a v1.1.0 -m "Release v1.1.0: Description"
git push origin v1.1.0
```

然后在 GitHub 创建新的 Release。

## 验证清单

发布完成后，请验证：

- [ ] 访问 https://github.com/xinetzone/dao-research-assistant
- [ ] README.md 完整显示
- [ ] LICENSE 文件存在
- [ ] 所有代码文件已上传
- [ ] v1.0.0 标签可见
- [ ] About 描述正确
- [ ] Topics 标签已添加
- [ ] Issues 和 Discussions 已启用
- [ ] 首个 Release 已创建

## 后续步骤

1. **分享项目** - 在社交媒体和技术社区分享
2. **收集反馈** - 通过 Issues 收集用户反馈
3. **持续改进** - 根据反馈优化功能
4. **文档完善** - 添加更多使用示例和教程
5. **社区建设** - 回复 Issues，Review PRs

---

**祝发布顺利！🚀**
