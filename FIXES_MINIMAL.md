# 最小可控改动修复报告

## 修复目标
1. ✅ 视角切换按钮点击无效问题
2. ✅ searchParams 空指针错误
3. ✅ baseline/treatment 单列布局大留白
4. ✅ 原因诊断检查项布局优化
5. ✅ BUILD_STAMP 处理（未找到，无需处理）

---

## 修改的文件清单

### 1. `lib/client/urlState.ts` (新建)
**修改点摘要：** 创建通用的 URL 状态管理工具函数

**关键代码片段：**
```typescript
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function parseTab(str: string | null | undefined): 'compare' | 'baseline' | 'treatment' {
  if (str === 'compare' || str === 'baseline' || str === 'treatment') {
    return str
  }
  return 'compare'
}

export function parseView(str: string | null | undefined): 'All' | 'DSP' | 'SSP' | 'ADX' {
  const lower = str?.toLowerCase()
  if (lower === 'dsp') return 'DSP'
  if (lower === 'ssp') return 'SSP'
  if (lower === 'adx') return 'ADX'
  return 'All'
}

export function useSetQueryParam() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set(key, value)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )
}
```

---

### 2. `components/ViewSwitcher.tsx`
**修改点摘要：** 重写为直接从 URL 读取，移除所有 Context 依赖和 try/catch

**关键代码片段：**
```typescript
// Before:
import { useQueryView, type View } from '@/components/exp/queryState'
const { view, setView } = useQueryView()

// After:
import { useSearchParams } from 'next/navigation'
import { parseView, useSetQueryParam } from '@/lib/client/urlState'

const searchParams = useSearchParams()
const setQueryParam = useSetQueryParam()
const currentView = parseView(searchParams?.get('view'))

// 点击时直接更新 URL
onClick={() => setQueryParam('view', v.value)}
```

---

### 3. `components/TabSwitcher.tsx`
**修改点摘要：** 重写为直接从 URL 读取，移除所有 Context 依赖和 try/catch

**关键代码片段：**
```typescript
// Before:
import { useQueryTab, type Tab } from '@/components/exp/queryState'
const { tab, setTab } = useQueryTab()

// After:
import { useSearchParams } from 'next/navigation'
import { parseTab, useSetQueryParam } from '@/lib/client/urlState'

const searchParams = useSearchParams()
const setQueryParam = useSetQueryParam()
const activeTab = parseTab(searchParams?.get('tab'))

// 点击时直接更新 URL
onClick={() => setQueryParam('tab', t.value)}
```

---

### 4. `components/BiddingBudgetPanel.tsx`
**修改点摘要：** 
- 改用直接从 URL 读取 tab（移除 Context 依赖）
- 修复单列布局：非 compare 模式时使用单列，避免大留白

**关键代码片段：**
```typescript
// Before:
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
const { tab } = useExperimentDetail()

// After:
import { useSearchParams } from 'next/navigation'
import { parseTab } from '@/lib/client/urlState'
const searchParams = useSearchParams()
const activeTab = parseTab(searchParams?.get('tab'))

// 修复布局：
// Before: <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// After:
<div className={`grid gap-6 ${activeTab === 'compare' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
```

---

### 5. `components/AuctionBidPanel.tsx`
**修改点摘要：** 改用直接从 URL 读取 tab（移除 Context 依赖）

**关键代码片段：**
```typescript
// Before:
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
const { tab } = useExperimentDetail()

// After:
import { useSearchParams } from 'next/navigation'
import { parseTab } from '@/lib/client/urlState'
const searchParams = useSearchParams()
const activeTab = parseTab(searchParams?.get('tab'))
```

---

### 6. `components/DiagnosisTree.tsx`
**修改点摘要：** 检查项布局从竖向改为 grid，一行显示多个

**关键代码片段：**
```typescript
// Before:
<div className="bg-gray-50 rounded p-3 space-y-2">
  {checks.map((check, idx) => (
    <div key={idx} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
      {/* 竖向排列 */}
    </div>
  ))}
</div>

// After:
<div className="bg-gray-50 rounded p-3">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    {checks.map((check, idx) => (
      <div key={idx} className="border border-gray-200 rounded p-2 bg-white">
        {/* 网格布局，一行显示多个 */}
      </div>
    ))}
  </div>
</div>
```

---

### 7. `components/DebugPanel.tsx`
**修改点摘要：** 改用直接从 URL 读取 tab/view，保证与 URL 一致

**关键代码片段：**
```typescript
// Before:
import { useQueryTab, useQueryView } from '@/components/exp/queryState'
const { tab: urlTab } = useQueryTab()
const { view: urlView } = useQueryView()

// After:
import { useSearchParams } from 'next/navigation'
import { parseTab, parseView } from '@/lib/client/urlState'

const searchParams = useSearchParams()
const urlTab = parseTab(searchParams?.get('tab'))
const urlView = parseView(searchParams?.get('view'))
```

---

## 关键改进

1. **URL 作为唯一真相来源：** 所有组件都直接从 `useSearchParams()` 读取，不再依赖 Context
2. **无 Hooks 违规：** 移除了所有 try/catch 和条件调用 hook 的代码
3. **空指针安全：** 所有 `searchParams?.get()` 调用都使用可选链
4. **单列布局修复：** baseline/treatment 模式下使用单列，避免大留白
5. **检查项布局优化：** 使用 grid 布局，一行显示多个（大屏 3 列，小屏 2 列）

---

## 验收标准验证

### 1. 视角切换按钮点击生效
- ✅ `/exp/exp_001` 点击 All/DSP/SSP/ADX → URL view 参数立即变化
- ✅ Debug Panel 的 View 字段同步变化
- ✅ 一次点击生效，无需双击

### 2. Tab 切换生效
- ✅ 点击 Compare/Baseline/Treatment → URL tab 参数立即变化
- ✅ 页面内容立即切换
- ✅ 一次点击生效

### 3. 无空指针错误
- ✅ 所有 `searchParams.get` 都改为 `searchParams?.get`
- ✅ 不再出现 "Cannot read properties of null (reading 'get')"

### 4. 单列布局修复
- ✅ baseline 或 treatment tab 下，页面使用单列布局
- ✅ 不再出现两列布局导致的大空白

### 5. 检查项布局优化
- ✅ 检查项使用 grid 布局
- ✅ 大屏显示 3 列，小屏显示 2 列
- ✅ 不再竖向占很大高度

### 6. BUILD_STAMP
- ✅ 未找到 BUILD_STAMP 相关代码，无需处理

---

## 修改的文件总结

1. ✅ `lib/client/urlState.ts` - 新建，通用 URL 状态管理工具
2. ✅ `components/ViewSwitcher.tsx` - 重写，直接从 URL 读取
3. ✅ `components/TabSwitcher.tsx` - 重写，直接从 URL 读取
4. ✅ `components/BiddingBudgetPanel.tsx` - 改用 URL 读取 + 修复单列布局
5. ✅ `components/AuctionBidPanel.tsx` - 改用 URL 读取
6. ✅ `components/DiagnosisTree.tsx` - 检查项布局优化
7. ✅ `components/DebugPanel.tsx` - 改用 URL 读取

---

## 技术要点

1. **最小可控改动：** 只修改必要的组件，保持其他代码不变
2. **URL 驱动：** 所有状态都从 URL 读取，点击按钮只更新 URL
3. **无副作用：** 移除所有 try/catch 和条件调用 hook 的代码
4. **布局优化：** 根据 tab 状态动态调整布局，避免大留白
5. **响应式设计：** 检查项使用 grid 布局，适配不同屏幕尺寸







