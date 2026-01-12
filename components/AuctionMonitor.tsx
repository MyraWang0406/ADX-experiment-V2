'use client'

import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { formatMetric } from '@/lib/dictionaries/terminology'

interface AuctionMonitorProps {
  data: {
    baseline: {
      objective: string
      floor_ecpm: number
      bid_ecpm_quantiles: Record<string, number>
      clearing_ecpm_quantiles: Record<string, number>
      win_rate: number
      timeout_rate: number
    }
    treatment: {
      objective: string
      floor_ecpm: number
      bid_ecpm_quantiles: Record<string, number>
      clearing_ecpm_quantiles: Record<string, number>
      win_rate: number
      timeout_rate: number
    }
  }
  narrative: string
}

export default function AuctionMonitor({ data, narrative }: AuctionMonitorProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const quantiles = [
    { key: 'p10', label: '10%分位数（最低10%的出价）', desc: '表示有10%的出价低于这个值' },
    { key: 'p50', label: '50%分位数（中位数）', desc: '表示有一半的出价低于这个值' },
    { key: 'p90', label: '90%分位数（最高10%的出价）', desc: '表示有90%的出价低于这个值' },
  ]
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)

  // 计算差异
  const winRateDiff = ((data.treatment.win_rate - data.baseline.win_rate) * 100).toFixed(1)
  const timeoutDiff = ((data.treatment.timeout_rate - data.baseline.timeout_rate) * 100).toFixed(1)
  const floorDiff = ((data.treatment.floor_ecpm - data.baseline.floor_ecpm) / data.baseline.floor_ecpm * 100).toFixed(1)
  
  const diffSummary = `胜率: ${winRateDiff}%；超时率: ${timeoutDiff}%；底价: ${floorDiff}%`

  return (
    <div id="auction" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">拍卖监控</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">📊 差异摘要：{diffSummary}</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        {(tab === 'compare' || tab === 'baseline') && (
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-4">基线（Baseline）</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Term labelKey="win_rate" type="metric">胜率（Win Rate）</Term>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(data.baseline.win_rate * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Term labelKey="floor_ecpm" type="metric">底价 eCPM（Floor eCPM）</Term>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.baseline.floor_ecpm.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <Term labelKey="bid_ecpm_quantiles" type="field">出价 eCPM 分位数（Bid eCPM Quantiles）</Term>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {quantiles.map((q) => (
                    <div key={q.key} className="bg-white rounded p-2 border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{q.label}</span>
                        <span className="text-lg font-bold text-blue-700">
                          {data.baseline.bid_ecpm_quantiles[q.key]?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{q.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Term labelKey="timeout_rate" type="metric">超时率（Timeout Rate）</Term>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {(data.baseline.timeout_rate * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {(tab === 'compare' || tab === 'treatment') && (
          <div>
            <h3 className="text-lg font-semibold text-blue-500 mb-4">实验组（Treatment）</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Term labelKey="win_rate" type="metric">胜率（Win Rate）</Term>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(data.treatment.win_rate * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Term labelKey="floor_ecpm" type="metric">底价 eCPM（Floor eCPM）</Term>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.treatment.floor_ecpm.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <Term labelKey="bid_ecpm_quantiles" type="field">出价 eCPM 分位数（Bid eCPM Quantiles）</Term>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {quantiles.map((q) => (
                    <div key={q.key} className="bg-white rounded p-2 border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{q.label}</span>
                        <span className="text-lg font-bold text-blue-500">
                          {data.treatment.bid_ecpm_quantiles[q.key]?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{q.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Term labelKey="timeout_rate" type="metric">超时率（Timeout Rate）</Term>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {(data.treatment.timeout_rate * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
