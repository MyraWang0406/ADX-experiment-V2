# 修复总结

## 0. 生效验真

### BUILD_STAMP 验证
- **文件**: `app/exp/[id]/page.tsx`
- **改动**: 在页面顶部添加了黄色 BUILD_STAMP 横幅
- **验证方法**: 刷新页面后，应该能看到页面顶部有黄色背景的 `BUILD_STAMP: BUILD_<时间戳>` 横幅

### 必须执行的命令

```powershell
# 1. 检查端口占用
netstat -ano | findstr :3000

# 2. 如果有 LISTENING，杀掉进程（替换 <PID> 为实际 PID）
taskkill /F /PID <PID>

# 3. 清理缓存
Remove-Item -Recurse -Force .next

# 4. 重启开发服务器
npm run dev
# 或
pnpm dev
# 如果 3000 被占用，使用：
pnpm dev -- -p 3001
```

## 修改的文件列表

### 1. 核心状态管理
- **`components/exp/ExperimentDetailClient.tsx`**
  - 修复：直接从 URL searchParams 派生状态，不使用 useState + useEffect 反模式
  - 修复：Tab/View 切换直接更新 URL，状态从 URL 派生
  - 修复：提高 z-index 到 200，确保不被左侧侧栏遮挡

### 2. Tab 切换组件
- **`components/TabSwitcher.tsx`**
  - 修复：直接从 URL 派生状态
  - 修复：提高 z-index 到 200，按钮 z-index 201
  - 修复：确保所有按钮都是 `<button type="button">`

### 3. 手风琴组件
- **`components/DiagnosisTree.tsx`**
  - 修复：所有折叠按钮都是 `<button type="button">`
  - 修复：内部链接添加 `stopPropagation` 防止触发折叠

### 4. 格式化工具
- **`lib/format.ts`** (新建)
  - 新增：统一的 `formatPercent` 函数，严格区分 0 与缺失值
  - 新增：`formatNumber` 函数

### 5. 标签映射
- **`lib/labels.ts`** (新建)
  - 新增：统一的 reason code => 中文名映射
  - 新增：`formatReasonLabel` 函数（只显示中文）

### 6. 图表组件
- **`components/ReasonDistribution.tsx`**
  - 修复：使用 `formatReasonLabel` 只显示中文
  - 修复：Tooltip 中 code 作为二级信息显示

### 7. 数值显示组件
- **`components/AuctionBidPanel.tsx`**
  - 修复：使用统一的 `formatPercent` 函数
- **`components/BiddingBudgetPanel.tsx`**
  - 修复：使用统一的 `formatPercent` 函数

### 8. URL 工具
- **`lib/url-utils.ts`** (已存在)
  - 提供：`setQueryParam`、`getTabFromURL`、`getViewFromURL` 等工具函数

### 9. 页面验证
- **`app/exp/[id]/page.tsx`**
  - 添加：BUILD_STAMP 验证横幅

## 关键 Diff

### 1. ExperimentDetailClient - 直接从 URL 派生状态

```typescript
// 修复前：使用 useState + useEffect 反模式
const [activeTab, setActiveTab] = useState<ViewType>('compare')
useEffect(() => {
  // 从 URL 读取并更新 state
}, [searchParams])

// 修复后：直接从 URL 派生
const activeTab = searchParams ? getTabFromURL(searchParams) : 'compare'
const viewFromURL = searchParams ? getViewFromURL(searchParams) : 'all'
const activeView = viewToViewFilter[viewFromURL]
```

### 2. Tab 切换 - 直接更新 URL

```typescript
// 修复后：直接更新 URL，状态自动从 URL 派生
const handleTabChange = useCallback((newTab: ViewType) => {
  setQueryParam(router, searchParams, 'tab', newTab)
}, [router, searchParams])
```

### 3. formatPercent - 严格区分 0 与缺失

```typescript
// lib/format.ts
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value == null || value === undefined || !Number.isFinite(value)) {
    return '—' // 缺失值显示 "—"
  }
  const num = value * 100
  return `${num.toFixed(decimals)}%` // 真实 0 显示 0.00%
}
```

### 4. 图表标签 - 只显示中文

```typescript
// lib/labels.ts
export function formatReasonLabel(code: string): string {
  return reasonCodeLabels[code] || code
}

// components/ReasonDistribution.tsx
rerankData = (filteredReasons.rerank || []).map((item: any) => ({
  reason: formatReasonLabel(item.code || ''), // 只显示中文
  reasonCode: item.code || '', // code 保留用于 tooltip
}))
```

### 5. z-index 修复 - 确保不被遮挡

```typescript
// components/TabSwitcher.tsx
<div className="relative bg-white" style={{ zIndex: 200, position: 'relative' }}>
  <button style={{ zIndex: 201, position: 'relative', pointerEvents: 'auto' }}>
```

## 验证 Checklist

### 步骤 1: 确认新代码生效
1. 执行清理和重启命令（见上方）
2. 打开 `http://localhost:3000/exp/exp_001?tab=compare&view=all`
3. **必须看到**：页面顶部有黄色背景的 `BUILD_STAMP: BUILD_<时间戳>` 横幅
4. 如果看不到，说明还在运行旧代码，需要重新执行清理命令

### 步骤 2: 验证 Tab 切换
1. 在 `/exp/exp_001?tab=compare&view=all` 页面
2. 点击 "基线（Baseline）" tab
3. **预期结果**：
   - URL 立即变为 `?tab=baseline&view=all`（view 参数保留）
   - 页面内容切换（只显示 baseline 列）
   - 不需要点两次

### 步骤 3: 验证视角切换
1. 在 `/exp/exp_001?tab=baseline&view=all` 页面
2. 点击 "DSP" 按钮
3. **预期结果**：
   - URL 立即变为 `?tab=baseline&view=dsp`（tab 参数保留）
   - Debug Panel 的 View 字段更新为 "DSP"
   - 图表/列表内容按 DSP 过滤
   - 不需要点两次

### 步骤 4: 验证手风琴交互
1. 滚动到 "原因诊断（证据闭环）" 区域
2. 点击 "量不足" 折叠卡片标题
3. **预期结果**：
   - 一次点击即展开，显示子项
   - 再点一次即收起
   - 点击内部的 "查看对应图表" 链接不会触发折叠

### 步骤 5: 验证数值显示
1. 查看 "拍卖监控" 区域的 "填充率（Fill Rate）"
2. **预期结果**：
   - 如果数据缺失：显示 "—"
   - 如果数据为 0：显示 "0.00%"
   - 不允许出现"缺失却显示 0.00%"的情况

### 步骤 6: 验证图表标签
1. 查看 "原因分布" 区域的图表
2. **预期结果**：
   - X 轴标签只显示中文（如"质量门槛过滤"），不显示英文 code
   - Legend 只显示中文
   - Tooltip 中：主标题中文，code 作为二级信息（小号/灰色）

### 步骤 7: 验证遮挡问题
1. 检查 Tab bar 是否被左侧阅读进度侧栏遮挡
2. **预期结果**：
   - Tab bar 完全可见且可点击
   - 所有按钮都可以正常点击
   - 左侧侧栏（z-30）不会覆盖 Tab bar（z-200）

## 阻塞问题排查

如果 BUILD_STAMP 不可见：
1. 检查是否有多个 dev server 实例运行
2. 确认清理了 `.next` 目录
3. 确认重启了 dev server
4. 检查浏览器缓存（Ctrl+Shift+R 强制刷新）

如果 Tab/View 切换不生效：
1. 检查浏览器 Console 是否有错误
2. 检查 URL 参数是否正确更新
3. 确认使用的是 `router.replace` 而不是 `router.push`








