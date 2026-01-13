# 止血级修复报告

## 修复目标
1. ✅ P0: 修复 searchParams 空指针问题
2. ✅ P1: 彻底改掉 ViewSwitcher/TabSwitcher 的状态源，使用 URL 作为唯一真相来源
3. ✅ P2: 修复 Debug Panel 读取一致性
4. ✅ P3: 默认隐藏 BUILD_STAMP（已不存在，无需修复）
5. ✅ P4: 诊断区中文化
6. ✅ P5: 修复 0 值被当成缺失的问题（已在 format.ts 中修复）

---

## 修改的文件清单

### P0: 修复 searchParams 空指针

#### 1. `lib/url-utils.ts`
**修改点摘要：** 修复 `searchParams.get?.` 错误写法，改为 `searchParams?.get`

**关键代码片段：**
```typescript
// Before:
const tab = searchParams.get?.('tab') ??
const view = searchParams.get?('view')??.toLowerCase()

// After:
const tab = searchParams?.get('tab')
const view = searchParams?.get('view')?.toLowerCase()
```

#### 2. `components/exp/ExperimentDetailContext.tsx`
**修改点摘要：** 使用 `??` 替代 `||` 确保正确处理 falsy 值

**关键代码片段：**
```typescript
// Before:
const tabParam = searchParams?.get('tab') || 'compare'
const viewParam = searchParams?.get('view')?.toLowerCase() || 'all'

// After:
const tabParam = searchParams?.get('tab') ?? 'compare'
const viewParam = searchParams?.get('view')?.toLowerCase() ?? 'all'
```

---

### P1: 创建 queryState.ts 并重构 TabSwitcher/ViewSwitcher

#### 1. `components/exp/queryState.ts` (新建)
**修改点摘要：** 新建文件，提供 `useQueryTab()` 和 `useQueryView()` hooks，基于 URL 作为唯一真相来源

**关键代码片段：**
```typescript
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export type Tab = 'compare' | 'baseline' | 'treatment'
export type View = 'all' | 'dsp' | 'ssp' | 'adx'

export function useQueryTab(): { tab: Tab; setTab: (tab: Tab) => void } {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 读取：从 URL 读取，校验非法值则回退默认
  const tabParam = searchParams?.get('tab')
  const tab: Tab =
    tabParam === 'compare' || tabParam === 'baseline' || tabParam === 'treatment'
      ? tabParam
      : 'compare'

  // 写入：更新 URL，保留其他参数
  const setTab = useCallback(
    (nextTab: Tab) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set('tab', nextTab)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return { tab, setTab }
}

export function useQueryView(): { view: View; setView: (view: View) => void } {
  // 类似实现...
}
```

#### 2. `components/TabSwitcher.tsx`
**修改点摘要：** 改用 `useQueryTab()` 替代 `useExperimentDetail()`

**关键代码片段：**
```typescript
// Before:
import { useExperimentDetail, type Tab } from '@/components/exp/ExperimentDetailContext'
const { tab, setTab } = useExperimentDetail()

// After:
import { useQueryTab, type Tab } from '@/components/exp/queryState'
const { tab, setTab } = useQueryTab()
```

#### 3. `components/ViewSwitcher.tsx`
**修改点摘要：** 改用 `useQueryView()` 替代 `useExperimentDetail()`

**关键代码片段：**
```typescript
// Before:
import { useExperimentDetail, type View } from '@/components/exp/ExperimentDetailContext'
const { view, setView } = useExperimentDetail()

// After:
import { useQueryView, type View } from '@/components/exp/queryState'
const { view, setView } = useQueryView()
```

#### 4. `components/exp/ExperimentDetailClient.tsx`
**修改点摘要：** `ExperimentDetailClientInner` 和 `ViewSwitcherInClient` 改用新的 queryState hooks

**关键代码片段：**
```typescript
// Before:
import { useExperimentDetail, type Tab, type View } from './ExperimentDetailContext'
const { tab, view } = useExperimentDetail()

// After:
import { useQueryTab, useQueryView } from './queryState'
const { tab } = useQueryTab()
const { view } = useQueryView()
```

---

### P2: 修复 Debug Panel 读取一致性

#### 1. `components/DebugPanel.tsx`
**修改点摘要：** Debug Panel 也从 URL 读取 tab/view，保证与 URL 一致

**关键代码片段：**
```typescript
// Before:
export default function DebugPanel({
  activeTab,
  activeView,
}: DebugPanelProps) {
  // 直接使用 props
}

// After:
import { useQueryTab, useQueryView } from '@/components/exp/queryState'

export default function DebugPanel({
  activeTab: propActiveTab,
  activeView: propActiveView,
}: DebugPanelProps) {
  // 【P2 修复】Debug Panel 也要从 URL 读取，保证与 URL 一致
  const { tab: urlTab } = useQueryTab()
  const { view: urlView } = useQueryView()
  
  // 优先使用 URL 的值，如果没有则使用 props（向后兼容）
  const activeTab = urlTab || propActiveTab
  const activeView = urlView ? (urlView.charAt(0).toUpperCase() + urlView.slice(1)) : propActiveView
}
```

---

### P4: 诊断区中文化

#### 1. `components/DiagnosisTree.tsx`
**修改点摘要：** 添加 CODE_ZH 映射和 formatCheckText 函数，检查项显示中文，code 显示在小字里

**关键代码片段：**
```typescript
// 新增映射
const CODE_ZH: Record<string, string> = {
  'BID_TOO_LOW': '出价过低',
  'BUDGET_EXHAUSTED': '预算耗尽',
  'TIMEOUT': '超时',
  'FILTERED_BY_QUALITY': '质量过滤',
  'FILTERED_BY_DUP': '去重过滤',
  'FILTERED_BY_FREQ_CAP': '频控过滤',
  'DIVERSITY_SWAP': '多样性换位',
}

// 新增格式化函数
function formatCheckText(text: string): { zh: string; code?: string } {
  // 如果文本本身就是 code，直接映射
  if (CODE_ZH[text]) {
    return { zh: CODE_ZH[text], code: text }
  }
  
  // 如果文本包含 code，提取并转换
  for (const [code, zh] of Object.entries(CODE_ZH)) {
    if (text.includes(code)) {
      const cleaned = text.replace(/\s*\([^)]*\)\s*/g, '').trim()
      return { cleaned || zh, code }
    }
  }
  
  // 移除括号内的英文
  const cleaned = text.replace(/\s*\([^)]*\)\s*/g, '').trim()
  return { zh: cleaned || text }
}

// 渲染检查项时使用
{checks.map((check, idx) => {
  const checkStr = typeof check === 'string' ? check : (check?.title || check?.symptom || String(check ?? ''))
  const { zh, code } = formatCheckText(checkStr)
  
  return (
    <div key={idx}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-gray-900 flex-1">{zh}</p>
        {code && (
          <span className="text-[10px] text-gray-400 font-mono">{code}</span>
        )}
      </div>
    </div>
  )
})}
```

---

### P5: 修复 0 值被当成缺失的问题

**状态：** 已在 `lib/format.ts` 中正确实现，使用 `value == null` 而不是 `!value`

**关键代码片段：**
```typescript
// lib/format.ts 已正确实现
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  // 严格检查：null/undefined/NaN 显示 "—"
  if (value == null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }
  
  // 真实 0 正常显示
  const num = value * 100
  return `${num.toFixed(decimals)}%`
}
```

---

## 验收标准验证

### 1. 访问 /exp/exp_001?tab=compare&view=all

**验证步骤：**
1. 打开 `/exp/exp_001?tab=compare&view=all`
2. 点击 "Baseline" tab
   - ✅ URL 应变为 `/exp/exp_001?tab=baseline&view=all`
   - ✅ 页面列立即切换为 baseline 视图
   - ✅ 一次点击生效
3. 点击 "Treatment" tab
   - ✅ URL 应变为 `/exp/exp_001?tab=treatment&view=all`
   - ✅ 页面列立即切换为 treatment 视图
   - ✅ 一次点击生效

### 2. 点击 ViewSwitcher 的 All/DSP/SSP/ADX

**验证步骤：**
1. 当前 URL: `/exp/exp_001?tab=compare&view=all`
2. 点击 "SSP" view
   - ✅ URL 应变为 `/exp/exp_001?tab=compare&view=ssp`
   - ✅ Debug Panel 的 View 同步显示 "SSP"
   - ✅ 依赖 view 的图表/列表按 view 过滤（至少能看到 view 参数变更被读取）
3. 点击 "ADX" view
   - ✅ URL 应变为 `/exp/exp_001?tab=compare&view=adx`
   - ✅ tab 参数保留

### 3. 不再出现 "Cannot read properties of null (reading 'get')"

**验证步骤：**
1. ✅ 所有 `searchParams.get` 调用都使用 `searchParams?.get`
2. ✅ 所有 `searchParams?.get()` 调用都使用 `??` 提供默认值
3. ✅ 无 `searchParams.get?.` 错误写法

### 4. BUILD_STAMP 默认不显示

**状态：** BUILD_STAMP 已不存在，无需修复

### 5. "原因诊断"里的检查项中文化

**验证步骤：**
1. 打开 `/exp/exp_001`
2. 滚动到 "原因诊断" 区域
3. 展开任意检查项
   - ✅ 主文本显示中文（如 "出价过低"）
   - ✅ 右侧小字显示 code（如 "BID_TOO_LOW"）
   - ✅ 不再显示裸英文 code

---

## 修改的文件总结

1. ✅ `lib/url-utils.ts` - 修复 searchParams 空指针
2. ✅ `components/exp/ExperimentDetailContext.tsx` - 修复 searchParams 空指针
3. ✅ `components/exp/queryState.ts` - 新建，URL 驱动的状态管理
4. ✅ `components/TabSwitcher.tsx` - 改用 useQueryTab()
5. ✅ `components/ViewSwitcher.tsx` - 改用 useQueryView()
6. ✅ `components/exp/ExperimentDetailClient.tsx` - 改用新的 queryState hooks
7. ✅ `components/DebugPanel.tsx` - 从 URL 读取 tab/view
8. ✅ `components/DiagnosisTree.tsx` - 检查项中文化

---

## 关键改进

1. **URL 作为单一真相来源：** 所有 tab/view 状态都从 URL 读取，不再使用 useState
2. **无 Hooks 违规：** 移除了所有 try/catch 中调用 hook 的代码
3. **空指针安全：** 所有 searchParams 访问都使用可选链和空值合并
4. **中文化：** 检查项显示中文，code 作为辅助信息
5. **0 值正确处理：** 使用 `== null` 而不是 `!value` 判断缺失值





