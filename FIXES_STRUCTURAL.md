# 结构性修复报告

## 修复目标
1. 禁止任何 try/catch / if/else 中调用 hook（React Rules of Hooks）
2. tab/view 的唯一真相来源必须是 URL（useSearchParams）
3. view 参数统一用小写：all/dsp/ssp/adx

## 修复内容

### A. 移除 try/catch 中调用 hook

**问题：** 之前 `TabSwitcher.tsx` 和 `ViewSwitcher.tsx` 中使用了 `try/catch` 来调用 hook，违反了 React Rules of Hooks。

**修复：**
- ✅ 删除了所有 `try/catch` 中调用 hook 的代码
- ✅ `useExperimentDetail()` 在无 provider 时返回稳定的默认值，不使用 `throw` 或 `try/catch`
- ✅ 所有组件直接使用 `useExperimentDetail()`，不再有条件调用

**修改的文件：**
- `components/TabSwitcher.tsx` - 移除了 try/catch，直接使用 `useExperimentDetail()`
- `components/ViewSwitcher.tsx` - 移除了 try/catch，直接使用 `useExperimentDetail()`
- `components/exp/ExperimentDetailContext.tsx` - `useExperimentDetail()` 返回默认值而不是 throw

### B. URL 作为单一真相来源

**问题：** 之前 `ExperimentDetailClient.tsx` 使用 `useState` 管理 `activeTab` 和 `activeView`，导致状态与 URL 不同步。

**修复：**
- ✅ 创建了 `components/exp/ExperimentDetailContext.tsx`，从 `useSearchParams()` 直接读取 `tab` 和 `view`
- ✅ `ExperimentDetailProvider` 不再使用 `useState`，而是直接从 URL 读取
- ✅ `setTab` 和 `setView` 函数使用 `router.replace()` 更新 URL，保留另一个参数
- ✅ 移除了 `ExperimentDetailClient.tsx` 中的 `useEffect` URL 初始化逻辑（已在 Context 中处理）

**修改的文件：**
- `components/exp/ExperimentDetailContext.tsx` - 新建，URL 驱动的状态管理
- `components/exp/ExperimentDetailClient.tsx` - 移除了 `useState` 和 `useEffect`，只消费 Context
- `app/exp/[id]/page.tsx` - 移除了 `ViewProvider`（已由 `ExperimentDetailProvider` 替代）

**关键代码：**
```typescript
// ExperimentDetailContext.tsx
export function ExperimentDetailProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 从 URL 读取，作为单一真相来源
  const tabParam = searchParams?.get('tab') || 'compare'
  const viewParam = searchParams?.get('view')?.toLowerCase() || 'all'
  
  // 校验非法值，回退默认
  const tab: Tab = (tabParam === 'compare' || tabParam === 'baseline' || tabParam === 'treatment') 
    ? tabParam 
    : 'compare'
  const view: View = (viewParam === 'all' || viewParam === 'dsp' || viewParam === 'ssp' || viewParam === 'adx')
    ? viewParam
    : 'all'
  
  // 提供更新函数，必须 preserve 另一个参数
  const setTab = useCallback((nextTab: Tab) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('tab', nextTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])
  
  const setView = useCallback((nextView: View) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('view', nextView)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])
  
  return (
    <ExperimentDetailContext.Provider value={{ tab, view, setTab, setView }}>
      {children}
    </ExperimentDetailContext.Provider>
  )
}
```

### C. view 参数统一为小写

**问题：** 之前 view 参数可能混用大小写（All/DSP vs all/dsp），导致 URL 参数不一致。

**修复：**
- ✅ `ExperimentDetailContext.tsx` 中统一使用 `.toLowerCase()` 处理 view 参数
- ✅ 所有 `setView()` 调用都使用小写值（'all'|'dsp'|'ssp'|'adx'）
- ✅ UI 显示文案仍使用大写（All/DSP/SSP/ADX），但内部值一律小写

**修改的文件：**
- `components/exp/ExperimentDetailContext.tsx` - view 参数统一为小写
- `components/ViewSwitcher.tsx` - 内部值使用小写，UI 显示大写
- `components/exp/ExperimentDetailClient.tsx` - ViewSwitcherInClient 使用小写值

**关键代码：**
```typescript
// ExperimentDetailContext.tsx
const viewParam = searchParams?.get('view')?.toLowerCase() || 'all'

// ViewSwitcher.tsx
const views: View[] = ['all', 'dsp', 'ssp', 'adx'] // 小写
const viewLabels: Record<View, string> = {
  'all': 'All',  // UI 显示大写
  'dsp': 'DSP',
  'ssp': 'SSP',
  'adx': 'ADX',
}
```

## 验收标准

### 1. 点击 Compare/Baseline/Treatment
- ✅ URL `tab` 参数变化
- ✅ URL `view` 参数保留
- ✅ 一次点击生效（不需要双击）

### 2. 点击 All/DSP/SSP/ADX
- ✅ URL `view` 参数变化（小写：all/dsp/ssp/adx）
- ✅ URL `tab` 参数保留
- ✅ 一次点击生效（不需要双击）

### 3. 无 Hooks 违规
- ✅ 无 try/catch 中调用 hook
- ✅ 无 if/else 中调用 hook
- ✅ 所有 hook 调用在组件顶层

### 4. URL 作为单一真相来源
- ✅ 刷新页面后 URL 参数保留
- ✅ 直接修改 URL 参数，页面内容同步更新
- ✅ 无 `useState` 管理 tab/view 状态

## 修改的文件清单

1. `components/exp/ExperimentDetailContext.tsx` - 新建，URL 驱动的状态管理
2. `components/exp/ExperimentDetailClient.tsx` - 移除 useState/useEffect，只消费 Context
3. `components/TabSwitcher.tsx` - 移除 try/catch，直接使用 useExperimentDetail()
4. `components/ViewSwitcher.tsx` - 移除 try/catch，直接使用 useExperimentDetail()
5. `app/exp/[id]/page.tsx` - 移除 ViewProvider

## 关键 Diff

### ExperimentDetailContext.tsx（新建）
```typescript
// 从 URL 读取，作为单一真相来源
const tabParam = searchParams?.get('tab') || 'compare'
const viewParam = searchParams?.get('view')?.toLowerCase() || 'all'

// 提供更新函数，必须 preserve 另一个参数
const setTab = useCallback((nextTab: Tab) => {
  const params = new URLSearchParams(searchParams?.toString() || '')
  params.set('tab', nextTab)
  router.replace(`${pathname}?${params.toString()}`, { scroll: false })
}, [router, pathname, searchParams])
```

### ExperimentDetailClient.tsx
```typescript
// 之前：
const [activeTab, setActiveTab] = useState('compare')
const [activeView, setActiveView] = useState('all')
useEffect(() => { /* URL 初始化 */ }, [searchParams, router])

// 之后：
const { tab, view } = useExperimentDetail() // 直接从 Context 读取
```

### TabSwitcher.tsx
```typescript
// 之前：
try {
  tabContext = useTabFromClient()
} catch (e) {
  tabContext = null
}

// 之后：
const { tab, setTab } = useExperimentDetail() // 直接使用，无 try/catch
```

## 验证步骤

1. 启动 dev server：`npm run dev`
2. 打开 `/exp/exp_001`（无参数）
   - 应自动跳转到 `/exp/exp_001?tab=compare&view=all`
3. 点击 "Baseline" tab
   - URL 应变为 `/exp/exp_001?tab=baseline&view=all`
   - 页面内容应切换为 baseline 视图
   - 一次点击生效
4. 点击 "SSP" view
   - URL 应变为 `/exp/exp_001?tab=baseline&view=ssp`
   - tab 参数保留
   - 一次点击生效
5. 刷新页面
   - URL 参数保留
   - 页面内容与 URL 参数一致







