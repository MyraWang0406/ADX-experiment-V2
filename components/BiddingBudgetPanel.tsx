'use client'

import { useSearchParams } from 'next/navigation'
import { parseTab } from '@/lib/client/urlState'
import { safeFormatNumber } from '@/lib/utils'
import { formatPercent } from '@/lib/format'
import type { DSPMetrics, SSPMetrics, ADXMetrics } from '@/lib/types/adx'
import EmptyState from '@/components/EmptyState'

interface BiddingBudgetPanelProps {
  data: {
    bid_strategy?: {
      baseline: {
        type: string
        target: string
        multiplier_cap?: number[]
        floor_ecpm?: number
      }
      treatment: {
        type: string
        target: string
        multiplier_cap?: number[]
        floor_ecpm?: number
      }
    }
    pacing?: {
      baseline: {
        type: string
        daily_budget: number
        early_hour_spend_cap?: number
        hourly_distribution?: Record<string, number>
      }
      treatment: {
        type: string
        daily_budget: number
        early_hour_spend_cap?: number
        hourly_distribution?: Record<string, number>
      }
    }
    bidding_budget?: {
      dsp?: DSPMetrics
    }
    supply_coverage?: {
      ssp?: SSPMetrics
    }
    adx_exchange?: {
      adx?: ADXMetrics
    }
  }
  narrative: string
  pipeline?: any
}

export default function BiddingBudgetPanel({ data, narrative, pipeline }: BiddingBudgetPanelProps) {
  // 【最小可控改动】直接从 URL 读取 tab，不使用 Context
  const searchParams = useSearchParams()
  const activeTab = parseTab(searchParams?.get('tab'))

  // narrative 兜底
  const narrativeText = typeof narrative === 'string' ? narrative : ''
  const narrativeFirstLine =
    narrativeText.split('。')[0] || (narrativeText ? narrativeText.substring(0, 50) : '暂无结论')

  // 主数据
  const bidStrategy = data?.bid_strategy
  const pacing = data?.pacing

  // DSP/SSP/ADX 支持从 data 或 pipeline 读（你说要兼容 pipeline/_adx_v1）
  const dsp = data?.bidding_budget?.dsp ?? pipeline?.bidding_budget?.dsp
  const ssp = data?.supply_coverage?.ssp ?? pipeline?.supply_coverage?.ssp
  const adx = data?.adx_exchange?.adx ?? pipeline?.adx_exchange?.adx

  const hasData = !!(bidStrategy || pacing || dsp || ssp || adx)

  if (!hasData) {
    return (
      <div
        id="bidding-budget"
        className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          出价&预算（Bidding & Budget）
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <EmptyState title="暂无出价和预算数据" message="bid_strategy、pacing、bidding_budget 等字段缺失" />
      </div>
    )
  }

  const renderNumber = (v: any) => safeFormatNumber(v)

  const renderRate = (v: any, digits = 2) => {
    // 使用统一的 formatPercent 函数，确保缺失值显示 "—"
    if (v == null || v === undefined) return '—'
    const n = typeof v === 'number' ? v : Number(v)
    return formatPercent(n, digits)
  }

  const pick = (obj: any, key: string) => obj?.[key]

  return (
    <div
      id="bidding-budget"
      className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        出价&预算（Bidding & Budget）
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">
        📊 分析出价策略和预算分配，优化投放效率。
      </p>

      <div className="space-y-6">
        {/* DSP */}
        {dsp && (
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <h3 className="text-base font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-200 text-purple-700 rounded text-xs font-bold">DSP</span>
              <span>需求方平台指标</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pick(dsp, 'ocpx') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">OCPX 倍率</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderNumber(dsp.ocpx.baseline)} → ${renderNumber(dsp.ocpx.treatment)}`
                      : renderNumber(activeTab === 'baseline' ? dsp.ocpx.baseline : dsp.ocpx.treatment)}
                  </div>
                </div>
              )}

              {pick(dsp, 'bid_multiplier') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">出价倍率</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderNumber(dsp.bid_multiplier.baseline)} → ${renderNumber(dsp.bid_multiplier.treatment)}`
                      : renderNumber(activeTab === 'baseline' ? dsp.bid_multiplier.baseline : dsp.bid_multiplier.treatment)}
                  </div>
                </div>
              )}

              {dsp.pacing?.early_hour_spend_cap && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">早高峰上限</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderRate(dsp.pacing.early_hour_spend_cap.baseline, 1)} → ${renderRate(
                          dsp.pacing.early_hour_spend_cap.treatment,
                          1
                        )}`
                      : renderRate(activeTab === 'baseline'
                          ? dsp.pacing.early_hour_spend_cap.baseline
                          : dsp.pacing.early_hour_spend_cap.treatment, 1)}
                  </div>
                </div>
              )}

              {pick(dsp, 'budget_exhausted_rate') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">预算耗尽率</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderRate(dsp.budget_exhausted_rate.baseline)} → ${renderRate(dsp.budget_exhausted_rate.treatment)}`
                      : renderRate(activeTab === 'baseline'
                          ? dsp.budget_exhausted_rate.baseline
                          : dsp.budget_exhausted_rate.treatment)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SSP */}
        {ssp && (
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="text-base font-semibold text-green-800 mb-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs font-bold">SSP</span>
              <span>供应方平台指标</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pick(ssp, 'fill_rate') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">填充率</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderRate(ssp.fill_rate.baseline)} → ${renderRate(ssp.fill_rate.treatment)}`
                      : renderRate(activeTab === 'baseline' ? ssp.fill_rate.baseline : ssp.fill_rate.treatment)}
                  </div>
                </div>
              )}

              {pick(ssp, 'floor_ecpm') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">底价 eCPM</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderNumber(ssp.floor_ecpm.baseline)} → ${renderNumber(ssp.floor_ecpm.treatment)}`
                      : renderNumber(activeTab === 'baseline' ? ssp.floor_ecpm.baseline : ssp.floor_ecpm.treatment)}
                  </div>
                </div>
              )}

              {pick(ssp, 'inventory_quality') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">库存质量</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderRate(ssp.inventory_quality.baseline)} → ${renderRate(ssp.inventory_quality.treatment)}`
                      : renderRate(activeTab === 'baseline'
                          ? ssp.inventory_quality.baseline
                          : ssp.inventory_quality.treatment)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADX */}
        {adx && (
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <h3 className="text-base font-semibold text-orange-800 mb-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-200 text-orange-700 rounded text-xs font-bold">ADX</span>
              <span>广告交易平台指标</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pick(adx, 'bid_response_rate') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">出价响应率</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderRate(adx.bid_response_rate.baseline)} → ${renderRate(adx.bid_response_rate.treatment)}`
                      : renderRate(activeTab === 'baseline'
                          ? adx.bid_response_rate.baseline
                          : adx.bid_response_rate.treatment)}
                  </div>
                </div>
              )}

              {pick(adx, 'timeout_rate') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">超时率</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderRate(adx.timeout_rate.baseline)} → ${renderRate(adx.timeout_rate.treatment)}`
                      : renderRate(activeTab === 'baseline'
                          ? adx.timeout_rate.baseline
                          : adx.timeout_rate.treatment)}
                  </div>
                </div>
              )}

              {pick(adx, 'clearing_price_ecpm') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">结算价 eCPM</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderNumber(adx.clearing_price_ecpm.baseline)} → ${renderNumber(adx.clearing_price_ecpm.treatment)}`
                      : renderNumber(activeTab === 'baseline'
                          ? adx.clearing_price_ecpm.baseline
                          : adx.clearing_price_ecpm.treatment)}
                  </div>
                </div>
              )}

              {pick(adx, 'bid_request_qps') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">请求 QPS</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderNumber(adx.bid_request_qps.baseline)} → ${renderNumber(adx.bid_request_qps.treatment)}`
                      : renderNumber(activeTab === 'baseline'
                          ? adx.bid_request_qps.baseline
                          : adx.bid_request_qps.treatment)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 出价策略 & 预算节奏 */}
        {/* 【修复单列布局】非 compare 模式时使用单列，避免大留白 */}
        <div className={`grid gap-6 ${activeTab === 'compare' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {bidStrategy && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">出价策略</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">策略类型</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${bidStrategy.baseline.type} → ${bidStrategy.treatment.type}`
                      : activeTab === 'baseline'
                      ? bidStrategy.baseline.type
                      : bidStrategy.treatment.type}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">目标</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${bidStrategy.baseline.target} → ${bidStrategy.treatment.target}`
                      : activeTab === 'baseline'
                      ? bidStrategy.baseline.target
                      : bidStrategy.treatment.target}
                  </div>
                </div>

                {/* 【修复】填充率：从 pipeline.auction 读取 */}
                {(() => {
                  const auctionFillRate = pipeline?.auction
                  if (auctionFillRate?.baseline?.fill_rate != null || auctionFillRate?.treatment?.fill_rate != null) {
                    return (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">填充率</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {activeTab === 'compare'
                            ? `${renderRate(auctionFillRate.baseline?.fill_rate)} → ${renderRate(auctionFillRate.treatment?.fill_rate)}`
                            : renderRate(activeTab === 'baseline' ? auctionFillRate.baseline?.fill_rate : auctionFillRate.treatment?.fill_rate)}
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                {bidStrategy.baseline.floor_ecpm !== undefined && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">底价 eCPM</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {activeTab === 'compare'
                        ? `${renderNumber(bidStrategy.baseline.floor_ecpm)} → ${renderNumber(
                            bidStrategy.treatment.floor_ecpm ?? bidStrategy.baseline.floor_ecpm
                          )}`
                        : renderNumber(
                            activeTab === 'baseline'
                              ? bidStrategy.baseline.floor_ecpm
                              : bidStrategy.treatment.floor_ecpm ?? bidStrategy.baseline.floor_ecpm
                          )}
                    </div>
                  </div>
                )}

                {bidStrategy.baseline.multiplier_cap && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">倍率范围</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {activeTab === 'compare' ? (
                        <span>
                          [{bidStrategy.baseline.multiplier_cap[0]}, {bidStrategy.baseline.multiplier_cap[1]}] → [
                          {bidStrategy.treatment.multiplier_cap?.[0] ?? bidStrategy.baseline.multiplier_cap[0]},{' '}
                          {bidStrategy.treatment.multiplier_cap?.[1] ?? bidStrategy.baseline.multiplier_cap[1]}]
                        </span>
                      ) : activeTab === 'baseline' ? (
                        `[${bidStrategy.baseline.multiplier_cap[0]}, ${bidStrategy.baseline.multiplier_cap[1]}]`
                      ) : (
                        `[${bidStrategy.treatment.multiplier_cap?.[0] ?? bidStrategy.baseline.multiplier_cap[0]}, ${
                          bidStrategy.treatment.multiplier_cap?.[1] ?? bidStrategy.baseline.multiplier_cap[1]
                        }]`
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {pacing && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">预算节奏</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">节奏类型</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${pacing.baseline.type} → ${pacing.treatment.type}`
                      : activeTab === 'baseline'
                      ? pacing.baseline.type
                      : pacing.treatment.type}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">日预算</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {activeTab === 'compare'
                      ? `${renderNumber(pacing.baseline.daily_budget)} → ${renderNumber(pacing.treatment.daily_budget)}`
                      : renderNumber(activeTab === 'baseline' ? pacing.baseline.daily_budget : pacing.treatment.daily_budget)}
                  </div>
                </div>

                {pacing.baseline.early_hour_spend_cap !== undefined && pacing.treatment.early_hour_spend_cap !== undefined && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">早高峰上限</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {activeTab === 'compare'
                        ? `${renderRate(pacing.baseline.early_hour_spend_cap, 1)} → ${renderRate(pacing.treatment.early_hour_spend_cap, 1)}`
                        : renderRate(
                            activeTab === 'baseline' ? pacing.baseline.early_hour_spend_cap : pacing.treatment.early_hour_spend_cap,
                            1
                          )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
