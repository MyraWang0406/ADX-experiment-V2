'use client'

import type { ExperimentData } from '@/lib/data-loader'
import { getNorthStar, getGuardrails, getBottleneck } from '@/lib/data-loader'
import { nodeNames } from '@/lib/translations'
import Term from '@/components/Term'
import { formatLift, canCalculateLift, safeFormatNumber } from '@/lib/utils'

interface DecisionSummaryProps {
  experiment: ExperimentData
}

export default function DecisionSummary({ experiment }: DecisionSummaryProps) {
  // 【防 500】使用 try-catch 包裹数据提取函数，避免访问不存在的字段导致异常
  let northStar: { name: string; baseline: number | null; treatment: number | null }
  let guardrails: Array<{ name: string; unit: string; baseline: number | null; treatment: number | null }>
  let bottleneck: { stage?: string; node?: string; symptom?: string; note?: string; impact?: string } | null
  let ceiling: any
  try {
    northStar = getNorthStar(experiment)
    guardrails = getGuardrails(experiment)
    bottleneck = getBottleneck(experiment)
    // 【修复】从多个可能的位置读取 ceiling_estimate
    ceiling = experiment?.ceiling_estimate || 
              (experiment as any)?._adx_v1?.ceiling_estimate ||
              (experiment as any)?.kpi_framework?.ceiling_estimate
  } catch (error) {
    // 【防 500】数据提取失败时使用 fallback 值，避免组件崩溃
    console.warn('DecisionSummary: Failed to extract experiment data:', error)
    northStar = { name: '未知', baseline: null, treatment: null }
    guardrails = []
    bottleneck = null
    ceiling = undefined
  }
  
  // 计算 uplift - 使用安全函数
  const uplift = formatLift(northStar.baseline, northStar.treatment)
  
  // 护栏风险评估（阈值可配置）
  const getGuardrailStatus = (item: typeof guardrails[0]): 'red' | 'yellow' | 'blue' => {
    const { name, baseline, treatment } = item
    // 【修复】添加 null 检查，避免对 null 值进行数值比较
    if (baseline == null || treatment == null) return 'blue'
    if (name.includes('留存')) {
      if (treatment < baseline * 0.95) return 'red'
      if (treatment < baseline * 0.98) return 'yellow'
      return 'blue'
    }
    if (name.includes('早退') || name.includes('投诉')) {
      if (treatment > baseline * 1.1) return 'red'
      if (treatment > baseline * 1.05) return 'yellow'
      return 'blue'
    }
    return 'blue'
  }
  
  const riskGuardrails = guardrails.filter(g => getGuardrailStatus(g) !== 'blue')
  
  // 卡点环节显示
  const bottleneckStageName = bottleneck ? (nodeNames[bottleneck.stage || bottleneck.node || ''] || bottleneck.stage || bottleneck.node || '未知') : '无'

  return (
    <div id="decision-summary" className="sticky top-0 z-40 bg-white border-b-2 border-blue-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">决策摘要</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 北极星 */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
              <Term labelKey="ad_vv" type="metric">北极星</Term>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">基线</span>
                <span className="text-sm font-semibold text-blue-400">{safeFormatNumber(northStar.baseline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">实验组</span>
                <span className="text-sm font-semibold text-blue-800">{safeFormatNumber(northStar.treatment)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                <span className="text-xs text-gray-500">提升</span>
                <span className={`text-sm font-bold ${
                  uplift.startsWith('+') ? 'text-blue-600' : 
                  uplift.startsWith('-') ? 'text-red-600' : 
                  'text-gray-400'
                }`} title={!canCalculateLift(northStar.baseline, northStar.treatment) ? '基线为0无法计算变化率' : ''}>
                  {uplift !== '—' ? (uplift.startsWith('+') ? '↑ ' : uplift.startsWith('-') ? '↓ ' : '') : ''}{uplift}
                </span>
              </div>
            </div>
          </div>

          {/* 护栏（显示所有，不只是有风险的） */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">护栏指标</div>
            <div className="space-y-1">
              {guardrails.length > 0 ? (
                guardrails.slice(0, 3).map((item, index) => {
                  const status = getGuardrailStatus(item)
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 truncate flex-1 mr-1">{item.name}</span>
                      <span className={`text-xs font-semibold flex-shrink-0 ${
                        status === 'red' ? 'text-red-600' :
                        status === 'yellow' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {item.baseline != null && item.treatment != null ? (
                          <>
                            {safeFormatNumber(item.baseline)} → {safeFormatNumber(item.treatment)}
                            {' '}
                            {status === 'red' ? '⚠️' : status === 'yellow' ? '⚡' : '✓'}
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-gray-400">暂无数据</div>
              )}
            </div>
          </div>

          {/* 卡点环节 */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-sm text-gray-600 mb-2">卡点环节</div>
            {bottleneck ? (
              <div>
                <div className="text-sm font-semibold text-red-700 mb-1">
                  <Term labelKey={bottleneck.stage || bottleneck.node || ''} type="pipeline">
                    {bottleneckStageName}
                  </Term>
                </div>
                <div className="text-xs text-red-600 mb-1">{bottleneck.symptom || bottleneck.note}</div>
                {bottleneck.impact && (
                  <div className="text-xs text-red-500">{bottleneck.impact}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">无卡点</div>
            )}
          </div>

          {/* 天花板 */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-gray-600 mb-2">天花板</div>
            {ceiling ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">当前提升</span>
                  <span className="text-sm font-semibold text-purple-700">{ceiling.current_uplift_pct.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">天花板</span>
                  <span className="text-sm font-semibold text-purple-600">{ceiling.ceiling_uplift_pct.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-purple-200">
                  <span className="text-xs text-gray-500">Gap</span>
                  <span className="text-sm font-bold text-purple-700">
                    {(ceiling.ceiling_uplift_pct - ceiling.current_uplift_pct).toFixed(1)}%
                  </span>
                </div>
                {ceiling.limit_stage && (
                  <div className="text-xs text-purple-600 mt-1">限制：{ceiling.limit_stage}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">未估算</div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
