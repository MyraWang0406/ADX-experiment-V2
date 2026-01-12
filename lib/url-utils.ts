/**
 * URL 参数管理工具
 * 用于统一管理 tab 和 view 参数，确保它们互不冲突
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { ReadonlyURLSearchParams } from 'next/navigation'

export type DetailTab = 'compare' | 'baseline' | 'treatment'
export type ViewFilter = 'all' | 'dsp' | 'ssp' | 'adx'

/**
 * 更新 URL 查询参数，保留其他参数
 */
export function setQueryParam(
  router: AppRouterInstance,
  searchParams: ReadonlyURLSearchParams | null,
  key: string,
  value: string
): void {
  const params = new URLSearchParams(searchParams?.toString() || '')
  params.set(key, value)
  router.replace(`?${params.toString()}`, { scroll: false })
}

/**
 * 更新多个 URL 查询参数，保留其他参数
 */
export function setQueryParams(
  router: AppRouterInstance,
  searchParams: ReadonlyURLSearchParams | null,
  updates: Record<string, string>
): void {
  const params = new URLSearchParams(searchParams?.toString() || '')
  Object.entries(updates).forEach(([key, value]) => {
    params.set(key, value)
  })
  router.replace(`?${params.toString()}`, { scroll: false })
}

/**
 * 从 URL 读取 tab 参数
 */
export function getTabFromURL(searchParams: ReadonlyURLSearchParams | null): DetailTab {
  if (!searchParams) return 'compare'
  const tab = searchParams?.get('tab')
  if (tab === 'compare' || tab === 'baseline' || tab === 'treatment') {
    return tab
  }
  return 'compare'
}

/**
 * 从 URL 读取 view 参数
 */
export function getViewFromURL(searchParams: ReadonlyURLSearchParams | null): ViewFilter {
  if (!searchParams) return 'all'
  const view = searchParams?.get('view')?.toLowerCase()
  if (view === 'all' || view === 'dsp' || view === 'ssp' || view === 'adx') {
    return view
  }
  return 'all'
}


