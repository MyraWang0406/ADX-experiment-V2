'use client'

import { nodeNames } from '@/lib/translations'
import Term from '@/components/Term'
import EmptyState from '@/components/EmptyState'
import { ensureObject, ensureArray } from '@/lib/utils-safe'

interface PipelineMapProps {
  data?: {
    latency_ms?: {
      baseline?: Record<string, number>
      treatment?: Record<string, number>
    }
    funnel?: {
      baseline?: Record<string, number>
      treatment?: Record<string, number>
    }
    bottlenecks?: Array<{
      stage?: string
      node?: string
      type?: string
      symptom?: string
      impact?: string
      note?: string
    }>
  }
  narrative?: string
  processKpis?: Array<{
    stage: string
    name: string
    baseline: number
    treatment: number
  }>
}

const nodes = ['recall', 'coarse', 'fine', 'rerank', 'auction']
const stageToFunnelKey: Record<string, string> = {
  recall: 'after_recall',
  coarse: 'after_coarse',
  fine: 'after_fine',
  rerank: 'final',
  auction: 'final',
}

export default function PipelineMap({ data, narrative, processKpis }: PipelineMapProps) {
  // 【强容错】确保所有数据都存在
  const safeData = ensureObject(data)
  const bottlenecks = ensureArray(safeData.bottlenecks)
  const bottleneckStages = new Set(bottlenecks.map(b => b.stage || b.node || '').filter(Boolean))
  const narrativeFirstLine = narrative?.split('。')[0] || narrative?.substring(0, 50) || ''

  // 【强容错】如果 latency_ms 缺失，显示 EmptyState
  const latencyMs = safeData.latency_ms
  if (!latencyMs || !latencyMs.baseline || !latencyMs.treatment) {
    return (
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pipeline 流程图</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">{narrativeFirstLine}</p>
        <EmptyState title="暂无 latency 数据" message="pipeline.latency_ms 字段缺失" />
      </div>
    )
  }

  // 获取 throughput（候选数）
  const getThroughput = (node: string) => {
    const funnelKey = stageToFunnelKey[node]
    if (!funnelKey) return null
    
    const funnel = ensureObject(safeData.funnel, { baseline: {}, treatment: {} })
    const baseline = ensureObject(funnel.baseline)
    const treatment = ensureObject(funnel.treatment)
    return {
      baseline: baseline[funnelKey] ?? 0,
      treatment: treatment[funnelKey] ?? 0,
    }
  }

  // 获取 process_kpis 中的 throughput
  const getProcessKpi = (node: string) => {
    return ensureArray(processKpis).find(kpi => kpi.stage === node)
  }

  // 生成可解释文案
  const getExplanation = (node: string) => {
    const bottleneck = bottlenecks.find(b => (b.stage || b.node) === node)
    if (bottleneck) {
      if (bottleneck.symptom) {
        return `${bottleneck.symptom}；${bottleneck.impact || ''}`
      }
      if (bottleneck.note) {
        return bottleneck.note
      }
    }
    return null
  }

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pipeline 流程图</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">{narrativeFirstLine}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 py-4 sm:py-6 lg:py-8">
        {nodes.map((node, index) => {
          const stage = node
          const isBottleneck = bottleneckStages.has(stage)
          // 【强容错】安全访问 latency_ms
          const baselineLatency = ensureObject(latencyMs.baseline)[node] ?? 0
          const treatmentLatency = ensureObject(latencyMs.treatment)[node] ?? 0
          const bottleneck = bottlenecks.find(b => (b.stage || b.node) === stage)
          const nodeName = nodeNames[node] || node
          
          // 获取 throughput
          const throughput = getThroughput(node)
          const processKpi = getProcessKpi(node)
          const explanation = getExplanation(node)
          
          return (
            <div key={node} className="flex items-center gap-2 sm:gap-4 lg:gap-8">
              <div className="text-center relative">
                <div
                  className={`px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 rounded-xl font-semibold min-w-[120px] sm:min-w-[140px] lg:min-w-[160px] ${
                    isBottleneck
                      ? 'bg-red-50 border-4 border-red-500 text-red-800 shadow-lg'
                      : 'bg-blue-50 border-2 border-blue-300 text-blue-800'
                  }`}
                >
                  <div className="text-sm sm:text-base font-bold mb-1 sm:mb-2">
                    <Term labelKey={node} type="pipeline">{nodeName}</Term>
                  </div>
                  <div className="text-xs space-y-0.5 sm:space-y-1">
                    <div>延迟: {baselineLatency}ms → {treatmentLatency}ms</div>
                    {(throughput || processKpi) && (
                      <div className="text-blue-600 font-medium">
                        候选数: {
                          processKpi 
                            ? `${processKpi.baseline ?? 0} → ${processKpi.treatment ?? 0}`
                            : throughput
                            ? `${throughput.baseline ?? 0} → ${throughput.treatment ?? 0}`
                            : 'N/A'
                        }
                      </div>
                    )}
                  </div>
                </div>
                {explanation && (
                  <div className="mt-2 sm:mt-3 px-2 sm:px-3 py-1 sm:py-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-700 max-w-[160px] sm:max-w-[180px] mx-auto">
                    {explanation}
                  </div>
                )}
              </div>
              {index < nodes.length - 1 && (
                <div className="flex-shrink-0 hidden sm:block">
                  <svg width="30" height="4" className="text-gray-400 sm:w-10">
                    <line x1="0" y1="2" x2="30" y2="2" stroke="currentColor" strokeWidth="2" />
                    <polygon points="25,0 30,2 25,4" fill="currentColor" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
