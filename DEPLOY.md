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

### 方式一：Dashboard 自动部署（推荐）

#### 部署命令（通过 Dashboard，无需手动命令）

1. **访问 Cloudflare Dashboard**
   - 登录：https://dash.cloudflare.com/
   - 进入 **Pages** → **Create a project**

2. **连接 GitHub**
   - 选择 **Connect to Git**
   - 授权并选择仓库：`MyraWang0406/ADX-experiment`
   - 选择分支：`main`

3. **配置构建设置**
   ```
   Framework preset: Next.js (自动检测)
   Build command: npm run build
   Build output directory: .next
   Root directory: / (留空)
   Node.js version: 18
   ```

4. **保存并部署**
   - 点击 **Save and Deploy**
   - 等待构建完成（2-5 分钟）

### 方式二：Wrangler CLI 手动部署

#### 前置步骤
```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

#### 部署命令
```bash
# 构建
npm run build

# 部署
npx wrangler pages deploy .next --project-name=adx-experiment
```

### 自动部署

连接 GitHub 后，每次推送到 `main` 分支都会自动触发部署。

### 详细说明

查看 `CLOUDFLARE_DEPLOY.md` 获取完整的部署指南和故障排除。

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

