'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { parseTab } from '@/lib/client/urlState'
import { safeFormatNumber } from '@/lib/utils'
import { formatPercent } from '@/lib/format'
import type { DSPMetrics, SSPMetrics, ADXMetrics } from '@/lib/types/adx'
import EmptyState from '@/components/EmptyState'

interface BiddingBudgetPanelProps {
  data: {
    bid_strategy?: any
    pacing?: any
    bidding_budget?: { dsp?: DSPMetrics }
    supply_coverage?: { ssp?: SSPMetrics }
    adx_exchange?: { adx?: ADXMetrics }
  }
  narrative: string
  pipeline?: any
}

type VariantPair<T = any> = { baseline?: T; treatment?: T }

function normalizePair(v: any): VariantPair<number | string> | null {
  if (v == null) return null
  // common case: { baseline, treatment }
  if (typeof v === 'object') return { baseline: v.baseline, treatment: v.treatment }
  // fallback: single value (treat as both to avoid crash)
  return { baseline: v, treatment: v }
}

function PanelInner({ data, narrative, pipeline }: BiddingBudgetPanelProps) {
  const searchParams = useSearchParams()
  const activeTab = parseTab(searchParams?.get('tab'))

  const narrativeText = typeof narrative === 'string' ? narrative : ''
  const narrativeFirstLine =
    narrativeText.split('。')[0] || (narrativeText ? narrativeText.substring(0, 50) : '暂无结论')

  const bid = data?.bid_strategy || {}
  const bidBase = bid?.baseline && typeof bid.baseline === 'object' ? bid.baseline : {}
  const bidTreat = bid?.treatment && typeof bid.treatment === 'object' ? bid.treatment : {}

  const pacing = data?.pacing || {}
  const paceBase = pacing?.baseline && typeof pacing.baseline === 'object' ? pacing.baseline : {}
  const paceTreat = pacing?.treatment && typeof pacing.treatment === 'object' ? pacing.treatment : {}

  const dsp = data?.bidding_budget?.dsp ?? pipeline?.bidding_budget?.dsp
  const ssp = data?.supply_coverage?.ssp ?? pipeline?.supply_coverage?.ssp
  const adx = data?.adx_exchange?.adx ?? pipeline?.adx_exchange?.adx

  const hasData =
    Object.keys(bidBase).length > 0 ||
    Object.keys(bidTreat).length > 0 ||
    Object.keys(paceBase).length > 0 ||
    Object.keys(paceTreat).length > 0 ||
    dsp != null ||
    ssp != null ||
    adx != null

  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold mb-2">出价 & 预算</h2>
        <p className="text-sm text-gray-600 mb-3">{narrativeFirstLine}</p>
        <EmptyState title="暂无出价和预算数据" message="bid_strategy、pacing、bidding_budget 等字段缺失" />
      </div>
    )
  }

  const renderNumber = (v: any) => safeFormatNumber(v ?? 0)
  const renderRate = (v: any, d = 2) =>
    v == null || Number.isNaN(Number(v)) ? '—' : formatPercent(Number(v), d)

  const ecpm = normalizePair((dsp as any)?.ecpm)
  const cpa = normalizePair((dsp as any)?.cpa)
  const spend = normalizePair((dsp as any)?.spend)

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold mb-2">出价 & 预算</h2>
      <p className="text-sm text-gray-600 mb-3">{narrativeFirstLine}</p>

      <div className="space-y-6">
        {dsp != null && (
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <h3 className="font-semibold text-purple-800 mb-3">DSP（需求方平台）</h3>

            {ecpm == null && cpa == null && spend == null ? (
              <div className="text-sm text-purple-700">暂无可展示指标</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ecpm != null && (
                  <div>
                    <div className="text-xs text-purple-600 mb-1">eCPM</div>
                    <div className="text-sm font-semibold text-purple-900">
                      {activeTab === 'compare'
                        ? `${renderNumber(ecpm.baseline)} → ${renderNumber(ecpm.treatment)}`
                        : renderNumber(activeTab === 'baseline' ? ecpm.baseline : ecpm.treatment)}
                    </div>
                  </div>
                )}

                {cpa != null && (
                  <div>
                    <div className="text-xs text-purple-600 mb-1">CPA</div>
                    <div className="text-sm font-semibold text-purple-900">
                      {activeTab === 'compare'
                        ? `${renderNumber(cpa.baseline)} → ${renderNumber(cpa.treatment)}`
                        : renderNumber(activeTab === 'baseline' ? cpa.baseline : cpa.treatment)}
                    </div>
                  </div>
                )}

                {spend != null && (
                  <div>
                    <div className="text-xs text-purple-600 mb-1">Spend</div>
                    <div className="text-sm font-semibold text-purple-900">
                      {activeTab === 'compare'
                        ? `${renderNumber(spend.baseline)} → ${renderNumber(spend.treatment)}`
                        : renderNumber(activeTab === 'baseline' ? spend.baseline : spend.treatment)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(bidBase.type || bidTreat.type) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">出价策略</h3>
            <div className="space-y-2">
              <div className="text-sm">
                策略类型：{' '}
                {activeTab === 'compare'
                  ? `${bidBase.type ?? '—'} → ${bidTreat.type ?? '—'}`
                  : activeTab === 'baseline'
                  ? bidBase.type ?? '—'
                  : bidTreat.type ?? '—'}
              </div>
              <div className="text-sm">
                目标：{' '}
                {activeTab === 'compare'
                  ? `${bidBase.target ?? '—'} → ${bidTreat.target ?? '—'}`
                  : activeTab === 'baseline'
                  ? bidBase.target ?? '—'
                  : bidTreat.target ?? '—'}
              </div>
              {(bidBase.floor_ecpm != null || bidTreat.floor_ecpm != null) && (
                <div className="text-sm">
                  底价 eCPM：{' '}
                  {activeTab === 'compare'
                    ? `${renderNumber(bidBase.floor_ecpm)} → ${renderNumber(bidTreat.floor_ecpm)}`
                    : renderNumber(activeTab === 'baseline' ? bidBase.floor_ecpm : bidTreat.floor_ecpm)}
                </div>
              )}
            </div>
          </div>
        )}

        {(paceBase.type || paceTreat.type) && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">预算节奏</h3>
            <div className="space-y-2">
              <div className="text-sm">
                类型：{' '}
                {activeTab === 'compare'
                  ? `${paceBase.type ?? '—'} → ${paceTreat.type ?? '—'}`
                  : activeTab === 'baseline'
                  ? paceBase.type ?? '—'
                  : paceTreat.type ?? '—'}
              </div>
              <div className="text-sm">
                日预算：{' '}
                {activeTab === 'compare'
                  ? `${renderNumber(paceBase.daily_budget)} → ${renderNumber(paceTreat.daily_budget)}`
                  : renderNumber(activeTab === 'baseline' ? paceBase.daily_budget : paceTreat.daily_budget)}
              </div>
              {(paceBase.early_hour_spend_cap != null || paceTreat.early_hour_spend_cap != null) && (
                <div className="text-sm">
                  早高峰上限：{' '}
                  {activeTab === 'compare'
                    ? `${renderRate(paceBase.early_hour_spend_cap)} → ${renderRate(paceTreat.early_hour_spend_cap)}`
                    : renderRate(
                        activeTab === 'baseline'
                          ? paceBase.early_hour_spend_cap
                          : paceTreat.early_hour_spend_cap
                      )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BiddingBudgetPanel(props: BiddingBudgetPanelProps) {
  // ✅ Next.js 静态/导出时 useSearchParams 需要 Suspense 包裹，否则 build/preview 可能报错
  return (
    <Suspense
      fallback={
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-2">出价 & 预算</h2>
          <div className="text-sm text-gray-500">加载中…</div>
        </div>
      }
    >
      <PanelInner {...props} />
    </Suspense>
  )
}
