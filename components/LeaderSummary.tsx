'use client'

import type { ExperimentData } from '@/lib/data-loader'
import { nodeNames } from '@/lib/translations'
import Term from '@/components/Term'

interface LeaderSummaryProps {
  experiment: ExperimentData
}

export default function LeaderSummary({ experiment }: LeaderSummaryProps) {
  const { metrics_summary, pipeline } = experiment

  // 计算天花板（如果没有就按基线 * 1.3）
  // 支持两种路径：.value 和 .ad_vv
  const baselineNorthStar = (metrics_summary?.baseline as any)?.north_star
  const treatmentNorthStar = (metrics_summary?.treatment as any)?.north_star
  const baselineVV = baselineNorthStar?.value ?? baselineNorthStar?.ad_vv ?? null
  const treatmentVV = treatmentNorthStar?.value ?? treatmentNorthStar?.ad_vv ?? null
  
  // 如果 baseline 或 treatment 为 null，使用 0 计算天花板，但显示时用 "—"
  const baselineNum = baselineVV != null && typeof baselineVV === 'number' ? baselineVV : 0
  const treatmentNum = treatmentVV != null && typeof treatmentVV === 'number' ? treatmentVV : 0
  const ceiling = (experiment as any).ceiling ?? Math.round(baselineNum * 1.3)
  const gap = Math.max(0, ceiling - treatmentNum)

  // 卡点节点
  const bottleneck = pipeline.bottlenecks?.[0]
  const bottleneckNodeKey = bottleneck?.node || bottleneck?.stage || ''
  const bottleneckNodeName = bottleneckNodeKey ? (nodeNames[bottleneckNodeKey] || bottleneckNodeKey) : '无'

  // 生成关键路径（根据卡点 node）
  const getKeyActions = () => {
    if (!bottleneck) return []
    
    const actions: Array<{ action: string; owner: string }> = []
    const node = bottleneck.node || bottleneck.stage || ''

    if (node === 'recall') {
      actions.push(
        { action: '优化召回源权重，提升优质内容覆盖率', owner: '算法' },
        { action: '增加向量召回精度，减少噪声', owner: '工程' },
        { action: '调整召回多样性策略', owner: '算法' }
      )
    } else if (node === 'fine') {
      actions.push(
        { action: '优化精排模型特征，提升相关性', owner: '算法' },
        { action: '调整精排目标权重，平衡时长与完播', owner: '算法' },
        { action: '优化精排延迟，提升吞吐', owner: '工程' }
      )
    } else if (node === 'auction') {
      actions.push(
        { action: '调整底价策略，平衡广告填充率与收入', owner: '商业化' },
        { action: '优化 OCPX 倍率控制，稳定 CPA', owner: '算法' },
        { action: '提升拍卖响应速度，降低超时率', owner: '工程' }
      )
    } else {
      actions.push(
        { action: '优化该环节性能，降低延迟', owner: '工程' },
        { action: '调整该环节策略参数', owner: '算法' },
        { action: '监控该环节指标变化', owner: '运营' }
      )
    }
    return actions
  }

  const keyActions = getKeyActions()

  return (
    <div className="sticky top-0 z-40 bg-white border-b-2 border-blue-200 shadow-sm mb-4 sm:mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Leader 总览</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 北极星指标 */}
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">北极星指标</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">基线</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-700">
                  {baselineVV != null && typeof baselineVV === 'number' ? baselineVV.toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">实验组</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-500">
                  {treatmentVV != null && typeof treatmentVV === 'number' ? treatmentVV.toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                <span className="text-xs text-gray-500">变化</span>
                <span className={`text-xs sm:text-sm font-bold ${
                  baselineVV != null && treatmentVV != null && baselineVV > 0
                    ? (treatmentVV >= baselineVV ? 'text-blue-600' : 'text-red-600')
                    : 'text-gray-400'
                }`}>
                  {baselineVV != null && treatmentVV != null && baselineVV > 0
                    ? `${treatmentVV >= baselineVV ? '↑' : '↓'} ${Math.abs(((treatmentVV - baselineVV) / baselineVV) * 100).toFixed(1)}%`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 护栏指标 */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">护栏指标</div>
            <div className="space-y-1">
              {Object.entries((metrics_summary?.treatment as any)?.guardrails || {}).map(([key, value]: [string, any]) => {
                const baselineValue = (metrics_summary?.baseline as any)?.guardrails?.[key] ?? null
                const treatmentValue = value ?? null
                
                // 只有当两个值都存在时才比较
                const isBad = baselineValue != null && treatmentValue != null && (
                  (key.includes('retention') && treatmentValue < baselineValue) || 
                  (key.includes('exit') && treatmentValue > baselineValue) ||
                  (key.includes('complaint') && treatmentValue > baselineValue)
                )
                const label = key.includes('retention') ? '次日留存' :
                             key.includes('exit') ? '早退率' :
                             key.includes('complaint') ? '投诉率' :
                             key.includes('timeout') ? '超时率' :
                             key.includes('fill') ? '填充率' : key
                const hasTerm = ['d1_retention', 'early_exit_rate', 'complaint_rate', 'timeout_rate', 'fill_rate'].includes(key)
                
                // 显示值：如果是数字且是 0-1 范围，转百分比；否则直接显示
                const displayValue = treatmentValue != null && typeof treatmentValue === 'number'
                  ? (treatmentValue <= 1 && treatmentValue >= 0 ? (treatmentValue * 100).toFixed(1) + '%' : treatmentValue.toLocaleString())
                  : '—'
                
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 truncate flex-1 mr-1">
                      {hasTerm ? (
                        <Term labelKey={key} type="metric">{label}</Term>
                      ) : label}
                    </span>
                    <span className={`text-xs font-semibold flex-shrink-0 ${isBad ? 'text-red-600' : 'text-blue-600'}`}>
                      {isBad ? '⚠️' : '✓'} {displayValue}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 卡点节点 */}
          <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">卡点节点</div>
            {bottleneck ? (
              <div>
                <div className="text-xs sm:text-sm font-semibold text-red-700 mb-1">{bottleneckNodeName}</div>
                <div className="text-xs text-red-600 line-clamp-2">{bottleneck.note}</div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-400">无卡点</div>
            )}
          </div>

          {/* 天花板 */}
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">天花板</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">当前</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-700">
                  {treatmentVV != null && typeof treatmentVV === 'number' ? treatmentVV.toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">天花板</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-600">{ceiling.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-purple-200">
                <span className="text-xs text-gray-500">Gap</span>
                <span className="text-xs sm:text-sm font-bold text-purple-700">{gap.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 关键路径 */}
          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200 sm:col-span-2 lg:col-span-1">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">关键路径（3步）</div>
            <div className="space-y-2">
              {keyActions.map((action, index) => (
                <div key={index} className="text-xs">
                  <div className="font-semibold text-yellow-800">{index + 1}. {action.action}</div>
                  <div className="text-yellow-600 mt-0.5">Owner: {action.owner}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
