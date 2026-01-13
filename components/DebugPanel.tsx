'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseTab, parseView } from '@/lib/client/urlState'

interface DebugPanelProps {
  expId?: string
  experimentTitle?: string
  experimentsCount?: number
  dataSource?: string
  activeTab?: string
  activeView?: string
}

export default function DebugPanel({
  expId,
  experimentTitle,
  experimentsCount,
  dataSource,
  activeTab: propActiveTab,
  activeView: propActiveView,
}: DebugPanelProps) {
  const [mounted, setMounted] = useState(false)

  const searchParams = useSearchParams()
  const urlTab = parseTab(searchParams?.get('tab'))
  const urlView = parseView(searchParams?.get('view'))

  const activeTab = urlTab || propActiveTab
  const activeView = urlView || propActiveView

  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ 只在开发环境显示（生产永远不渲染）
  if (process.env.NODE_ENV !== 'development' || !mounted) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div className="bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg max-w-xs border border-gray-700">
        <div className="font-bold mb-2 text-yellow-400">🐛 Debug Panel</div>
        <div className="space-y-1">
          <div>
            <span className="text-gray-400">Origin:</span>{' '}
            <span className="text-white font-mono">
              {typeof window !== 'undefined' ? window.location.origin : 'N/A'}
            </span>
          </div>
          {expId && (
            <div>
              <span className="text-gray-400">Exp ID:</span>{' '}
              <span className="text-white font-mono">{expId}</span>
            </div>
          )}
          {experimentTitle && (
            <div>
              <span className="text-gray-400">Title:</span>{' '}
              <span className="text-white truncate block">{experimentTitle}</span>
            </div>
          )}
          {experimentsCount !== undefined && (
            <div>
              <span className="text-gray-400">Experiments:</span>{' '}
              <span className="text-white">{experimentsCount}</span>
            </div>
          )}
          {activeTab && (
            <div>
              <span className="text-gray-400">Tab:</span>{' '}
              <span className="text-blue-400 font-mono">{activeTab}</span>
            </div>
          )}
          {activeView && (
            <div>
              <span className="text-gray-400">View:</span>{' '}
              <span className="text-green-400 font-mono">{activeView}</span>
            </div>
          )}
          {dataSource && (
            <div>
              <span className="text-gray-400">Data Source:</span>{' '}
              <span className="text-purple-400 font-mono text-[10px] break-all">{dataSource}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
