import type { ExperimentData } from '@/lib/data-loader'

type AnyObj = Record<string, any>

function ensureArray<T = any>(value: any): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function ensureObject<T extends AnyObj = AnyObj>(value: any): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : ({} as T)
}

function ensureNonEmptyObject<T extends AnyObj = AnyObj>(value: any): T | null {
  const obj = ensureObject<T>(value)
  return Object.keys(obj).length ? obj : null
}

/**
 * 修复点：
 * - 可选模块缺失时不再返回 {}，改为返回 null
 * - 避免 React 条件渲染误判为“有数据”，从而读 undefined 导致 500
 */
export function normalizePipeline(experiment: ExperimentData) {
  const rawPipeline = ensureObject((experiment as any)?.pipeline)
  const adxV1 = ensureObject((experiment as any)?._adx_v1)

  // v1 里可能有 bidding_budget / supply_coverage / adx_exchange / reasons
  const v1BiddingBudget = ensureNonEmptyObject(adxV1.bidding_budget)
  const v1SupplyCoverage = ensureNonEmptyObject(adxV1.supply_coverage)
  const v1AdxExchange = ensureNonEmptyObject(adxV1.adx_exchange)
  const v1Reasons = ensureNonEmptyObject(adxV1.reasons)

  // funnel / category_dist / topN_feed 必须给默认值
  const funnelRaw = ensureObject(rawPipeline.funnel)
  const funnel = {
    baseline: ensureObject(funnelRaw.baseline),
    treatment: ensureObject(funnelRaw.treatment),
  }

  const categoryRaw = ensureObject(rawPipeline.category_dist)
  const category_dist = {
    baseline: ensureObject(categoryRaw.baseline),
    treatment: ensureObject(categoryRaw.treatment),
  }

  const topNRaw = ensureObject(rawPipeline.topN_feed)
  const topN_feed = {
    baseline: ensureArray(topNRaw.baseline),
    treatment: ensureArray(topNRaw.treatment),
  }

  // 可选模块：缺失/空对象 -> null
  const query_stats = ensureNonEmptyObject(rawPipeline.query_stats)
  const query_intent = ensureNonEmptyObject(rawPipeline.query_intent)
  const query_report = ensureNonEmptyObject(rawPipeline.query_report)
  const landing_stats = ensureNonEmptyObject(rawPipeline.landing_stats)

  const coverage_breakdown = ensureNonEmptyObject(rawPipeline.coverage_breakdown)
  const search = ensureNonEmptyObject(rawPipeline.search)
  const supply = ensureNonEmptyObject(rawPipeline.supply)

  const bid_strategy = ensureNonEmptyObject(rawPipeline.bid_strategy)
  const pacing = ensureNonEmptyObject(rawPipeline.pacing)
  const auction = ensureNonEmptyObject(rawPipeline.auction)
  const bid = ensureNonEmptyObject(rawPipeline.bid)

  // 兼容 reasons / bidding_budget / supply_coverage / adx_exchange 从 v1 注入
  const reasons = ensureNonEmptyObject(rawPipeline.reasons) || v1Reasons
  const bidding_budget = ensureNonEmptyObject(rawPipeline.bidding_budget) || v1BiddingBudget
  const supply_coverage = ensureNonEmptyObject(rawPipeline.supply_coverage) || v1SupplyCoverage
  const adx_exchange = ensureNonEmptyObject(rawPipeline.adx_exchange) || v1AdxExchange

  // ocpx timeseries（如果有）
  const ocpx_timeseries = ensureNonEmptyObject((rawPipeline as any).ocpx_timeseries)

  return {
    funnel,
    category_dist,
    topN_feed,

    query_stats,
    query_intent,
    query_report,
    landing_stats,

    coverage_breakdown,
    search,
    supply,

    bid_strategy,
    pacing,
    auction,
    bid,

    reasons,
    bidding_budget,
    supply_coverage,
    adx_exchange,

    ocpx_timeseries,
  }
}



