'use client'

import { useMemo } from 'react'
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import { formatLift, safeFormatNumber } from '@/lib/utils'

interface QueryConversionFunnelProps {
  data: {
    query_stats?: {
      top_queries: Array<{
        query: string
        intent: string
        baseline: {
          impressions: number
          clicks: number
          ctr: number
          lp_views: number
          form_submits?: number
          leads: number
          cvr: number
        }
        treatment: {
          impressions: number
          clicks: number
          ctr: number
          lp_views: number
          form_submits?: number
          leads: number
          cvr: number
        }
        issue_tag?: 'high_ctr_low_cvr' | 'high_cvr_low_volume' | 'low_ctr' | 'low_cvr'
        post_click_bounce_rate?: number
      }>
    }
  }
  narrative: string
}

export default function QueryConversionFunnel({ data, narrative }: QueryConversionFunnelProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const queryStats = data.query_stats

  // 计算整体漏斗指标
  const funnelMetrics = useMemo(() => {
    if (!queryStats?.top_queries || queryStats.top_queries.length === 0) {
      return null
    }

    const baseline = queryStats.top_queries.reduce(
      (acc, q) => ({
        impressions: acc.impressions + q.baseline.impressions,
        clicks: acc.clicks + q.baseline.clicks,
        lp_views: acc.lp_views + q.baseline.lp_views,
        form_submits: acc.form_submits + (q.baseline.form_submits || 0),
        leads: acc.leads + q.baseline.leads,
      }),
      { impressions: 0, clicks: 0, lp_views: 0, form_submits: 0, leads: 0 }
    )

    const treatment = queryStats.top_queries.reduce(
      (acc, q) => ({
        impressions: acc.impressions + q.treatment.impressions,
        clicks: acc.clicks + q.treatment.clicks,
        lp_views: acc.lp_views + q.treatment.lp_views,
        form_submits: acc.form_submits + (q.treatment.form_submits || 0),
        leads: acc.leads + q.treatment.leads,
      }),
      { impressions: 0, clicks: 0, lp_views: 0, form_submits: 0, leads: 0 }
    )

    const current = view === 'baseline' ? baseline : treatment

    // CTR = clicks / impressions
    const ctr = current.impressions > 0 ? current.clicks / current.impressions : 0
    const baselineCtr = baseline.impressions > 0 ? baseline.clicks / baseline.impressions : 0

    // Post-click CVR = lp_views / clicks (点击后落地页浏览率)
    const postClickCvr = current.clicks > 0 ? current.lp_views / current.clicks : 0
    const baselinePostClickCvr = baseline.clicks > 0 ? baseline.lp_views / baseline.clicks : 0

    // Landing bounce = 1 - (form_submits / lp_views) (落地页跳出率)
    const landingBounce = current.lp_views > 0 ? 1 - (current.form_submits / current.lp_views) : 1
    const baselineLandingBounce = baseline.lp_views > 0 ? 1 - (baseline.form_submits / baseline.lp_views) : 1

    // 最终转化率 = leads / impressions
    const finalCvr = current.impressions > 0 ? current.leads / current.impressions : 0
    const baselineFinalCvr = baseline.impressions > 0 ? baseline.leads / baseline.impressions : 0

    return {
      baseline: {
        ctr: baselineCtr,
        postClickCvr: baselinePostClickCvr,
        landingBounce: baselineLandingBounce,
        finalCvr: baselineFinalCvr,
      },
      treatment: {
        ctr,
        postClickCvr,
        landingBounce,
        finalCvr,
      },
      current: {
        ctr,
        postClickCvr,
        landingBounce,
        finalCvr,
      },
    }
  }, [queryStats, view])

  // 找出 Top 3 异常 query
  const abnormalQueries = useMemo(() => {
    if (!queryStats?.top_queries) return []

    return queryStats.top_queries
      .filter((q) => {
        const treatment = q.treatment
        const baseline = q.baseline

        // 异常判断：高点击低转化、低点击、低转化、高跳出率
        const isHighCtrLowCvr = treatment.ctr > 0.03 && treatment.cvr < 0.012
        const isLowCtr = treatment.ctr < 0.015
        const isLowCvr = treatment.cvr < 0.008
        const bounceRate = treatment.lp_views > 0 ? 1 - ((treatment.form_submits || 0) / treatment.lp_views) : 1
        const isHighBounce = bounceRate > 0.7

        return isHighCtrLowCvr || isLowCtr || isLowCvr || isHighBounce || q.issue_tag
      })
      .sort((a, b) => {
        // 按异常严重程度排序：高点击低转化 > 高跳出率 > 低转化 > 低点击
        const aTreatment = a.treatment
        const bTreatment = b.treatment

        const aScore =
          (aTreatment.ctr > 0.03 && aTreatment.cvr < 0.012 ? 100 : 0) +
          (aTreatment.lp_views > 0 ? (1 - ((aTreatment.form_submits || 0) / aTreatment.lp_views)) * 50 : 0) +
          (aTreatment.cvr < 0.008 ? 30 : 0) +
          (aTreatment.ctr < 0.015 ? 10 : 0)

        const bScore =
          (bTreatment.ctr > 0.03 && bTreatment.cvr < 0.012 ? 100 : 0) +
          (bTreatment.lp_views > 0 ? (1 - ((bTreatment.form_submits || 0) / bTreatment.lp_views)) * 50 : 0) +
          (bTreatment.cvr < 0.008 ? 30 : 0) +
          (bTreatment.ctr < 0.015 ? 10 : 0)

        return bScore - aScore
      })
      .slice(0, 3)
      .map((q) => {
        const treatment = q.treatment
        const baseline = q.baseline
        const bounceRate = treatment.lp_views > 0 ? 1 - ((treatment.form_submits || 0) / treatment.lp_views) : 1

        let issueType = ''
        if (treatment.ctr > 0.03 && treatment.cvr < 0.012) {
          issueType = '高点击低转化'
        } else if (bounceRate > 0.7) {
          issueType = '高跳出率'
        } else if (treatment.cvr < 0.008) {
          issueType = '低转化率'
        } else if (treatment.ctr < 0.015) {
          issueType = '低点击率'
        } else {
          issueType = '异常'
        }

        return {
          query: q.query,
          intent: q.intent,
          ctr: treatment.ctr,
          postClickCvr: treatment.clicks > 0 ? treatment.lp_views / treatment.clicks : 0,
          landingBounce: bounceRate,
          finalCvr: treatment.cvr,
          issueType,
        }
      })
  }, [queryStats])

  if (!queryStats?.top_queries || queryStats.top_queries.length === 0) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Query 动线转化</h2>
        <p className="text-sm text-gray-500 mb-4">{narrative.split('。')[0] || narrative.substring(0, 50)}</p>
        <div className="text-sm text-gray-400 text-center py-8">暂无数据</div>
      </div>
    )
  }

  if (!funnelMetrics) {
    return null
  }

  const current = funnelMetrics.current
  const baseline = funnelMetrics.baseline

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Query 动线转化</h2>
      <p className="text-sm text-gray-500 mb-6">{narrative.split('。')[0] || narrative.substring(0, 50)}</p>

      {/* 漏斗指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* CTR */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">CTR(点击率)</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {tab === 'compare' ? (
              <>
                {(baseline.ctr * 100).toFixed(2)}% → {(current.ctr * 100).toFixed(2)}%
                <span className="text-sm ml-2 text-blue-600">
                  ({formatLift(baseline.ctr, current.ctr)})
                </span>
              </>
            ) : (
              `${(current.ctr * 100).toFixed(2)}%`
            )}
          </div>
          <div className="text-xs text-gray-400">Query → 点击</div>
        </div>

        {/* Post-click CVR */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Post-click CVR(点击后落地页浏览率)</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {tab === 'compare' ? (
              <>
                {(baseline.postClickCvr * 100).toFixed(2)}% → {(current.postClickCvr * 100).toFixed(2)}%
                <span className="text-sm ml-2 text-blue-600">
                  ({formatLift(baseline.postClickCvr, current.postClickCvr)})
                </span>
              </>
            ) : (
              `${(current.postClickCvr * 100).toFixed(2)}%`
            )}
          </div>
          <div className="text-xs text-gray-400">点击 → 落地页</div>
        </div>

        {/* Landing Bounce */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Landing Bounce(落地页跳出率)</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {tab === 'compare' ? (
              <>
                {(baseline.landingBounce * 100).toFixed(2)}% → {(current.landingBounce * 100).toFixed(2)}%
                <span className="text-sm ml-2 text-red-600">
                  ({formatLift(baseline.landingBounce, current.landingBounce)})
                </span>
              </>
            ) : (
              `${(current.landingBounce * 100).toFixed(2)}%`
            )}
          </div>
          <div className="text-xs text-gray-400">落地页 → 提交</div>
        </div>

        {/* 最终转化率 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">最终转化率</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {tab === 'compare' ? (
              <>
                {(baseline.finalCvr * 100).toFixed(2)}% → {(current.finalCvr * 100).toFixed(2)}%
                <span className="text-sm ml-2 text-blue-600">
                  ({formatLift(baseline.finalCvr, current.finalCvr)})
                </span>
              </>
            ) : (
              `${(current.finalCvr * 100).toFixed(2)}%`
            )}
          </div>
          <div className="text-xs text-gray-400">Query → 转化</div>
        </div>
      </div>

      {/* Top 3 异常 Query 列表 */}
      {abnormalQueries.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 异常 Query</h3>
          <div className="space-y-3">
            {abnormalQueries.map((q, idx) => (
              <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{q.query}</span>
                    <span className="text-xs text-gray-500 ml-2">({q.intent})</span>
                  </div>
                  <span className="px-2 py-0.5 bg-red-200 text-red-700 rounded text-xs font-medium">
                    {q.issueType}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                  <div>
                    <div className="text-gray-500">CTR</div>
                    <div className="font-semibold text-gray-900">{(q.ctr * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Post-click CVR</div>
                    <div className="font-semibold text-gray-900">{(q.postClickCvr * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Landing Bounce</div>
                    <div className="font-semibold text-red-600">{(q.landingBounce * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">最终转化率</div>
                    <div className="font-semibold text-gray-900">{(q.finalCvr * 100).toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



