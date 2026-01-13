# 实验数据模式切换说明

## 模式说明

### Demo 模式（默认）
- **数据源**: 本地 mock JSON 文件（`public/mock/ai_reco_ads_demo_data_v2/`）
- **特点**: 
  - 100% 稳定，不依赖网络
  - 适合演示和开发
  - 数据来自静态文件

### Live 模式
- **数据源**: 真实 API（`/api/experiments/[id]`）
- **特点**:
  - 实时数据
  - 需要 API 可用
  - API 失败时会自动 fallback 到 demo 模式

## 切换方式

### 方式 1: Query 参数（推荐，优先级最高）

访问 URL 时添加 `?mode=live` 参数：

```
http://localhost:3000/exp/exp_001?mode=live
```

**优点**: 
- 无需重启服务器
- 可以针对单个页面切换
- 优先级最高

### 方式 2: 环境变量

在 `.env.local` 或 `.env` 文件中设置：

```bash
NEXT_PUBLIC_EXPERIMENT_MODE=live
```

然后重启 dev server：

```bash
npm run dev
```

**优点**:
- 全局生效
- 适合生产环境配置

**注意**: 如果同时设置了 query 参数和环境变量，query 参数优先级更高。

## 代码实现

数据加载逻辑在 `lib/server/experiment-loader.ts`：

```typescript
// 自动检测模式
const data = await loadExperiment(expId, undefined, searchParams)

// 或手动指定模式
const data = await loadExperiment(expId, 'live')
const data = await loadExperiment(expId, 'demo')
```

## API 配置

Live 模式使用的 API 基础 URL 可通过环境变量配置：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

默认使用 `http://localhost:3000`。

## Fallback 机制

- Live 模式失败时，自动 fallback 到 demo 模式
- 确保页面永远不会因为 API 失败而崩溃
- 所有错误都会被捕获并记录到 console

## 使用示例

### Demo 模式（默认）
```
http://localhost:3000/exp/exp_001
http://localhost:3000/exp/exp_001?mode=demo
```

### Live 模式
```
http://localhost:3000/exp/exp_001?mode=live
```

### 环境变量方式
```bash
# .env.local
NEXT_PUBLIC_EXPERIMENT_MODE=live
```







