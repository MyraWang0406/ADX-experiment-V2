'use client'

import type { ExperimentData } from '@/lib/data-loader'
import { nodeNames } from '@/lib/translations'

interface ConclusionSummaryProps {
  experiment: ExperimentData
}

export default function ConclusionSummary({ experiment }: ConclusionSummaryProps) {
  const { pipeline } = experiment
  const conclusions: string[] = []

  // 1. 卡点节点
  if (pipeline.bottlenecks && pipeline.bottlenecks.length > 0) {
    const bottleneck = pipeline.bottlenecks[0]
    const nodeKey = bottleneck.node || bottleneck.stage || ''
    const nodeName = nodeKey ? (nodeNames[nodeKey] || nodeKey) : '未知'
    conclusions.push(`卡点节点：${nodeName} - ${bottleneck.note || bottleneck.symptom || ''}`)
  }

  // 2. 漏斗变化最大的一步
  const stages = ['pool', 'after_recall', 'after_coarse', 'after_fine', 'final']
  const stageNames: Record<string, string> = {
    pool: '候选池',
    after_recall: '召回后',
    after_coarse: '粗排后',
    after_fine: '精排后',
    final: '最终',
  }
  
  let maxChange = 0
  let maxChangeStage = ''
  for (let i = 0; i < stages.length - 1; i++) {
    const current = stages[i]
    const next = stages[i + 1]
    const baselineRate = pipeline.funnel.baseline[next] / pipeline.funnel.baseline[current]
    const treatmentRate = pipeline.funnel.treatment[next] / pipeline.funnel.treatment[current]
    const change = Math.abs(treatmentRate - baselineRate) / baselineRate
    if (change > maxChange) {
      maxChange = change
      maxChangeStage = stageNames[next] || next
    }
  }
  if (maxChangeStage) {
    const changePercent = (maxChange * 100).toFixed(1)
    conclusions.push(`漏斗变化最大：${maxChangeStage}环节相对变化率 ${changePercent}%`)
  }

  // 3. 画风变化最大类目
  const categories = Object.keys(pipeline.category_dist.baseline)
  let maxDiff = 0
  let maxDiffCategory = ''
  categories.forEach(cat => {
    const diff = Math.abs(pipeline.category_dist.treatment[cat] - pipeline.category_dist.baseline[cat])
    if (diff > maxDiff) {
      maxDiff = diff
      maxDiffCategory = cat
    }
  })
  if (maxDiffCategory) {
    const baselinePct = (pipeline.category_dist.baseline[maxDiffCategory] * 100).toFixed(1)
    const treatmentPct = (pipeline.category_dist.treatment[maxDiffCategory] * 100).toFixed(1)
    conclusions.push(`画风变化最大：${maxDiffCategory} 从 ${baselinePct}% 变为 ${treatmentPct}%`)
  }

  // 4. 商业化变化
  const winRateChange = ((pipeline.auction.treatment.win_rate - pipeline.auction.baseline.win_rate) * 100).toFixed(1)
  const timeoutChange = ((pipeline.auction.treatment.timeout_rate - pipeline.auction.baseline.timeout_rate) * 100).toFixed(1)
  const floorChange = ((pipeline.auction.treatment.floor_ecpm - pipeline.auction.baseline.floor_ecpm) / pipeline.auction.baseline.floor_ecpm * 100).toFixed(1)
  conclusions.push(`商业化：胜率${winRateChange}%，超时率${timeoutChange}%，底价${floorChange}%`)

  // 5. OCPX 稳定性
  const ocpxBaseline = Array.isArray(pipeline.ocpx_timeseries?.baseline) 
    ? pipeline.ocpx_timeseries.baseline 
    : (pipeline.ocpx_timeseries?.baseline?.multiplier && Array.isArray(pipeline.ocpx_timeseries.baseline.multiplier))
      ? pipeline.ocpx_timeseries.baseline.multiplier
      : []
  const ocpxTreatment = Array.isArray(pipeline.ocpx_timeseries?.treatment)
    ? pipeline.ocpx_timeseries.treatment
    : (pipeline.ocpx_timeseries?.treatment?.multiplier && Array.isArray(pipeline.ocpx_timeseries.treatment.multiplier))
      ? pipeline.ocpx_timeseries.treatment.multiplier
      : []
  
  if (ocpxBaseline.length > 0 && ocpxTreatment.length > 0) {
    const baselineMultipliers = Array.isArray(ocpxBaseline[0]) 
      ? ocpxBaseline.map((d: any) => d?.multiplier).filter((v: any) => typeof v === 'number' && isFinite(v))
      : ocpxBaseline.filter((v: any) => typeof v === 'number' && isFinite(v))
    const treatmentMultipliers = Array.isArray(ocpxTreatment[0])
      ? ocpxTreatment.map((d: any) => d?.multiplier).filter((v: any) => typeof v === 'number' && isFinite(v))
      : ocpxTreatment.filter((v: any) => typeof v === 'number' && isFinite(v))
    
    if (baselineMultipliers.length > 0 && treatmentMultipliers.length > 0) {
      const baselineMean = baselineMultipliers.reduce((a, b) => a + b, 0) / baselineMultipliers.length
      const treatmentMean = treatmentMultipliers.reduce((a, b) => a + b, 0) / treatmentMultipliers.length
      
      const baselineStd = Math.sqrt(baselineMultipliers.reduce((sum, val) => sum + Math.pow(val - baselineMean, 2), 0) / baselineMultipliers.length)
      const treatmentStd = Math.sqrt(treatmentMultipliers.reduce((sum, val) => sum + Math.pow(val - treatmentMean, 2), 0) / treatmentMultipliers.length)
      
      const stability = baselineStd < treatmentStd ? '稳定性下降' : '稳定性提升'
      conclusions.push(`OCPX稳定性：${stability}（标准差 ${baselineStd.toFixed(3)} → ${treatmentStd.toFixed(3)}）`)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">结论摘要</h2>
      <ul className="space-y-2">
        {conclusions.map((conclusion, index) => (
          <li key={index} className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-gray-700">{conclusion}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

