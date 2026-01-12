'use client'

import { Suspense } from 'react'
import TabSwitcher from '@/components/TabSwitcher'
import DebugPanel from '@/components/DebugPanel'
import type { ExperimentData } from '@/lib/data-loader'
import { ExperimentDetailProvider } from './ExperimentDetailContext'
import { useQueryTab, useQueryView } from './queryState'

interface ExperimentDetailClientProps {
  data: ExperimentData
  children: React.ReactNode
  dataSource?: string
}

function ExperimentDetailClientInner({ data, children, dataSource }: ExperimentDetailClientProps) {
  // 【P1 修复】使用新的 queryState hooks，URL 作为唯一真相来源
  const { tab } = useQueryTab()
  const { view } = useQueryView()
  
  // ViewFilterType 用于 DebugPanel（兼容旧接口）
  const viewFilterType: 'All' | 'DSP' | 'SSP' | 'ADX' = 
    view === 'all' ? 'All' :
    view === 'dsp' ? 'DSP' :
    view === 'ssp' ? 'SSP' : 'ADX'

  return (
    <>
      <Suspense fallback={<div className="mb-4 border-b border-gray-200"><div className="px-4 py-2 text-gray-600">加载中...</div></div>}>
        <TabSwitcher>
          <div className="grid gap-4 sm:gap-6">
            {/* 内容区域 */}
            {children}
          </div>
        </TabSwitcher>
      </Suspense>
      <DebugPanel
        expId={data.experiment_id}
        experimentTitle={data.title}
        activeTab={tab}
        activeView={viewFilterType}
        dataSource={dataSource}
      />
    </>
  )
}

export default function ExperimentDetailClient(props: ExperimentDetailClientProps) {
  // 保留 ExperimentDetailProvider 以兼容其他组件
  return (
    <ExperimentDetailProvider>
      <ExperimentDetailClientInner {...props} />
    </ExperimentDetailProvider>
  )
}

// ViewSwitcher 组件 - 使用新的 queryState hooks
export function ViewSwitcherInClient() {
  const { view, setView } = useQueryView()
  
  // UI 显示文案用大写，但内部 value 一律小写
  const viewLabels: Record<'all' | 'dsp' | 'ssp' | 'adx', string> = {
    'all': 'All',
    'dsp': 'DSP',
    'ssp': 'SSP',
    'adx': 'ADX',
  }
  
  const views: ('all' | 'dsp' | 'ssp' | 'adx')[] = ['all', 'dsp', 'ssp', 'adx']
  
  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600 font-medium">视角切换：</span>
      <div className="flex gap-2">
        {views.map((v) => (
          <button
            key={v}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setView(v)
            }}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              view === v
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>
    </div>
  )
}

