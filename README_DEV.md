# 开发环境自检清单

## 启动前检查

### 1. 终止占用端口的进程

如果端口 3000 被占用，先运行：

```powershell
.\scripts\kill-dev.ps1
```

或者在 PowerShell 中：

```powershell
cd D:\Download\cursor\搜广推可视化
.\scripts\kill-dev.ps1
```

### 2. 启动开发服务器

```bash
npm run dev
```

**重要**：确保终端最后打印的 URL 是 `http://localhost:3000`（不是 3001 或其他端口）。

### 3. 验证静态资源可访问

在浏览器中访问以下 URL，确保都返回 JSON（状态码 200）：

- ✅ `http://localhost:3000/_mock/index.json` - 必须返回 JSON
- ✅ `http://localhost:3000/_mock/experiments/exp_001.json` - 必须返回 JSON

### 4. 验证页面可访问

- ✅ `http://localhost:3000/` - 首页（实验列表）
- ✅ `http://localhost:3000/exp/exp_001` - 实验详情页

## 常见问题

### 问题：端口 3000 被占用，但 `npm run dev` 自动切换到 3001

**原因**：Next.js 默认会在端口被占用时自动切换到下一个可用端口。

**解决**：
1. 运行 `.\scripts\kill-dev.ps1` 终止占用进程
2. 重新运行 `npm run dev`
3. 确保访问 `http://localhost:3000`（不要访问 3001）

### 问题：`/_mock/index.json` 返回 404

**检查**：
1. 确认文件存在：`public/_mock/index.json`
2. 检查 `middleware.ts` 是否拦截了 `/_mock` 路径
3. 检查 `next.config.js` 是否有 `basePath` 或 `assetPrefix` 配置

### 问题：页面显示 "Experiment not found"

**检查**：
1. 确认 `public/_mock/experiments/exp_001.json` 文件存在
2. 打开浏览器开发者工具 Network 面板，查看请求的 URL 和响应
3. 检查 `lib/server/data-loader.ts` 中的数据加载逻辑

## 调试技巧

### 查看数据加载日志

在 `lib/server/data-loader.ts` 中，开发环境会输出调试日志：

```typescript
console.log('[exp] loading url=', url)
console.log('[exp] params=', params, 'expId=', expId)
```

### 查看组件交互日志

在浏览器控制台中，点击 "Compare/Baseline/Treatment" 或 "All/DSP/SSP/ADX" 时，应该看到：

```
[TabSwitcher] Compare button clicked, current view: compare
[TabSwitcher] view state updated to: compare
[ViewSwitcherInClient] View button clicked: DSP, current: All
[ViewSwitcherInClient] View state updated to: DSP
```

如果没有看到这些日志，说明点击事件没有触发，可能是：
1. 组件没有正确标记为 Client Component（缺少 `'use client'`）
2. 有透明层遮挡了按钮（检查 CSS `z-index` 和 `pointer-events`）






