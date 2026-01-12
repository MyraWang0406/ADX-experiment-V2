'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export type Tab = 'compare' | 'baseline' | 'treatment'
export type View = 'all' | 'dsp' | 'ssp' | 'adx'

/**
 * Hook to read and update tab query parameter
 */
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

/**
 * Hook to read and update view query parameter
 */
export function useQueryView(): { view: View; setView: (view: View) => void } {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 读取：从 URL 读取，统一转小写，校验非法值则回退默认
  const viewParam = searchParams?.get('view')?.toLowerCase()
  const view: View =
    viewParam === 'all' || viewParam === 'dsp' || viewParam === 'ssp' || viewParam === 'adx'
      ? viewParam
      : 'all'

  // 写入：更新 URL，保留其他参数
  const setView = useCallback(
    (nextView: View) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      params.set('view', nextView)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return { view, setView }
}

