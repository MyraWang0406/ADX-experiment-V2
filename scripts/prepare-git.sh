#!/bin/bash
# 准备 Git 推送的脚本

echo "检查大文件..."
find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" | head -20

echo ""
echo "检查 .gitignore..."
cat .gitignore

echo ""
echo "Git 状态："
git status --short | head -20

echo ""
echo "准备推送到 GitHub..."
echo "运行以下命令："
echo "  git add ."
echo "  git commit -m 'Add contact author component and prepare for deployment'"
echo "  git remote add origin https://github.com/MyraWang0406/ADX-experiment.git"
echo "  git branch -M main"
echo "  git push -u origin main"

