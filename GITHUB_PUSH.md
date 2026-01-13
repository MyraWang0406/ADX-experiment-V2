# GitHub 推送步骤

## 1. 初始化 Git（如果还没有）

```powershell
# 检查是否已有 Git 仓库
git status

# 如果没有，初始化
git init
```

## 2. 添加所有文件

```powershell
git add .
```

## 3. 提交更改

```powershell
git commit -m "Initial commit: ADX experiment dashboard with contact author"
```

## 4. 添加远程仓库

```powershell
git remote add origin https://github.com/MyraWang0406/ADX-experiment.git
```

如果已经存在，先删除再添加：
```powershell
git remote remove origin
git remote add origin https://github.com/MyraWang0406/ADX-experiment.git
```

## 5. 推送到 GitHub

```powershell
git branch -M main
git push -u origin main
```

## 完整命令序列

```powershell
# 一次性执行
git add .
git commit -m "Add contact author component and prepare for Cloudflare deployment"
git remote add origin https://github.com/MyraWang0406/ADX-experiment.git
git branch -M main
git push -u origin main
```

## 注意事项

- 确保 `.gitignore` 已正确配置，不会提交 `node_modules` 等大文件
- Mock 数据文件（`public/_mock/`）会被提交，但通常 JSON 文件较小
- 如果推送失败，检查网络连接和 GitHub 权限





