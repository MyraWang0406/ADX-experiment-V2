'use client'

import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { formatReasonLabel } from '@/lib/labels'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { filterReasonsByView } from '@/lib/types/adx'
import EmptyState from '@/components/EmptyState'
import { ensureObject, ensureArray } from '@/lib/utils-safe'

interface ReasonDistributionProps {
  data: any
  narrative: string
}

export default function ReasonDistribution({ data, narrative }: ReasonDistributionProps) {
  // 【修复 Hooks 违规】禁止 try/catch 调用 hook，使用统一的 Context
  const { tab, view } = useExperimentDetail()
  
  // viewFilter 用于过滤（需要大写格式）
  const viewFilter: 'All' | 'DSP' | 'SSP' | 'ADX' = 
    view === 'all' ? 'All' :
    view === 'dsp' ? 'DSP' :
    view === 'ssp' ? 'SSP' : 'ADX'
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)

  // 【强容错】处理 ADX v1 格式（数组格式）
  let rerankData: Array<{ reason: string; reasonCode: string; baseline: number; treatment: number; diff: number }> = []
  let auctionData: Array<{ reason: string; reasonCode: string; baseline: number; treatment: number; diff: number }> = []

  if (data && (Array.isArray(data.rerank) || Array.isArray(data.auction))) {
    const reasons = {
      rerank: Array.isArray(data.rerank) ? data.rerank : [],
      auction: Array.isArray(data.auction) ? data.auction : [],
    }
    
    // 【新增】根据视角过滤
    const filteredReasons = viewFilter ? filterReasonsByView(reasons, viewFilter) : reasons
    
    // 转换为图表数据格式（只显示中文，不显示英文 code）
    rerankData = (filteredReasons.rerank || []).map((item: any) => ({
      reason: formatReasonLabel(item.code || ''), // 只显示中文
      reasonCode: item.code || '',
      baseline: (item.baseline_pct || 0) * 100,
      treatment: (item.treatment_pct || 0) * 100,
      diff: ((item.treatment_pct || 0) - (item.baseline_pct || 0)) * 100,
    })).sort((a: any, b: any) => Math.abs(b.diff) - Math.abs(a.diff))
    
    auctionData = (filteredReasons.auction || []).map((item: any) => ({
      reason: formatReasonLabel(item.code || ''), // 只显示中文
      reasonCode: item.code || '',
      baseline: (item.baseline_pct || 0) * 100,
      treatment: (item.treatment_pct || 0) * 100,
      diff: ((item.treatment_pct || 0) - (item.baseline_pct || 0)) * 100,
    })).sort((a: any, b: any) => Math.abs(b.diff) - Math.abs(a.diff))
  } else {
    // 【强容错】兼容 v1 和 v2 数据结构（旧格式），使用工具函数确保对象存在
    const safeData = ensureObject(data)
    const rerankBaseline = ensureObject(safeData.rerank?.baseline || safeData.baseline?.rerank)
    const rerankTreatment = ensureObject(safeData.rerank?.treatment || safeData.treatment?.rerank)
    const auctionBaseline = ensureObject(safeData.auction?.baseline || safeData.baseline?.auction)
    const auctionTreatment = ensureObject(safeData.auction?.treatment || safeData.treatment?.auction)

    // Rerank 数据
    const rerankKeys = new Set([
      ...Object.keys(rerankBaseline),
      ...Object.keys(rerankTreatment)
    ])
    
    rerankData = Array.from(rerankKeys).map(key => ({
      reason: formatReasonLabel(key), // 只显示中文
      reasonCode: key,
      baseline: (rerankBaseline[key] || 0) * 100,
      treatment: (rerankTreatment[key] || 0) * 100,
      diff: ((rerankTreatment[key] || 0) - (rerankBaseline[key] || 0)) * 100,
    })).sort((a: any, b: any) => Math.abs(b.diff) - Math.abs(a.diff))

    // Auction 数据
    const auctionKeys = new Set([
      ...Object.keys(auctionBaseline),
      ...Object.keys(auctionTreatment)
    ])
    
    auctionData = Array.from(auctionKeys).map(key => ({
      reason: formatReasonLabel(key), // 只显示中文
      reasonCode: key,
      baseline: (auctionBaseline[key] || 0) * 100,
      treatment: (auctionTreatment[key] || 0) * 100,
      diff: ((auctionTreatment[key] || 0) - (auctionBaseline[key] || 0)) * 100,
    })).sort((a: any, b: any) => Math.abs(b.diff) - Math.abs(a.diff))
  }

  // 生成 Diff Top3 摘要
  const rerankTop3 = ensureArray(rerankData).slice(0, 3).map(item => 
    `${item.reason}: ${item.baseline.toFixed(1)}% → ${item.treatment.toFixed(1)}% (${item.diff > 0 ? '↑' : '↓'}${Math.abs(item.diff).toFixed(1)}%)`
  ).join('；')
  const auctionTop3 = ensureArray(auctionData).slice(0, 3).map(item => 
    `${item.reason}: ${item.baseline.toFixed(1)}% → ${item.treatment.toFixed(1)}% (${item.diff > 0 ? '↑' : '↓'}${Math.abs(item.diff).toFixed(1)}%)`
  ).join('；')

  // 如果完全没有数据，显示 EmptyState
  if (rerankData.length === 0 && auctionData.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">原因分布</h2>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{narrativeFirstLine}</p>
        <EmptyState title="暂无原因分布数据" message="pipeline.reasons 字段缺失或为空" />
      </div>
    )
  }

  return (
    <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">原因分布</h2>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{narrativeFirstLine}</p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-700 font-medium">📊 差异摘要（Top3）</p>
          {rerankTop3 && <p className="text-xs text-blue-600 mt-2 leading-relaxed">重排：{rerankTop3}</p>}
          {auctionTop3 && <p className="text-xs text-blue-600 mt-1 leading-relaxed">拍卖：{auctionTop3}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* 重排原因 - 使用折线图 */}
        {rerankData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">重排原因</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rerankData.slice(0, 8)} margin={{ top: 50, right: 30, left: 20, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="reason" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  tick={{ fontSize: 11 }}
                  label={{ value: '原因', position: 'insideBottom', offset: -15 }}
                />
                <YAxis label={{ value: '占比 (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                {(tab === 'compare' || tab === 'baseline') && (
                  <Line 
                    type="monotone" 
                    dataKey="baseline" 
                    stroke="#60a5fa" 
                    strokeWidth={2} 
                    name="基线"
                    dot={{ fill: '#60a5fa', r: 3 }}
                  />
                )}
                {(tab === 'compare' || tab === 'treatment') && (
                  <Line 
                    type="monotone" 
                    dataKey="treatment" 
                    stroke="#1e40af" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    name="实验组"
                    dot={{ fill: '#1e40af', r: 3 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 拍卖原因 - 使用折线图 */}
        {auctionData.length > 0 && (() => {
          // 计算 Y 轴 domain
          const allValues = auctionData.flatMap(d => [d.baseline, d.treatment]).filter(v => isFinite(v) && v >= 0)
          const minValue = allValues.length > 0 ? Math.min(...allValues) : 0
          const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100
          const yDomain = [Math.max(0, minValue * 0.95), maxValue * 1.05]

          // 自定义 Tooltip
          const CustomTooltip = ({ active, payload }: any) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload
              const baselineVal = data.baseline
              const treatmentVal = data.treatment
              const delta = treatmentVal - baselineVal
              const deltaPercent = baselineVal > 0 ? ((delta / baselineVal) * 100).toFixed(1) : '0.0'
              
              return (
                <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                  <p className="font-semibold text-gray-800 mb-2">{data.reason}</p>
                  <p className="text-xs text-gray-500 mb-2 font-mono">{data.reasonCode}</p>
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">拍卖原因</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={auctionData.slice(0, 8)} margin={{ top: 50, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="reason" 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    tick={{ fontSize: 11 }}
                    label={{ value: '原因', position: 'insideBottom', offset: -15 }}
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
                      name="基线"
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
                      name="实验组"
                      dot={{ fill: '#1e40af', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
