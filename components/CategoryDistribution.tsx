'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import EmptyState from '@/components/EmptyState'
import { ensureObject } from '@/lib/utils-safe'

interface CategoryDistributionProps {
  data: {
    baseline: Record<string, number>
    treatment: Record<string, number>
  }
  narrative: string
}

export default function CategoryDistribution({ data, narrative }: CategoryDistributionProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  // 【强容错】使用工具函数确保对象存在
  const safeData = ensureObject(data, { baseline: {}, treatment: {} })
  const baseline = ensureObject(safeData.baseline)
  const treatment = ensureObject(safeData.treatment)
  const categories = Object.keys(baseline).length > 0 ? Object.keys(baseline) : Object.keys(treatment)
  const narrativeFirstLine = narrative?.split('。')[0] || narrative?.substring(0, 50) || ''
  
  // 如果没有数据，显示空状态
  if (categories.length === 0) {
    return (
      <div id="category" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">内容分布</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <EmptyState title="暂无内容分布数据" message="category_dist 字段缺失或为空" />
      </div>
    )
  }

  const chartData = categories.map(category => ({
    category,
    baseline: Number(((baseline[category] ?? 0) * 100).toFixed(2)),
    treatment: Number(((treatment[category] ?? 0) * 100).toFixed(2)),
    diff: Number((((treatment[category] ?? 0) - (baseline[category] ?? 0)) * 100).toFixed(2)),
  }))

  // 找出差异最大的 top3
  const sortedByDiff = [...chartData].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  const top3Diff = sortedByDiff.slice(0, 3)

  // 生成 Diff Top3 摘要
  const diffSummary = top3Diff.length > 0 ? top3Diff.map((item, i) => 
    `${item.category}: ${item.baseline.toFixed(1)}% → ${item.treatment.toFixed(1)}% (${item.diff > 0 ? '↑' : '↓'}${Math.abs(item.diff).toFixed(1)}%)`
  ).join('；') : '暂无差异数据'

  // 计算 Y 轴 domain（优化显示范围）
  const allValues = chartData.flatMap(d => [d.baseline, d.treatment]).filter(v => isFinite(v) && v >= 0)
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100
  const yDomain = [Math.max(0, minValue * 0.95), maxValue * 1.05]

  // 自定义 Tooltip，显示 baseline/treatment 和差值
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      const baselineVal = data.baseline
      const treatmentVal = data.treatment
      const delta = treatmentVal - baselineVal
      const deltaPercent = baselineVal > 0 ? ((delta / baselineVal) * 100).toFixed(1) : '0.0'
      
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-800 mb-2">{data.category}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className="text-gray-600">基线:</span>
              <span className="font-semibold text-blue-600">{baselineVal.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-800 border-2 border-blue-800" style={{ background: 'transparent' }}></div>
              <span className="text-gray-600">实验组:</span>
              <span className="font-semibold text-blue-800">{treatmentVal.toFixed(2)}%</span>
            </div>
            <div className="pt-1 border-t border-gray-200 mt-1">
              <span className="text-gray-600">差值:</span>
              <span className={`font-bold ml-2 ${delta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}% ({delta >= 0 ? '+' : ''}{deltaPercent}%)
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div id="category" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">内容分布</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">📊 差异摘要（Top3）：{diffSummary}</p>
      
      <ResponsiveContainer width="100%" height={350} className="sm:h-[450px]">
        <LineChart data={chartData} margin={{ top: 50, right: 30, left: 50, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="category" 
            angle={-45} 
            textAnchor="end" 
            height={120}
            interval={0}
            tick={{ fontSize: 11 }}
            label={{ value: '类目', position: 'insideBottom', offset: -15 }}
          />
          <YAxis 
            label={{ value: '占比 (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            tick={{ fontSize: 12 }}
            domain={yDomain}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', paddingBottom: '10px' }}
            iconType="line"
            verticalAlign="top"
          />
          {(tab === 'compare' || tab === 'baseline') && (
            <Line 
              type="monotone" 
              dataKey="baseline" 
              stroke="#60a5fa" 
              strokeWidth={3} 
              name="基线（Baseline）"
              dot={{ fill: '#60a5fa', r: 5 }}
              activeDot={{ r: 7 }}
            />
          )}
          {(tab === 'compare' || tab === 'treatment') && (
            <Line 
              type="monotone" 
              dataKey="treatment" 
              stroke="#1e40af" 
              strokeWidth={3} 
              strokeDasharray="8 4"
              name="实验组（Treatment）"
              dot={{ fill: '#1e40af', r: 6 }}
              activeDot={{ r: 8 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
