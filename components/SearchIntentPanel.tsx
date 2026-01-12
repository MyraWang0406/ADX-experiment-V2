'use client'

import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { formatTerm } from '@/lib/glossary'
import { safePercentChange, formatPercentChange } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SearchIntentPanelProps {
  data: {
    query_dist?: Array<{
      query: string
      share: number
      intent?: string
      ctr?: number
      cvr?: number
    }>
    match_rate?: {
      baseline: number
      treatment: number
    }
    post_click_cvr?: {
      baseline: number
      treatment: number
    }
  }
  narrative: string
}

export default function SearchIntentPanel({ data, narrative }: SearchIntentPanelProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)

  if (!data || (!data.query_dist && !data.match_rate && !data.post_click_cvr)) {
    return (
      <div id="search-intent" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query & Intent）</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-2">数据缺失</p>
          <p className="text-xs">需要以下字段：</p>
          <ul className="text-xs list-disc list-inside mt-1">
            <li>pipeline.search.query_dist[] (query, share, intent?, ctr?, cvr?)</li>
            <li>pipeline.search.match_rate (baseline/treatment)</li>
            <li>pipeline.search.post_click_cvr (baseline/treatment)</li>
          </ul>
        </div>
      </div>
    )
  }

  // 搜索词分布数据
  const queryData = data.query_dist || []
  const topQueries = queryData.slice(0, 8)
  
  // 匹配率和转化率数据
  const matchRateBaseline = (data.match_rate?.baseline || 0) * 100
  const matchRateTreatment = (data.match_rate?.treatment || 0) * 100
  const cvrBaseline = (data.post_click_cvr?.baseline || 0) * 100
  const cvrTreatment = (data.post_click_cvr?.treatment || 0) * 100

  // 计算差异
  const matchRateChange = safePercentChange(matchRateBaseline, matchRateTreatment)
  const cvrChange = safePercentChange(cvrBaseline, cvrTreatment)

  // 按意图分类
  const intentGroups = topQueries.reduce((acc, item) => {
    const intent = item.intent || '其他'
    if (!acc[intent]) {
      acc[intent] = { intent, queries: [], totalShare: 0 }
    }
    acc[intent].queries.push(item)
    acc[intent].totalShare += item.share
    return acc
  }, {} as Record<string, { intent: string; queries: Array<typeof topQueries[0]>; totalShare: number }>)

  return (
    <div id="search-intent" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query & Intent）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">
        📊 流量结构分析：匹配率 {matchRateChange !== null ? formatPercentChange(matchRateChange) : '--'}，转化率 {cvrChange !== null ? formatPercentChange(cvrChange) : '--'}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 搜索词分布 - 折线图 */}
        {topQueries.length > 0 && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">搜索词分布</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={topQueries.map(q => ({ query: q.query, share: q.share * 100 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="query" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis label={{ value: '占比 (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="share" 
                  stroke="#60a5fa" 
                  strokeWidth={2} 
                  name="占比"
                  dot={{ fill: '#60a5fa', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 匹配率和转化率 */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">匹配效果</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <Term labelKey="match_rate" type="field">匹配率（Match Rate）</Term>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(tab === 'compare' || tab === 'baseline') && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-gray-500 mb-1">基线</div>
                    <div className="text-xl font-bold text-blue-400">{matchRateBaseline.toFixed(1)}%</div>
                  </div>
                )}
                {(tab === 'compare' || tab === 'treatment') && (
                  <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                    <div className="text-xs text-gray-500 mb-1">实验组</div>
                    <div className="text-xl font-bold text-blue-800">{matchRateTreatment.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <Term labelKey="cvr" type="metric">点击后转化率（Post-Click CVR）</Term>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(tab === 'compare' || tab === 'baseline') && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-gray-500 mb-1">基线</div>
                    <div className="text-xl font-bold text-blue-400">{cvrBaseline.toFixed(2)}%</div>
                  </div>
                )}
                {(tab === 'compare' || tab === 'treatment') && (
                  <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                    <div className="text-xs text-gray-500 mb-1">实验组</div>
                    <div className="text-xl font-bold text-blue-800">{cvrTreatment.toFixed(2)}%</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 意图分类 */}
      {Object.keys(intentGroups).length > 0 && (
        <div className="mt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">意图分类</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(intentGroups).map((group, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-semibold text-gray-800 mb-2">{group.intent}</div>
                <div className="text-xs text-gray-600 mb-1">占比: {(group.totalShare * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-500">查询数: {group.queries.length}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
