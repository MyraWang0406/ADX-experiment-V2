'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type ViewFilterType = 'All' | 'DSP' | 'SSP' | 'ADX'

interface ViewContextType {
  viewFilter: ViewFilterType
  setViewFilter: (view: ViewFilterType) => void
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

// ViewFilter 与 URL view 参数的映射
const viewFilterToView: Record<ViewFilterType, string> = {
  'All': 'all',
  'DSP': 'dsp',
  'SSP': 'ssp',
  'ADX': 'adx',
}

const viewToViewFilter: Record<string, ViewFilterType> = {
  'all': 'All',
  'dsp': 'DSP',
  'ssp': 'SSP',
  'adx': 'ADX',
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 【修复】从 URL searchParams 读取 view 参数，作为单一真相来源
  const viewFromURL = searchParams?.get('view')?.toLowerCase() || 'all'
  const viewFilter = viewToViewFilter[viewFromURL] || 'All'
  
  // 【修复】setViewFilter 必须 router.replace() 写回 view= 并保留 tab= 参数
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

export function useViewFilter() {
  const context = useContext(ViewContext)
  if (!context) {
    return { viewFilter: 'All' as ViewFilterType, setViewFilter: () => {} }
  }
  return context
}


