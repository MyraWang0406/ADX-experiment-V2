# 快速开始指南

## 1. 推送到 GitHub

```powershell
# 检查 Git 状态
git status

# 添加所有文件
git add .

# 提交
git commit -m "Add contact author and prepare for Cloudflare deployment"

# 添加远程仓库（如果还没有）
git remote add origin https://github.com/MyraWang0406/ADX-experiment.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 2. Cloudflare Pages 部署

### 步骤 1：连接 GitHub
1. 访问 https://dash.cloudflare.com/
2. 进入 **Pages** → **Create a project**
3. 选择 **Connect to Git**
4. 授权并选择 `MyraWang0406/ADX-experiment`

### 步骤 2：构建设置（自动检测）
Cloudflare 会自动检测 Next.js，使用默认配置：
- **Framework:** Next.js
- **Build command:** `npm run build`
- **Output directory:** `.next`
- **Node version:** 18

### 步骤 3：部署
点击 **Save and Deploy**，等待部署完成。

## 3. 验证部署

部署完成后，Cloudflare 会提供一个 URL（如 `your-project.pages.dev`），访问即可查看网站。

## 注意事项

- ✅ Mock 数据文件已包含（约 200KB，可接受）
- ✅ `.gitignore` 已配置，不会提交大文件
- ✅ 联系作者组件已添加到右下角
- ✅ 使用最简单的 Cloudflare 配置，无需额外设置







