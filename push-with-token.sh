#!/bin/bash

# 道研助手 - 使用 Token 推送到 GitHub
# 使用方法：bash push-with-token.sh YOUR_GITHUB_TOKEN

set -e

echo "🚀 道研助手 - GitHub 推送脚本（使用 Token）"
echo "=============================================="
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 错误：缺少 GitHub Token"
    echo ""
    echo "使用方法："
    echo "  bash push-with-token.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "如何获取 Token："
    echo "  1. 访问 https://github.com/settings/tokens"
    echo "  2. 点击 'Generate new token (classic)'"
    echo "  3. 勾选 'repo' 权限"
    echo "  4. 复制生成的 token"
    echo "  5. 运行：bash push-with-token.sh <你的token>"
    echo ""
    exit 1
fi

TOKEN=$1
GITHUB_URL="https://${TOKEN}@github.com/daoApps/dao-research-assistant.git"

echo "📋 推送信息："
echo "  目标仓库: daoApps/dao-research-assistant"
echo "  本地提交数: $(git rev-list --count HEAD)"
echo "  标签: $(git tag -l)"
echo ""

# 推送主分支
echo "📤 Step 1: 推送主分支..."
git push "${GITHUB_URL}" main
echo "✅ 主分支推送成功"
echo ""

# 推送标签
echo "🏷️  Step 2: 推送标签..."
git push "${GITHUB_URL}" --tags
echo "✅ 标签推送成功"
echo ""

# 设置上游
echo "🔗 Step 3: 设置上游分支..."
git branch --set-upstream-to=github/main main
echo "✅ 上游分支设置完成"
echo ""

echo "🎉 推送完成！"
echo ""
echo "🌐 访问你的仓库："
echo "   https://github.com/daoApps/dao-research-assistant"
echo ""
echo "📋 下一步："
echo "   1. 访问仓库页面验证内容"
echo "   2. 设置 About 和 Topics"
echo "   3. 创建 v1.0.0 Release"
echo ""
