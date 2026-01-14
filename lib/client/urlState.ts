'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

/**
 * 解析 tab 参数，返回合法的 Tab 类型
 */
export function parseTab(str: string | null | undefined): 'compare' | 'baseline' | 'treatment' {
  if (str === 'compare' || str === 'baseline' || str === 'treatment') {
    return str
  }
  return 'compare'
}

/**
 * 解析 view 参数，URL 允许 all/dsp/ssp/adx（小写），返回显示用的 ViewFilterType
 */
export function parseView(str: string | null | undefined): 'All' | 'DSP' | 'SSP' | 'ADX' {
  const lower = str?.toLowerCase()
  if (lower === 'dsp') return 'DSP'
  if (lower === 'ssp') return 'SSP'
  if (lower === 'adx') return 'ADX'
  return 'All'
}

/**
 * 设置 URL 查询参数，保留其他参数
 */
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







