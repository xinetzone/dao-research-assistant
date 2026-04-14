# 如何推送代码到 GitHub

由于 GitHub 需要身份认证，需要你在**本地终端**完成推送。以下是三种方法：

---

## 🎯 方法一：使用推送脚本（最简单）

### 1️⃣ 获取 GitHub Token

访问 https://github.com/settings/tokens，创建一个新的 token：

- 点击 "Generate new token (classic)"
- Note: `dao-research-assistant-push`
- Expiration: 90 days
- 勾选：✅ `repo` (完整仓库权限)
- 点击 "Generate token"
- **立即复制 token**（只显示一次！）

### 2️⃣ 在本地终端执行

```bash
cd /workspace/thread

# 使用脚本推送（将 YOUR_TOKEN 替换为你的 token）
bash push-with-token.sh YOUR_TOKEN
```

脚本会自动完成：
- ✅ 推送主分支
- ✅ 推送标签 v1.0.0
- ✅ 设置上游分支

---

## 🔐 方法二：手动使用 Token 推送

```bash
cd /workspace/thread

# 将 YOUR_TOKEN 替换为你的实际 token
export GITHUB_TOKEN="YOUR_TOKEN"

# 推送主分支
git push "https://${GITHUB_TOKEN}@github.com/daoApps/dao-research-assistant.git" main

# 推送标签
git push "https://${GITHUB_TOKEN}@github.com/daoApps/dao-research-assistant.git" --tags

# 设置上游
git branch --set-upstream-to=github/main main
```

---

## 🔑 方法三：使用 SSH（如果已配置）

```bash
cd /workspace/thread

# 修改远程 URL 为 SSH
git remote set-url github git@github.com:daoApps/dao-research-assistant.git

# 推送
git push -u github main
git push github --tags
```

---

## 📱 方法四：使用 GitHub CLI

```bash
cd /workspace/thread

# 登录 GitHub（如果未登录）
gh auth login

# 推送
git push -u github main
git push github --tags
```

---

## ✅ 验证推送成功

推送完成后，执行以下命令验证：

```bash
# 查看远程分支
git branch -a

# 查看远程标签
git ls-remote --tags github

# 或直接访问仓库
open https://github.com/daoApps/dao-research-assistant
```

你应该能看到：
- ✅ 24 次提交
- ✅ README.md 文件
- ✅ LICENSE 文件
- ✅ 完整的源代码
- ✅ v1.0.0 标签

---

## 🆘 常见问题

### Q1: Token 已失效或无效

**解决方案**：重新生成一个新的 token，确保勾选了 `repo` 权限。

### Q2: 权限被拒绝

**解决方案**：
1. 确认你是 daoApps 组织的成员或拥有者
2. 确认 token 有足够的权限
3. 如果是 SSH，确认 SSH 密钥已添加到 GitHub

### Q3: 推送超时

**解决方案**：
1. 检查网络连接
2. 尝试使用代理或 VPN
3. 使用 GitHub Desktop 应用

### Q4: 远程仓库不存在

**解决方案**：确认已在 GitHub 上创建了 `dao-research-assistant` 仓库。

---

## 📞 需要帮助？

如果遇到问题：
1. 查看错误信息
2. 检查 GitHub 仓库是否已创建
3. 验证 token 权限是否正确
4. 尝试其他推送方法

---

**推送完成后，回到对话告诉我"推送完成"，我会帮你完成后续配置！**
