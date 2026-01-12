'use client'

import { useSearchParams } from 'next/navigation'
import { parseTab } from '@/lib/client/urlState'
import Term from '@/components/Term'
import { formatTerm } from '@/lib/glossary'
import { safePercentChange, formatPercentChange } from '@/lib/utils'
import { formatPercent } from '@/lib/format'
import EmptyState from '@/components/EmptyState'
import { ensureObject } from '@/lib/utils-safe'

interface AuctionBidPanelProps {
  auction: {
    baseline: {
      floor_ecpm: number
      win_rate: number
      timeout_rate: number
      fill_rate?: number
      bid_ecpm_quantiles: Record<string, number>
    }
    treatment: {
      floor_ecpm: number
      win_rate: number
      timeout_rate: number
      fill_rate?: number
      bid_ecpm_quantiles: Record<string, number>
    }
  }
  bid?: {
    strategy: {
      type: string
      target: string
      multiplier_cap?: number[]
      notes?: string
    }
    pacing: {
      type: string
      daily_budget: number
      early_hour_spend_cap?: number
      notes?: string
    }
  }
  reasons?: {
    auction?: {
      baseline: Record<string, number>
      treatment: Record<string, number>
    }
  }
  narrative: string
}

export default function AuctionBidPanel({ auction, bid, reasons, narrative }: AuctionBidPanelProps) {
  // 【最小可控改动】直接从 URL 读取 tab，不使用 Context
  const searchParams = useSearchParams()
  const activeTab = parseTab(searchParams?.get('tab'))
  const narrativeFirstLine = narrative?.split('。')[0] || narrative?.substring(0, 50) || ''

  const quantiles = [
    { key: 'p10', label: '10%分位数（最低10%的出价）', desc: '表示有10%的出价低于这个值' },
    { key: 'p50', label: '50%分位数（中位数）', desc: '表示有一半的出价低于这个值' },
    { key: 'p90', label: '90%分位数（最高10%的出价）', desc: '表示有90%的出价低于这个值' },
  ]

  // 【强容错】直接使用 auction，如果不存在则使用默认值
  const safeAuction = auction || {
    baseline: {
      floor_ecpm: null as number | null,
      win_rate: null as number | null,
      timeout_rate: null as number | null,
      fill_rate: undefined as number | undefined,
      bid_ecpm_quantiles: {} as Record<string, number>,
    },
    treatment: {
      floor_ecpm: null as number | null,
      win_rate: null as number | null,
      timeout_rate: null as number | null,
      fill_rate: undefined as number | undefined,
      bid_ecpm_quantiles: {} as Record<string, number>,
    },
  }
  // 安全读取：如果字段不存在，返回 null 而不是 0
  const baseline = {
    floor_ecpm: (safeAuction.baseline?.floor_ecpm ?? null) as number | null,
    win_rate: (safeAuction.baseline?.win_rate ?? null) as number | null,
    timeout_rate: (safeAuction.baseline?.timeout_rate ?? null) as number | null,
    fill_rate: safeAuction.baseline?.fill_rate,
    bid_ecpm_quantiles: safeAuction.baseline?.bid_ecpm_quantiles ?? {},
  }
  const treatment = {
    floor_ecpm: (safeAuction.treatment?.floor_ecpm ?? null) as number | null,
    win_rate: (safeAuction.treatment?.win_rate ?? null) as number | null,
    timeout_rate: (safeAuction.treatment?.timeout_rate ?? null) as number | null,
    fill_rate: safeAuction.treatment?.fill_rate,
    bid_ecpm_quantiles: safeAuction.treatment?.bid_ecpm_quantiles ?? {},
  }
  
  // 如果 auction 完全缺失，显示 EmptyState
  // 检查时使用 != null 而不是 truthy，因为 0 是有效值
  const hasData = (baseline.win_rate != null || treatment.win_rate != null || 
                   baseline.floor_ecpm != null || treatment.floor_ecpm != null ||
                   baseline.timeout_rate != null || treatment.timeout_rate != null)
  if (!auction || !hasData) {
    return (
      <div id="auction-bid" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">拍卖&出价</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <EmptyState title="暂无拍卖数据" message="pipeline.auction 字段缺失或为空" />
      </div>
    )
  }

  // 计算差异（使用安全函数）
  // win_rate 和 timeout_rate 是 0-1 小数，需要 * 100 转百分比
  const winRateChange = (baseline.win_rate != null && treatment.win_rate != null)
    ? safePercentChange(baseline.win_rate * 100, treatment.win_rate * 100)
    : null
  const timeoutChange = (baseline.timeout_rate != null && treatment.timeout_rate != null)
    ? safePercentChange(baseline.timeout_rate * 100, treatment.timeout_rate * 100)
    : null
  const floorChange = (baseline.floor_ecpm != null && treatment.floor_ecpm != null)
    ? safePercentChange(baseline.floor_ecpm, treatment.floor_ecpm)
    : null
  // 【修复】fill_rate 缺失时不要计算 change
  const fillRateChange = (baseline.fill_rate != null && treatment.fill_rate != null && 
                          typeof baseline.fill_rate === 'number' && typeof treatment.fill_rate === 'number')
    ? safePercentChange(baseline.fill_rate * 100, treatment.fill_rate * 100)
    : null

  // 拍卖原因分布
  const auctionReasons = reasons?.auction
  const reasonData = auctionReasons ? Object.keys(auctionReasons.baseline || auctionReasons.treatment || {}).map(key => ({
    reason: key,
    baseline: (auctionReasons.baseline?.[key] || 0) * 100,
    treatment: (auctionReasons.treatment?.[key] || 0) * 100,
    diff: ((auctionReasons.treatment?.[key] || 0) - (auctionReasons.baseline?.[key] || 0)) * 100,
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)) : []

  return (
    <div id="auction-bid" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">拍卖&出价</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">
        📊 差异摘要：胜率 {winRateChange !== null ? formatPercentChange(winRateChange) : '--'}；超时率 {timeoutChange !== null ? formatPercentChange(timeoutChange) : '--'}；底价 {floorChange !== null ? formatPercentChange(floorChange) : '--'}{fillRateChange !== null ? `；填充率 ${formatPercentChange(fillRateChange)}` : ''}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 拍卖监控 */}
        <div className="lg:col-span-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">拍卖监控</h3>
          <div className={`grid gap-4 ${activeTab === 'compare' ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {(activeTab === 'compare' || activeTab === 'baseline') && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-700 mb-3">基线（Baseline）</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="win_rate" type="metric">胜率（Win Rate）</Term>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {formatPercent(baseline.win_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="floor_ecpm" type="metric">底价 eCPM（Floor eCPM）</Term>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {baseline.floor_ecpm != null && typeof baseline.floor_ecpm === 'number'
                        ? baseline.floor_ecpm.toFixed(2)
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="fill_rate" type="metric">填充率（Fill Rate）</Term>
                    </div>
                    <div className="text-lg font-semibold text-blue-400">
                      {formatPercent(baseline.fill_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="timeout_rate" type="metric">超时率（Timeout Rate）</Term>
                    </div>
                    <div className="text-lg font-semibold text-blue-400">
                      {formatPercent(baseline.timeout_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Term labelKey="bid_ecpm_quantiles" type="field">出价 eCPM 分位数</Term>
                    </div>
                    <div className="bg-white rounded-lg p-2 space-y-1.5">
                      {quantiles.map((q) => (
                        <div key={q.key} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{q.label}</span>
                          <span className="text-sm font-bold text-blue-400">
                            {baseline.bid_ecpm_quantiles?.[q.key]?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(activeTab === 'compare' || activeTab === 'treatment') && (
              <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">实验组（Treatment）</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="win_rate" type="metric">胜率（Win Rate）</Term>
                    </div>
                    <div className="text-2xl font-bold text-blue-800">
                      {formatPercent(treatment.win_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="floor_ecpm" type="metric">底价 eCPM（Floor eCPM）</Term>
                    </div>
                    <div className="text-2xl font-bold text-blue-800">
                      {treatment.floor_ecpm != null && typeof treatment.floor_ecpm === 'number'
                        ? treatment.floor_ecpm.toFixed(2)
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="fill_rate" type="metric">填充率（Fill Rate）</Term>
                    </div>
                    <div className="text-lg font-semibold text-blue-800">
                      {formatPercent(treatment.fill_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                      <Term labelKey="timeout_rate" type="metric">超时率（Timeout Rate）</Term>
                    </div>
                    <div className="text-lg font-semibold text-blue-800">
                      {formatPercent(treatment.timeout_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                      <Term labelKey="bid_ecpm_quantiles" type="field">出价 eCPM 分位数</Term>
                    </div>
                    <div className="bg-white rounded-lg p-2 space-y-1.5">
                      {quantiles.map((q) => (
                        <div key={q.key} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{q.label}</span>
                          <span className="text-sm font-bold text-blue-800">
                            {treatment.bid_ecpm_quantiles?.[q.key]?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 拍卖原因分布 */}
          {reasonData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">拍卖拒绝原因</h4>
              <div className="space-y-2">
                {reasonData.slice(0, 5).map((item) => (
                  <div key={item.reason} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        <Term labelKey={item.reason} type="reason" />
                      </span>
                      <span className={`text-sm font-semibold ${item.diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {item.diff > 0 ? '+' : ''}{item.diff.toFixed(1)}pp
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(activeTab === 'compare' || activeTab === 'baseline') && (
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 w-12">基线</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-400 rounded-full" 
                                style={{ width: `${Math.min(item.baseline, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">{item.baseline.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                      {(activeTab === 'compare' || activeTab === 'treatment') && (
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 w-12">实验组</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-800 rounded-full" 
                                style={{ width: `${Math.min(item.treatment, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">{item.treatment.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 出价策略&节奏 */}
        {bid && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">出价策略&节奏</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">出价策略</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">类型：</span>
                    <span className="font-medium text-gray-900">{bid.strategy.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">目标：</span>
                    <span className="font-medium text-gray-900">{bid.strategy.target}</span>
                  </div>
                  {bid.strategy.multiplier_cap && (
                    <div>
                      <span className="text-gray-600">倍率范围：</span>
                      <span className="font-medium text-gray-900">
                        {bid.strategy.multiplier_cap[0]} - {bid.strategy.multiplier_cap[1]}
                      </span>
                    </div>
                  )}
                  {bid.strategy.notes && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-white rounded border border-gray-200">
                      {bid.strategy.notes}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">预算节奏</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">类型：</span>
                    <span className="font-medium text-gray-900">{bid.pacing.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">日预算：</span>
                    <span className="font-medium text-gray-900">{bid.pacing.daily_budget.toLocaleString()}</span>
                  </div>
                  {bid.pacing.early_hour_spend_cap && (
                    <div>
                      <span className="text-gray-600">早时段上限：</span>
                      <span className="font-medium text-gray-900">{(bid.pacing.early_hour_spend_cap * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {bid.pacing.notes && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-white rounded border border-gray-200">
                      {bid.pacing.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

