'use client'

import Link from 'next/link'
import { nodeNames } from '@/lib/translations'
import Term from '@/components/Term'
import { formatLift, canCalculateLift, safeFormatNumber } from '@/lib/utils'
import { getNorthStar, getGuardrails, getBottleneck } from '@/lib/data-loader'
import { extractOwners, type OwnerType } from '@/lib/types/adx'

interface ExperimentSummaryCardProps {
  experiment: {
    id: string
    title: string
    data: any
  }
  status: 'NORMAL' | 'WARNING' | 'ALERT'
  conclusion: string
}

export default function ExperimentSummaryCard({ experiment, status, conclusion }: ExperimentSummaryCardProps) {
  const { id, title, data } = experiment

  // 使用辅助函数获取数据
  const northStar = getNorthStar(data)
  const guardrails = getGuardrails(data)
  const bottleneck = getBottleneck(data)

  // 使用安全提升率格式化
  const vvDeltaFormatted = formatLift(northStar.baseline, northStar.treatment)

  // 护栏指标（禁止绿色，使用蓝色/灰色/橙色）
  const getGuardrailStatus = (key: string, value: number | null, baselineValue: number | null): 'blue' | 'orange' | 'red' => {
    // 【修复】添加 null 检查，避免对 null 值进行数值比较
    if (value == null || baselineValue == null) return 'blue'
    const keyStr = typeof key === 'string' ? key : String(key ?? '')
    if (keyStr.includes('retention')) {
      if (value < baselineValue * 0.9) return 'red'
      if (value < baselineValue * 0.95) return 'orange'
      return 'blue'
    }
    if (keyStr.includes('exit') || keyStr.includes('complaint')) {
      if (value > baselineValue * 1.1) return 'red'
      if (value > baselineValue * 1.05) return 'orange'
      return 'blue'
    }
    return 'blue'
  }

  // 【防 500】确保 guardrails 是数组，避免 undefined.slice() 报错
  const guardrailItems = (guardrails || []).slice(0, 3).map((item) => {
    const status = getGuardrailStatus(item.name, item.treatment, item.baseline)
    return { ...item, status }
  })

  // 卡点节点
  const bottleneckNodeName = bottleneck ? (nodeNames[bottleneck.stage || bottleneck.node || ''] || bottleneck.stage || bottleneck.node || '无') : '无'

  // Owner 标签颜色映射
  const ownerColors: Record<OwnerType | string, { bg: string; text: string }> = {
    ADX: { bg: 'bg-purple-100', text: 'text-purple-700' },
    SSP: { bg: 'bg-blue-100', text: 'text-blue-700' },
    DSP: { bg: 'bg-orange-100', text: 'text-orange-700' },
    Algo: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    Infra: { bg: 'bg-gray-100', text: 'text-gray-700' },
  }

  // 【修复】使用 extractOwners 函数提取 owners，取 Top2
  const topOwners: string[] = (() => {
    try {
      // 优先从 ADX v1 格式提取
      const adxV1 = (data as any)?._adx_v1
      if (adxV1) {
        const owners = extractOwners(adxV1)
        return owners.slice(0, 2).map(o => String(o))
      }

      // Fallback: 手动提取（兼容标准格式）
      const ownersSet = new Set<string>()
      if (data?.pipeline) {
        if (Array.isArray((data.pipeline as any).actions)) {
          (data.pipeline as any).actions.forEach((action: any) => {
            if (action?.owner && typeof action.owner === 'string') {
              ownersSet.add(action.owner)
            }
          })
        }
        if (data.pipeline.reasons) {
          const rerankReasons = (data.pipeline.reasons as any).rerank || (data.pipeline.reasons as any).baseline?.rerank || {}
          if (Array.isArray(rerankReasons)) {
            rerankReasons.forEach((item: any) => {
              if (item?.owner && typeof item.owner === 'string') {
                ownersSet.add(item.owner)
              }
            })
          }
          const auctionReasons = (data.pipeline.reasons as any).auction || (data.pipeline.reasons as any).baseline?.auction || {}
          if (Array.isArray(auctionReasons)) {
            auctionReasons.forEach((item: any) => {
              if (item?.owner && typeof item.owner === 'string') {
                ownersSet.add(item.owner)
              }
            })
          }
        }
      }
      return Array.from(ownersSet).slice(0, 2)
    } catch (error) {
      console.warn('Failed to extract owners:', error)
      return []
    }
  })()

  // 【防 500】获取 owner 颜色，未命中时使用默认样式
  const getOwnerColor = (owner: string): { bg: string; text: string } => {
    return ownerColors[owner] || ownerColors['Infra'] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  }

  // Status badge 样式
  const statusConfig = {
    NORMAL: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: '正常' },
    WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: '警告' },
    ALERT: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: '异常' },
  }
  const statusStyle = statusConfig[status]

  return (
    // ✅ 静态导出 + trailingSlash:true 时，详情页目录形态是 /exp/<id>/
    <Link href={`/exp/${id}/`} className="block group">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 h-full flex flex-col">
        {/* 标题和状态 Badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 pr-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            {statusStyle.label}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500 font-mono">{id}</div>
          {/* 【新增】Owner 标签 */}
          {topOwners && topOwners.length > 0 && (
            <div className="flex gap-1">
              {topOwners.map((owner) => {
                const colors = getOwnerColor(owner)
                return (
                  <span
                    key={owner}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                  >
                    {owner}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* 北极星 Δ */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <Term labelKey="ad_vv" type="metric">北极星指标（视频播放量）</Term>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-gray-500">基线：{safeFormatNumber(northStar.baseline)}</span>
            <span className="text-sm text-gray-500">→</span>
            <span className="text-sm font-semibold text-gray-900">实验组：{safeFormatNumber(northStar.treatment)}</span>
            <span
              className={`text-sm font-bold ${
                vvDeltaFormatted.startsWith('+') ? 'text-blue-600' :
                vvDeltaFormatted.startsWith('-') ? 'text-red-600' :
                'text-gray-400'
              }`}
              title={!canCalculateLift(northStar.baseline, northStar.treatment) ? '基线为0无法计算变化率' : ''}
            >
              {vvDeltaFormatted !== '—'
                ? (vvDeltaFormatted.startsWith('+') ? '↑ ' : vvDeltaFormatted.startsWith('-') ? '↓ ' : '')
                : ''}
              {vvDeltaFormatted}
            </span>
          </div>
        </div>

        {/* 护栏 */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="text-xs text-gray-600 mb-2">护栏指标</div>
          <div className="flex items-center gap-3 flex-wrap">
            {guardrailItems.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'blue' ? 'bg-blue-500' :
                    item.status === 'orange' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-700">
                  {Array.isArray(['d1_retention', 'early_exit_rate', 'complaint_rate', 'timeout_rate', 'fill_rate']) &&
                   typeof item?.name === 'string' &&
                   ['d1_retention', 'early_exit_rate', 'complaint_rate', 'timeout_rate', 'fill_rate'].includes(item.name) ? (
                    <Term labelKey={item.name} type="metric">{item.name}</Term>
                  ) : item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 卡点节点 */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="text-xs text-gray-600 mb-1">卡点节点</div>
          <div className="text-sm font-medium text-gray-900">
            {bottleneck ? (
              <span className="text-orange-600">{bottleneckNodeName}</span>
            ) : (
              <span className="text-gray-400">无卡点</span>
            )}
          </div>
        </div>

        {/* 关键 Query（高点击低转化等） */}
        {data.pipeline?.query_stats?.top_queries && (() => {
          const problemQueries = data.pipeline.query_stats.top_queries
            .filter((q: any) => {
              const treatment = q.treatment
              // 高点击低转化：CTR > 3% 且 CVR < 1%
              const isHighCtrLowCvr = treatment.ctr > 0.03 && treatment.cvr < 0.01
              // 高转化低量：CVR > 2% 且曝光 < 5万
              const isHighCvrLowVolume = treatment.cvr > 0.02 && treatment.impressions < 50000
              return isHighCtrLowCvr || isHighCvrLowVolume || q.issue_tag
            })
            .slice(0, 2)

          if (problemQueries.length > 0) {
            return (
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="text-xs text-gray-600 mb-2">关键 Query</div>
                <div className="space-y-1.5">
                  {problemQueries.map((q: any, idx: number) => {
                    const issueTag = q.issue_tag ||
                      (q.treatment.ctr > 0.03 && q.treatment.cvr < 0.01 ? 'high_ctr_low_cvr' :
                       q.treatment.cvr > 0.02 && q.treatment.impressions < 50000 ? 'high_cvr_low_volume' : null)
                    const issueLabels: Record<string, string> = {
                      high_ctr_low_cvr: '高点击低转化',
                      high_cvr_low_volume: '高转化低量',
                      low_ctr: '点击率低',
                      low_cvr: '转化率低',
                    }
                    return (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate flex-1">{q.query}</span>
                          {issueTag && (
                            <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
                              issueTag === 'high_ctr_low_cvr' ? 'bg-red-100 text-red-700' :
                              issueTag === 'high_cvr_low_volume' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {issueLabels[issueTag] || '问题'}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 mt-0.5">
                          CTR: {(q.treatment.ctr * 100).toFixed(2)}% | CVR: {(q.treatment.cvr * 100).toFixed(2)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }
          return null
        })()}

        {/* 一句话结论 */}
        <div className="mt-auto pt-2">
          <div className="text-xs text-gray-500 mb-1">结论</div>
          <div className="text-sm text-gray-700 leading-relaxed line-clamp-2">
            {conclusion}
          </div>
        </div>
      </div>
    </Link>
  )
}
