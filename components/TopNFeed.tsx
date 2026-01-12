'use client'

import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import EmptyState from '@/components/EmptyState'
import { ensureArray } from '@/lib/utils-safe'

interface TopNFeedProps {
  data: {
    baseline: Array<{
      rank: number
      content_id: number
      category: string
      tags: string[]
      score: number
      author_id: number
      duration_s: number
    }>
    treatment: Array<{
      rank: number
      content_id: number
      category: string
      tags: string[]
      score: number
      author_id: number
      duration_s: number
    }>
  }
  narrative: string
}

export default function TopNFeed({ data, narrative }: TopNFeedProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const displayCount = 20
  const narrativeFirstLine = narrative?.split('。')[0] || narrative?.substring(0, 50) || ''
  
  // 【强容错】使用工具函数确保数组存在
  const baseline = ensureArray(data?.baseline)
  const treatment = ensureArray(data?.treatment)
  
  // 如果数据完全缺失，显示 EmptyState
  if (baseline.length === 0 && treatment.length === 0) {
    return (
      <div id="topn" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">TopN 模拟信息流（TopN Feed）</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <EmptyState title="暂无 TopN 数据" message="pipeline.topN_feed 字段缺失或为空" />
      </div>
    )
  }
  
  let displayData: typeof baseline = []
  
  if (tab === 'baseline') {
    displayData = baseline
  } else if (tab === 'treatment') {
    displayData = treatment
  } else {
    displayData = treatment
  }

  // 计算差异摘要（安全处理空数组）
  const baselineSlice = baseline.slice(0, 10)
  const treatmentSlice = treatment.slice(0, 10)
  const baselineAvgDuration = baselineSlice.length > 0 
    ? baselineSlice.reduce((sum, item) => sum + item.duration_s, 0) / baselineSlice.length 
    : 0
  const treatmentAvgDuration = treatmentSlice.length > 0
    ? treatmentSlice.reduce((sum, item) => sum + item.duration_s, 0) / treatmentSlice.length
    : 0
  
  // 计算类目熵
  const getCategoryEntropy = (items: typeof baseline) => {
    if (items.length === 0) return 0
    const categoryCounts: Record<string, number> = {}
    const slice = items.slice(0, 10)
    slice.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    })
    const total = slice.length
    if (total === 0) return 0
    const probs = Object.values(categoryCounts).map(count => count / total)
    return -probs.reduce((sum, p) => sum + (p * Math.log2(p || 1)), 0)
  }
  const baselineEntropy = getCategoryEntropy(baseline)
  const treatmentEntropy = getCategoryEntropy(treatment)

  // 计算分数陡峭度（前3 vs 后3的分数差）
  const getScoreSteepness = (items: typeof baseline) => {
    if (items.length < 10) return 0
    const top3Slice = items.slice(0, 3)
    const bottom3Slice = items.slice(7, 10)
    if (top3Slice.length === 0 || bottom3Slice.length === 0) return 0
    const top3Avg = top3Slice.reduce((sum, item) => sum + item.score, 0) / top3Slice.length
    const bottom3Avg = bottom3Slice.reduce((sum, item) => sum + item.score, 0) / bottom3Slice.length
    return top3Avg - bottom3Avg
  }
  const baselineSteepness = getScoreSteepness(baseline)
  const treatmentSteepness = getScoreSteepness(treatment)

  const diffSummary = `平均时长: ${baselineAvgDuration.toFixed(1)}s → ${treatmentAvgDuration.toFixed(1)}s；类目熵: ${baselineEntropy.toFixed(2)} → ${treatmentEntropy.toFixed(2)}；分数陡峭度: ${baselineSteepness.toFixed(3)} → ${treatmentSteepness.toFixed(3)}`

  return (
    <div id="topn" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">TopN 模拟信息流（TopN Feed）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">📊 差异摘要：{diffSummary}</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {displayData.slice(0, displayCount).map((item) => (
          <div
            key={item.rank}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all hover:border-blue-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600">#{item.rank} 排名（Rank）</span>
              <span className="text-xs text-gray-500">{item.duration_s}秒（Duration）</span>
            </div>
            <div className="text-xs font-semibold text-gray-800 mb-1 line-clamp-1">
              {item.category}（Category）
            </div>
            <div className="text-xs text-gray-500 mb-2">
              评分（Score）: {item.score.toFixed(3)}
            </div>
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    tab === 'baseline'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{item.tags.length - 2}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
