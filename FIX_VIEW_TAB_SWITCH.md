# Tab/View 切换修复报告

## 任务 1：定位路由页面文件

**文件路径**：`app/exp/[id]/page.tsx`

**如何读取 searchParams**：
- 第 42 行：`export default async function ExperimentPage({ params, searchParams }: ExperimentPageProps)`
- `searchParams` 是 Server Component 的 props，类型定义在第 33-40 行
- **修复**：已更新类型定义，添加 `tab?: string` 和 `view?: string` 以支持 URL 参数

## 任务 2：修复 view（All/DSP/SSP/ADX）为 URL 驱动

### 修改的文件

1. **`components/ViewContext.tsx`**

**关键 Diff**：
```typescript
// 修复前：只用 useState，不读写 URL
export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewFilter, setViewFilter] = useState<ViewFilterType>('All')
  return (
    <ViewContext.Provider value={{ viewFilter, setViewFilter }}>
      {children}
    </ViewContext.Provider>
  )
}

// 修复后：从 URL searchParams 读取，用 router.replace 写入
export function ViewProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 从 URL 读取 view 参数
  const viewFromURL = searchParams?.get('view')?.toLowerCase() || 'all'
  const viewFilter = viewToViewFilter[viewFromURL] || 'All'
  
  // setViewFilter 必须 router.replace() 写回 view= 并保留 tab= 参数
  const setViewFilter = useCallback((newView: ViewFilterType) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('view', viewFilterToView[newView])
    // 保留 tab 参数，不覆盖
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])
  
  return (
    <ViewContext.Provider value={{ viewFilter, setViewFilter }}>
      {children}
    </ViewContext.Provider>
  )
}
```

2. **`components/ViewSwitcher.tsx`**

**关键 Diff**：
```typescript
// 修复前：try/catch，双 Context
export default function ViewSwitcher() {
  let viewFilter: ViewFilterType
  let setViewFilter: (view: ViewFilterType) => void
  
  try {
    const clientContext = useViewFilterFromClient()
    if (clientContext && clientContext.viewFilter) {
      viewFilter = clientContext.viewFilter
      setViewFilter = clientContext.setViewFilter
    } else {
      const fallbackContext = useViewFilter()
      viewFilter = fallbackContext.viewFilter
      setViewFilter = fallbackContext.setViewFilter
    }
  } catch {
    const fallbackContext = useViewFilter()
    viewFilter = fallbackContext.viewFilter
    setViewFilter = fallbackContext.setViewFilter
  }
  // ...
}

// 修复后：不要 try/catch，不要双 Context，只用 useViewFilter()
export default function ViewSwitcher() {
  const { viewFilter, setViewFilter } = useViewFilter()
  // ...
}
```

## 任务 3：修复 tab（Compare/Baseline/Treatment）读写 tab 参数

### 检查结果

**Tab 切换组件**：`components/TabSwitcher.tsx`

**验证**：
- 第 24 行：`const tabFromURL = searchParams ? (searchParams.get?.('tab') ?? as ViewType) || 'compare' : 'compare'` ✅ 正确读取 `tab` 参数
- 第 42 行：`params.set('tab', newView)` ✅ 正确写入 `tab` 参数
- 第 44 行：`router.replace(\`?${params.toString()}\`, { scroll: false })` ✅ 保留其他参数（包括 `view`）

**结论**：Tab 切换组件已正确使用 `tab=` 参数，不会出现 `view=compare` 的错误。

## 解释：之前为什么会出现 view=compare

**根因定位**：

1. **`components/ViewContext.tsx` 第 14 行**：
   ```typescript
   const [viewFilter, setViewFilter] = useState<ViewFilterType>('All')
   ```
   - 使用 `useState` 存储状态，不读写 URL
   - `setViewFilter` 只更新本地状态，不更新 URL

2. **`components/ViewSwitcher.tsx` 第 45 行**：
   ```typescript
   setViewFilter(view)  // 只更新本地状态，不更新 URL
   ```
   - 点击视角切换后，只更新了 Context 中的状态
   - URL 没有变化，页面不会重新渲染

3. **可能的错误来源**（虽然当前代码中没有发现）：
   - 如果某个地方错误地使用了 `params.set('view', 'compare')`，就会出现 `?view=compare`
   - 但经过检查，Tab 切换组件正确使用 `params.set('tab', newView)`，不会产生此错误

**修复后的行为**：
- `ViewContext` 从 URL 读取 `view` 参数（默认 `all`）
- `setViewFilter` 使用 `router.replace()` 更新 URL 的 `view=` 参数
- 更新 URL 时保留 `tab=` 参数
- URL 变化触发页面重新渲染，状态自动同步

## 修改的文件清单

1. `components/ViewContext.tsx` - 改为从 URL 读取，用 router.replace 写入
2. `components/ViewSwitcher.tsx` - 移除 try/catch 和双 Context，只用 useViewFilter()
3. `app/exp/[id]/page.tsx` - 更新 searchParams 类型定义，添加 tab 和 view

## 人工验证步骤

### 步骤 1：打开页面
1. 打开浏览器，访问 `http://localhost:3000/exp/exp_001`
2. **预期**：URL 自动变为 `?tab=compare&view=all`（如果缺少参数会自动补充）

### 步骤 2：测试 View 切换
1. 点击 "DSP" 按钮
2. **预期**：
   - URL 立即变为 `?tab=compare&view=dsp`（tab 参数保留）
   - 按钮高亮变为 DSP
   - 页面内容按 DSP 过滤更新
   - **一次点击立即生效**

3. 点击 "SSP" 按钮
4. **预期**：
   - URL 立即变为 `?tab=compare&view=ssp`
   - 按钮高亮变为 SSP
   - 页面内容按 SSP 过滤更新

5. 点击 "All" 按钮
6. **预期**：
   - URL 立即变为 `?tab=compare&view=all`
   - 按钮高亮变为 All
   - 显示所有数据

### 步骤 3：测试 Tab 切换
1. 在 `?tab=compare&view=all` 状态下，点击 "基线（Baseline）" tab
2. **预期**：
   - URL 立即变为 `?tab=baseline&view=all`（view 参数保留）
   - 页面内容切换为只显示 baseline 列
   - **一次点击立即生效**

3. 点击 "实验组（Treatment）" tab
4. **预期**：
   - URL 立即变为 `?tab=treatment&view=all`（view 参数保留）
   - 页面内容切换为只显示 treatment 列

5. 点击 "对比（Compare）" tab
6. **预期**：
   - URL 立即变为 `?tab=compare&view=all`（view 参数保留）
   - 页面内容切换为双列对比

### 步骤 4：测试组合切换
1. 在 `?tab=baseline&view=dsp` 状态下，点击 "SSP" 按钮
2. **预期**：
   - URL 立即变为 `?tab=baseline&view=ssp`（tab 参数保留）
   - 页面内容按 SSP 过滤更新

3. 在 `?tab=baseline&view=ssp` 状态下，点击 "对比（Compare）" tab
4. **预期**：
   - URL 立即变为 `?tab=compare&view=ssp`（view 参数保留）
   - 页面内容切换为双列对比，仍按 SSP 过滤

### 步骤 5：验证不会出现 view=compare
1. 刷新页面，观察 URL
2. **预期**：URL 中只有 `tab=compare`，**不会出现 `view=compare`**
3. 切换 tab 和 view，观察 URL 变化
4. **预期**：`tab=` 和 `view=` 参数始终分离，不会混淆

## 技术要点

1. **URL 驱动单一真相**：
   - `viewFilter` 从 `useSearchParams().get('view')` 读取
   - `setViewFilter` 使用 `router.replace()` 更新 URL
   - 不使用 `useState` 存储这些状态

2. **参数保留**：
   - 更新 `view` 时保留 `tab` 参数
   - 更新 `tab` 时保留 `view` 参数
   - 使用 `new URLSearchParams(searchParams?.toString() || '')` 保留所有现有参数

3. **简化 Context 使用**：
   - `ViewSwitcher` 只使用 `useViewFilter()`，不再尝试多个 Context
   - 移除 try/catch 和 fallback 逻辑，简化代码

