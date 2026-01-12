'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AIReflection from '@/components/AIReflection'
import type { ExperimentData } from '@/lib/data-loader'
import { getNorthStar, getGuardrails, getBottleneck } from '@/lib/data-loader'
import { formatLift } from '@/lib/utils'

interface ExperimentHeaderProps {
  experiment: ExperimentData
}

export default function ExperimentHeader({ experiment }: ExperimentHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(true) // 默认收起
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // 【防 500】确保 window 对象存在（在 SSR 阶段不存在，但 useEffect 只在客户端执行）
    if (typeof window === 'undefined') return
    
    const handleScroll = () => {
      // 【防 500】双重检查 window.scrollY，避免 SSR 阶段访问
      if (typeof window !== 'undefined' && window.scrollY !== undefined) {
        const scrolled = window.scrollY > 100
        setIsScrolled(scrolled)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      // 【防 500】清理时也检查 window 是否存在
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  // 【防 500】使用 try-catch 包裹数据提取函数，避免访问不存在的字段导致异常
  let northStar: { name: string; baseline: number | null; treatment: number | null }
  let guardrails: Array<{ name: string; unit: string; baseline: number | null; treatment: number | null }>
  let bottleneck: { stage?: string; node?: string; symptom?: string; note?: string; impact?: string } | null
  let uplift: string
  try {
    northStar = getNorthStar(experiment)
    guardrails = getGuardrails(experiment)
    bottleneck = getBottleneck(experiment)
    uplift = formatLift(northStar?.baseline ?? null, northStar?.treatment ?? null)
  } catch (error) {
    // 【防 500】数据提取失败时使用 fallback 值，避免组件崩溃
    console.warn('Failed to extract experiment data:', error)
    northStar = { name: '未知', baseline: null, treatment: null }
    guardrails = []
    bottleneck = null
    uplift = '—'
  }
  
  // 计算风险护栏数量
  // 【防御性】确保 g.name 是字符串后再调用 includes
  const riskGuardrails = guardrails.filter(g => {
    const name = typeof g?.name === 'string' ? g.name : String(g?.name ?? '')
    // 【修复】添加 null 检查，避免对 null 值进行数值比较
    if (g.baseline == null || g.treatment == null) return false
    if (name.includes('留存') && g.treatment < g.baseline * 0.95) return true
    if ((name.includes('早退') || name.includes('投诉')) && g.treatment > g.baseline * 1.05) return true
    return false
  })

  // 【防 500】安全地解析日期，避免无效日期导致异常
  let lastUpdated = '未知'
  try {
    if (experiment?.created_at) {
      const date = new Date(experiment.created_at)
      if (!isNaN(date.getTime())) {
        lastUpdated = date.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    }
  } catch (error) {
    // 【防 500】日期解析失败时使用 fallback
    console.warn('Failed to parse created_at:', error)
  }

  // 【防 500】使用可选链安全访问嵌套属性，提供 fallback
  const target = experiment?.kpi_framework?.north_star?.name || experiment?.title?.split('：')[0] || '视频播放量'

  if (isCollapsed) {
    // 折叠状态：一行显示关键信息（实验ID/标题/目标/提升/风险/卡点/更新时间）
    return (
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex-shrink-0"
              >
                ←
              </Link>
              {/* 【防 500】使用可选链和 fallback，确保 experiment_id 和 title 存在 */}
              <span className="text-xs sm:text-sm text-gray-500 font-mono flex-shrink-0">{experiment?.experiment_id || '未知'}</span>
              <span className="text-gray-300 flex-shrink-0">|</span>
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate flex-shrink-0">
                {experiment?.title || '未知实验'}
              </h1>
              <span className="text-gray-300 flex-shrink-0">|</span>
              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">目标:</span>
              <span className="text-xs sm:text-sm text-gray-900 flex-shrink-0">{target}</span>
              <span className="text-gray-300 flex-shrink-0">|</span>
              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">提升:</span>
              <span className={`text-xs sm:text-sm font-semibold flex-shrink-0 ${
                uplift.startsWith('+') ? 'text-blue-600' : 
                uplift.startsWith('-') ? 'text-red-600' : 
                'text-gray-400'
              }`}>{uplift}</span>
              {riskGuardrails.length > 0 && (
                <>
                  <span className="text-gray-300 flex-shrink-0">|</span>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs flex-shrink-0">
                    风险:{riskGuardrails.length}
                  </span>
                </>
              )}
              {bottleneck && (
                <>
                  <span className="text-gray-300 flex-shrink-0">|</span>
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs flex-shrink-0">
                    卡点:{bottleneck.stage || bottleneck.node || '未知'}
                  </span>
                </>
              )}
              <span className="text-gray-300 flex-shrink-0">|</span>
              <span className="text-xs text-gray-500 flex-shrink-0">{lastUpdated}</span>
            </div>
            <button
              onClick={() => setIsCollapsed(false)}
              className="ml-2 text-gray-600 hover:text-gray-900 text-xs sm:text-sm flex-shrink-0"
            >
              展开
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 展开状态：完整显示
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <Link
              href="/"
              className="inline-block mb-2 text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
            >
              ← 返回实验列表
            </Link>
            {/* 【防 500】使用可选链和 fallback，确保所有字段安全访问 */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {experiment?.experiment_id || '未知'}: {experiment?.title || '未知实验'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">{experiment?.narrative || ''}</p>
            <div className="text-xs sm:text-sm text-gray-500">
              {/* 【防 500】安全解析日期 */}
              <p>创建时间: {(() => {
                try {
                  if (experiment?.created_at) {
                    const date = new Date(experiment.created_at)
                    if (!isNaN(date.getTime())) {
                      return date.toLocaleString('zh-CN')
                    }
                  }
                } catch (e) {}
                return '未知'
              })()}</p>
              <p>主要用户群: {experiment?.primary_segment?.name || '未知'}</p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
            <AIReflection experimentData={experiment} />
          </div>
        </div>
        {!isCollapsed && (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              收起
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

