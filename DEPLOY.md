# 部署说明

## GitHub 推送

### 1. 初始化 Git 仓库（如果还没有）

```bash
git init
git add .
git commit -m "Initial commit: ADX experiment dashboard"
```

### 2. 添加远程仓库

```bash
git remote add origin https://github.com/MyraWang0406/ADX-experiment.git
```

### 3. 推送代码

```bash
git branch -M main
git push -u origin main
```

## Cloudflare Pages 部署

### 1. 连接 GitHub 仓库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 部分
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权 GitHub 并选择仓库 `MyraWang0406/ADX-experiment`

### 2. 构建配置（最简单配置）

Cloudflare Pages 会自动检测 Next.js，使用以下配置：

**Framework preset:** `Next.js` (自动检测)

**Build command:** 
```
npm run build
```

**Build output directory:** 
```
.next
```

**Root directory:** `/` (留空，使用项目根目录)

**Node.js version:** `18` 或更高（Cloudflare 默认）

**Environment variables:** 无需特殊环境变量

### 3. 一键部署

连接 GitHub 后，Cloudflare 会自动：
- 检测 Next.js 框架
- 使用默认构建命令 `npm run build`
- 自动部署到 `.next` 输出目录

### 4. 自动部署

连接后，每次推送到 `main` 分支都会自动触发部署。

### 5. 自定义域名（可选）

在 Cloudflare Pages 项目设置中可以绑定自定义域名。

## 本地构建测试

在推送前，建议先本地测试构建：

```bash
# 安装依赖
npm install

# 构建
npm run build

# 启动生产服务器（可选）
npm start
```

## 注意事项

1. **不要提交大文件：** `.gitignore` 已配置忽略 `node_modules`、`.next` 等
2. **Mock 数据：** `public/_mock/` 目录下的 JSON 文件会被部署，确保文件大小合理
3. **环境变量：** 如需环境变量，在 Cloudflare Pages 设置中添加

## 文件大小检查

确保以下目录/文件不会被提交：
- `node_modules/` (已在 .gitignore)
- `.next/` (已在 .gitignore)
- `*.log` (已在 .gitignore)

Mock 数据文件（`public/_mock/`）会被部署，但通常 JSON 文件较小，可以接受。

