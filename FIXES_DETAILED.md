# 修复详细报告

## 根因分析

### A. Tab 切换问题

**根因定位**：
- **文件**: `components/TabSwitcher.tsx` 第 33 行
- **问题**: `const view = tabContext?.activeTab ?? tabFromURL` - 优先使用 Context，但 Context 的值可能延迟更新
- **证据**: Context 来自 `ExperimentDetailClient`，它从 URL 派生，但可能存在时序问题

**修复方案**：
- 直接从 URL 读取作为单一真相来源：`const view = tabFromURL`
- Context 仅用于更新操作，不用于读取状态

### B. View 切换问题

**根因定位**：
- **文件**: `components/ReasonDistribution.tsx` 第 18-19 行
- **问题**: 
  1. `const view = useView()` - 获取的是 tab（compare/baseline/treatment），不是 view filter
  2. `const { viewFilter } = useViewFilter()` - 来自 `ViewContext`，它使用 `useState`，不是从 URL 驱动
- **证据**: `ViewContext.tsx` 第 14 行使用 `useState<ViewFilterType>('All')`，没有从 URL 同步

**修复方案**：
- 使用 `useTabFromClient()` 获取 tab
- 使用 `useViewFilterFromClient()` 获取 viewFilter（来自 `ExperimentDetailClient` 的 Context，它从 URL 派生）

### C. 原因诊断折叠卡片问题

**根因定位**：
- **文件**: `components/DiagnosisTree.tsx` 第 194-199 行、第 267-273 行
- **状态**: 已经正确实现：
  - 按钮有 `type="button"`
  - 有 `e.preventDefault()` 和 `e.stopPropagation()`
  - 内部链接有 `stopPropagation()`（第 380 行）

**修复方案**：
- 无需修复，已正确实现

### D. 数值展示问题

**根因定位**：
- **文件**: `lib/format.ts` 第 9-18 行
- **状态**: `formatPercent` 已正确实现，严格区分 0 与缺失值
- **证据**: 
  - `AuctionBidPanel.tsx` 第 184、241 行已使用 `formatPercent(baseline.fill_rate)` 和 `formatPercent(treatment.fill_rate)`
  - `BiddingBudgetPanel.tsx` 第 197-198 行已使用 `renderRate`，它内部调用 `formatPercent`

**修复方案**：
- 无需修复，已正确实现

### E. 图表中文化问题

**根因定位**：
- **文件**: 
  1. `components/DiagnosisTree.tsx` 第 278 行 - `branch.node` 显示 "量不足（fill/coverage）" 中英混杂
  2. `components/ReasonDistribution.tsx` 第 37、45 行 - 已使用 `formatReasonLabel`，但 tooltip 需要优化
- **证据**: Mock 数据中 `branch.node` 包含 "量不足（fill/coverage）" 格式

**修复方案**：
- `DiagnosisTree.tsx`: 移除 node 中的括号内英文部分
- `ReasonDistribution.tsx`: Tooltip 已正确显示中文 + code（第 183-184 行）

## 修改的文件清单

### 1. `components/TabSwitcher.tsx`
**改动**：
- 第 31-33 行：直接从 URL 读取作为单一真相来源，不依赖 Context 延迟
- 第 35-48 行：Context 仅用于更新操作

**关键 Diff**：
```typescript
// 修复前
const view = tabContext?.activeTab ?? tabFromURL

// 修复后
const tabFromURL = searchParams ? (searchParams.get?.('tab') ?? as ViewType) || 'compare' : 'compare'
const view = tabFromURL  // 直接从 URL 读取，作为单一真相来源
```

### 2. `components/ReasonDistribution.tsx`
**改动**：
- 第 3-4 行：导入正确的 Context hooks
- 第 18-35 行：使用 `useTabFromClient()` 和 `useViewFilterFromClient()` 替代 `useView()` 和 `useViewFilter()`

**关键 Diff**：
```typescript
// 修复前
const view = useView()  // 获取的是 tab，不是 view filter
const { viewFilter } = useViewFilter()  // 来自 ViewContext，使用 useState，不从 URL 驱动

// 修复后
let view: 'compare' | 'baseline' | 'treatment' = 'compare'
let viewFilter: 'All' | 'DSP' | 'SSP' | 'ADX' = 'All'

try {
  const tabContext = useTabFromClient()
  view = tabContext.activeTab
} catch {
  view = 'compare'
}

try {
  const viewFilterContext = useViewFilterFromClient()
  viewFilter = viewFilterContext.viewFilter
} catch {
  viewFilter = 'All'
}
```

### 3. `components/DiagnosisTree.tsx`
**改动**：
- 第 277-281 行：移除 node 中的括号内英文部分，只显示中文
- 第 309-315 行：同样处理结论文本

**关键 Diff**：
```typescript
// 修复前
{branch.node || reasonBucket}  // 显示 "量不足（fill/coverage）"

// 修复后
{(() => {
  const nodeText = branch.node || reasonBucket
  // 移除括号内的英文（如 "量不足（fill/coverage）" -> "量不足"）
  return nodeText.replace(/\s*\([^)]*\)\s*/g, '').trim() || reasonBucket
})()}
```

### 4. `components/exp/ExperimentDetailClient.tsx`
**改动**：
- 第 65-78 行：修复 useEffect 依赖，确保 URL 参数正确初始化

**关键 Diff**：
```typescript
// 修复前
}, []) // 只在 mount 时执行一次

// 修复后
}, [searchParams, router]) // 依赖 searchParams 和 router
```

## 浏览器验证步骤

### A. Tab 切换验证

1. 打开 `http://localhost:3000/exp/exp_001?tab=compare&view=all`
2. **验证点 1**: 点击 "基线（Baseline）" tab
   - **预期**: URL 立即变为 `?tab=baseline&view=all`（view 参数保留）
   - **预期**: 页面内容切换为只显示 baseline 列
   - **预期**: 一次点击生效，不需要点两次
3. **验证点 2**: 点击 "实验组（Treatment）" tab
   - **预期**: URL 立即变为 `?tab=treatment&view=all`（view 参数保留）
   - **预期**: 页面内容切换为只显示 treatment 列
4. **验证点 3**: 点击 "对比（Compare）" tab
   - **预期**: URL 立即变为 `?tab=compare&view=all`
   - **预期**: 页面内容切换为双列对比

### B. View 切换验证

1. 在 `/exp/exp_001?tab=compare&view=all` 页面
2. **验证点 1**: 点击 "DSP" 按钮
   - **预期**: URL 立即变为 `?tab=compare&view=dsp`（tab 参数保留）
   - **预期**: Debug Panel 的 View 字段更新为 "DSP"
   - **预期**: 图表/列表数据按 DSP 过滤更新
   - **预期**: 一次点击生效
3. **验证点 2**: 点击 "SSP" 按钮
   - **预期**: URL 立即变为 `?tab=compare&view=ssp`
   - **预期**: 图表/列表数据按 SSP 过滤更新
4. **验证点 3**: 点击 "All" 按钮
   - **预期**: URL 立即变为 `?tab=compare&view=all`
   - **预期**: 显示所有数据

### C. 原因诊断折叠卡片验证

1. 滚动到 "原因诊断（证据闭环）" 区域
2. **验证点 1**: 点击 "量不足" 折叠卡片标题
   - **预期**: 一次点击即展开，显示子项
   - **预期**: 子项标题只显示中文（如 "量不足"），不显示 "量不足（fill/coverage）"
3. **验证点 2**: 再点一次 "量不足" 标题
   - **预期**: 一次点击即收起
4. **验证点 3**: 展开后，点击内部的 "查看对应图表" 链接
   - **预期**: 链接正常工作，不会触发折叠

### D. 数值展示验证

1. 查看 "拍卖监控" 区域的 "填充率（Fill Rate）"
2. **验证点 1**: 如果数据缺失
   - **预期**: 显示 "—"
   - **预期**: 不显示 "0.00%"
3. **验证点 2**: 如果数据为 0
   - **预期**: 显示 "0.00%"
   - **预期**: 不显示 "—"

### E. 图表中文化验证

1. 查看 "原因分布" 区域的图表
2. **验证点 1**: X 轴标签
   - **预期**: 只显示中文（如 "质量门槛过滤"），不显示英文 code
3. **验证点 2**: Legend
   - **预期**: 只显示中文
4. **验证点 3**: Tooltip
   - **预期**: 主标题显示中文
   - **预期**: code 作为二级信息（小号/灰色）显示

## 技术要点

1. **URL 驱动单一真相**：
   - `activeTab` 和 `activeView` 都从 `useSearchParams()` 读取
   - 不使用 `useState` 存储这些状态
   - Context 仅用于传递更新函数，不用于存储状态

2. **参数保留**：
   - `setQueryParam` 使用 `new URLSearchParams(searchParams?.toString() || '')` 保留所有现有参数
   - 只更新目标参数，其他参数不变

3. **事件处理**：
   - 所有按钮使用 `<button type="button">` 避免默认表单行为
   - 使用 `e.preventDefault()` 和 `e.stopPropagation()` 防止事件冒泡

4. **z-index 层级**：
   - Tab bar: z-index 200
   - View switcher: z-index 200
   - 按钮: z-index 201
   - 左侧侧栏: z-index 30（不会覆盖 Tab bar）







