'use client'

import { useSearchParams } from 'next/navigation'
import { parseView, useSetQueryParam } from '@/lib/client/urlState'

export default function ViewSwitcher() {
  // 【最小可控改动】直接从 URL 读取，不使用任何 Context 或 try/catch
  const searchParams = useSearchParams()
  const setQueryParam = useSetQueryParam()
  
  // 从 URL 读取 view 参数
  const currentView = parseView(searchParams?.get('view'))
  
  // UI 显示选项
  const views: Array<{ label: 'All' | 'DSP' | 'SSP' | 'ADX'; value: string }> = [
    { label: 'All', value: 'all' },
    { label: 'DSP', value: 'dsp' },
    { label: 'SSP', value: 'ssp' },
    { label: 'ADX', value: 'adx' },
  ]
  
  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600 font-medium">视角切换：</span>
      <div className="flex gap-2">
        {views.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setQueryParam('view', v.value)
            }}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              currentView === v.label
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}

