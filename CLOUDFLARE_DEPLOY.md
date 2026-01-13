# Cloudflare Pages 部署指南

## 方式一：通过 Dashboard 自动部署（推荐，最简单）

### 步骤

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 登录你的账号

2. **创建 Pages 项目**
   - 点击左侧菜单 **Pages**
   - 点击 **Create a project**
   - 选择 **Connect to Git**

3. **连接 GitHub**
   - 授权 Cloudflare 访问 GitHub
   - 选择仓库：`MyraWang0406/ADX-experiment`
   - 选择分支：`main`

4. **配置构建设置**
   - **Framework preset:** `Next.js`（Cloudflare 会自动检测）
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Root directory:** `/`（留空）
   - **Node.js version:** `18`（默认）

5. **保存并部署**
   - 点击 **Save and Deploy**
   - 等待构建完成（通常 2-5 分钟）

6. **获取部署 URL**
   - 部署完成后，Cloudflare 会提供一个 URL
   - 格式：`your-project-name.pages.dev`

### 自动部署

连接后，每次推送到 `main` 分支都会自动触发部署。

---

## 方式二：使用 Wrangler CLI 手动部署（可选）

### 前置要求

1. 安装 Wrangler CLI：
```bash
npm install -g wrangler
```

2. 登录 Cloudflare：
```bash
wrangler login
```

### 部署命令

```bash
# 1. 构建项目
npm run build

# 2. 部署到 Cloudflare Pages
npx wrangler pages deploy .next --project-name=adx-experiment
```

或者使用 `@cloudflare/next-on-pages` 适配器（Next.js 14 推荐）：

```bash
# 1. 安装适配器
npm install --save-dev @cloudflare/next-on-pages

# 2. 构建（适配器会自动处理）
npm run build

# 3. 部署
npx wrangler pages deploy .vercel/output/static --project-name=adx-experiment
```

---

## 当前项目配置

### 构建命令
```bash
npm run build
```

### 输出目录
```
.next
```

### Node 版本
```
18.x
```

### 环境变量
无需特殊环境变量（使用本地 mock 数据）

---

## 验证部署

部署成功后，访问 Cloudflare 提供的 URL，检查：

1. ✅ 首页能正常加载
2. ✅ `/exp/exp_001` 详情页能正常显示
3. ✅ Mock 数据能正常读取（`/_mock/index.json`）
4. ✅ 联系作者组件显示在右下角

---

## 常见问题

### 1. 构建失败

**问题：** 构建时出现错误

**解决：**
- 检查 Node.js 版本是否为 18+
- 确保 `package.json` 中的依赖都正确
- 查看 Cloudflare 构建日志中的具体错误信息

### 2. 页面 404

**问题：** 访问页面显示 404

**解决：**
- 确保 `next.config.js` 配置正确
- 检查路由文件是否存在
- 查看 Cloudflare 构建日志

### 3. Mock 数据无法加载

**问题：** 页面显示但数据为空

**解决：**
- 确保 `public/_mock/` 目录下的文件已提交到 GitHub
- 检查文件路径是否正确（`/_mock/index.json`）

---

## 推荐方式

**强烈推荐使用方式一（Dashboard 自动部署）**，因为：
- ✅ 最简单，无需安装额外工具
- ✅ 自动检测 Next.js 框架
- ✅ 每次推送自动部署
- ✅ 提供构建日志和错误提示
- ✅ 支持预览部署（PR 部署）

---

## 部署后操作

1. **绑定自定义域名**（可选）
   - 在 Cloudflare Pages 项目设置中
   - 添加自定义域名

2. **配置环境变量**（如需要）
   - 在项目设置中添加环境变量
   - 例如：`NEXT_PUBLIC_API_BASE_URL`

3. **查看部署历史**
   - 在 Cloudflare Dashboard 中查看所有部署
   - 可以回滚到之前的版本





