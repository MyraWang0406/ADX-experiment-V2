'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseTab, useSetQueryParam } from '@/lib/client/urlState'

const ViewContext = createContext<'compare' | 'baseline' | 'treatment'>('compare')

export function useView() {
  const context = useContext(ViewContext)
  // 如果没有 provider，返回稳定的默认值（不要 throw，不要 try/catch）
  return context || 'compare'
}

interface TabSwitcherProps {
  children: React.ReactNode
}

export default function TabSwitcher({ children }: TabSwitcherProps) {
  // 【最小可控改动】直接从 URL 读取，不使用任何 Context 或 try/catch
  const searchParams = useSearchParams()
  const setQueryParam = useSetQueryParam()
  
  // 从 URL 读取 tab 参数
  const activeTab = parseTab(searchParams?.get('tab'))

  const tabs: Array<{ value: 'compare' | 'baseline' | 'treatment'; label: string }> = [
    { value: 'compare', label: '对比（Compare）' },
    { value: 'baseline', label: '基线（Baseline）' },
    { value: 'treatment', label: '实验组（Treatment）' },
  ]

  return (
    <ViewContext.Provider value={activeTab}>
      <div className="relative bg-white">
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setQueryParam('tab', t.value)
              }}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === t.value
                  ? t.value === 'compare' 
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : t.value === 'baseline'
                    ? 'text-blue-700 border-b-2 border-blue-700'
                    : 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {children}
      </div>
    </ViewContext.Provider>
  )
}
