'use client'

import { createContext, useContext, useCallback, ReactNode } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// 定义类型
export type Tab = 'compare' | 'baseline' | 'treatment'
export type View = 'all' | 'dsp' | 'ssp' | 'adx'

interface ExperimentDetailContextType {
  tab: Tab
  view: View
  setTab: (tab: Tab) => void
  setView: (view: View) => void
}

const ExperimentDetailContext = createContext<ExperimentDetailContextType | null>(null)

export function ExperimentDetailProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // 从 URL 读取，作为单一真相来源（修复空指针）
  const tabParam = searchParams?.get('tab') ?? 'compare'
  const viewParam = searchParams?.get('view')?.toLowerCase() ?? 'all'
  
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
    // 保留 view 参数
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])
  
  const setView = useCallback((nextView: View) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('view', nextView)
    // 保留 tab 参数
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])
  
  return (
    <ExperimentDetailContext.Provider value={{ tab, view, setTab, setView }}>
      {children}
    </ExperimentDetailContext.Provider>
  )
}

export function useExperimentDetail() {
  const context = useContext(ExperimentDetailContext)
  // 如果没有 provider，返回稳定的默认值（不要 throw，不要 try/catch）
  if (!context) {
    return {
      tab: 'compare' as Tab,
      view: 'all' as View,
      setTab: () => {},
      setView: () => {},
    }
  }
  return context
}

