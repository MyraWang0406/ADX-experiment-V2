import type { ExperimentData } from '@/lib/data-loader'

function ensureArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? value : []
}

function ensureObject<T = any>(value: any): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : ({} as T)
}

function toNumber(v: any): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * 统一 pipeline schema，兼容：
 * - v2: pipeline.funnel / ocpx_timeseries(对象结构) / query_stats ...
 * - adx_v1: pipeline.reasons(rerank/auction) / bidding_budget.dsp.ocpx(标量) ...
 */
export function normalizePipeline(experiment: ExperimentData): any {
  const rawPipeline = ensureObject<any>((experiment as any)?.pipeline)
  const adxV1 = ensureObject<any>((experiment as any)?._adx_v1)

  // --- OCPX timeseries：不要破坏 v2 对象结构 ---
  // v2: ocpx_timeseries = { baseline:{multiplier:[]...}, treatment:{...}, hours:[] }
  // v1: 可能只有 bidding_budget.dsp.ocpx = { baseline: number, treatment: number }
  let ocpx_timeseries: any = null

  const ocpxRaw = rawPipeline?.ocpx_timeseries
  if (ocpxRaw && typeof ocpxRaw === 'object') {
    // ✅ 直接保留原始结构（关键修复）
    ocpx_timeseries = ocpxRaw
  } else {
    const ocpxScalar =
      rawPipeline?.bidding_budget?.dsp?.ocpx ||
      adxV1?.bidding_budget?.dsp?.ocpx ||
      rawPipeline?.bidding_budget?.ocpx ||
      adxV1?.bidding_budget?.ocpx

    if (ocpxScalar && typeof ocpxScalar === 'object') {
      const b = toNumber(ocpxScalar.baseline)
      const t = toNumber(ocpxScalar.treatment)
      if (b || t) {
        // ✅ 造一个最小 timeseries，让 OCPXCurve 至少能画出“1 个点”
        ocpx_timeseries = {
          baseline: { multiplier: [b], actual_cpa: [], spend: [], target_cpa: [] },
          treatment: { multiplier: [t], actual_cpa: [], spend: [], target_cpa: [] },
          hours: [0],
        }
      }
    }
  }

  return {
    // funnel
    funnel: ensureObject(rawPipeline?.funnel) || { baseline: {}, treatment: {} },

    // category dist
    category_dist: ensureObject(rawPipeline?.category_dist) || { baseline: {}, treatment: {} },

    // topN
    topN_feed: ensureObject(rawPipeline?.topN_feed) || { baseline: [], treatment: [] },

    // query
    query_stats: ensureObject(rawPipeline?.query_stats),
    query_intent: ensureObject(rawPipeline?.query_intent),
    query_report: ensureObject(rawPipeline?.query_report),

    // landing
    landing_stats: ensureObject(rawPipeline?.landing_stats),

    // coverage
    coverage_breakdown: ensureObject(rawPipeline?.coverage_breakdown),

    // search / supply
    search: ensureObject(rawPipeline?.search),
    supply: ensureObject(rawPipeline?.supply),

    // bidding / pacing / auction
    bid_strategy: ensureObject(rawPipeline?.bid_strategy),
    pacing: ensureObject(rawPipeline?.pacing),
    auction: ensureObject(rawPipeline?.auction),
    bid: ensureObject(rawPipeline?.bid),

    // reasons：v1 是 rerank/auction 数组；v2 可能是 baseline/treatment 结构 —— 都保留原样
    reasons: rawPipeline?.reasons || adxV1?.reasons || {},

    // adx v1 额外结构（用于面板展示）
    bidding_budget: rawPipeline?.bidding_budget || adxV1?.bidding_budget,
    supply_coverage: rawPipeline?.supply_coverage || adxV1?.supply_coverage,
    adx_exchange: rawPipeline?.adx_exchange || adxV1?.adx_exchange,

    // ✅ OCPX（修复点）
    ocpx_timeseries: ocpx_timeseries || rawPipeline?.ocpx_timeseries || { baseline: {}, treatment: {}, hours: [] },
  }
}
