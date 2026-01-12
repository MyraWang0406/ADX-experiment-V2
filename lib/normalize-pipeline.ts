/**
 * Pipeline 数据统一 Normalize 函数
 * 将不同来源的数据（ADX v1 / pipeline）统一为组件可用的格式
 */

import { ensureObject, ensureArray } from './utils-safe'

export interface NormalizedPipeline {
  latency_ms: {
    baseline: Record<string, number>
    treatment: Record<string, number>
  }
  funnel: {
    baseline: Record<string, number>
    treatment: Record<string, number>
  }
  category_dist: {
    baseline: Record<string, number>
    treatment: Record<string, number>
  }
  reasons?: {
    rerank?: {
      baseline: Record<string, number>
      treatment: Record<string, number>
    }
    auction?: {
      baseline: Record<string, number>
      treatment: Record<string, number>
    }
  }
  auction?: {
    baseline: {
      win_rate: number
      timeout_rate: number
      floor_ecpm: number
      fill_rate?: number
      bid_ecpm_quantiles?: Record<string, number>
    }
    treatment: {
      win_rate: number
      timeout_rate: number
      floor_ecpm: number
      fill_rate?: number
      bid_ecpm_quantiles?: Record<string, number>
    }
  }
  ocpx_timeseries?: {
    baseline: Array<any>
    treatment: Array<any>
  }
  topN_feed?: {
    baseline: Array<any>
    treatment: Array<any>
  }
  bottlenecks?: Array<any>
}

/**
 * 统一 normalize pipeline 数据
 * 支持从 _adx_v1 或 pipeline 字段读取
 */
export function normalizePipeline(experiment: any): NormalizedPipeline {
  const expId = experiment?.experiment_id || experiment?.id || 'unknown'
  
  // 优先从 pipeline 读取，否则从 _adx_v1 读取
  const pipeline = experiment?.pipeline || {}
  const adxV1 = experiment?._adx_v1 || {}
  
  // 统一 latency_ms
  let latencyMs = {
    baseline: {} as Record<string, number>,
    treatment: {} as Record<string, number>,
  }
  
  if (pipeline.latency_ms) {
    latencyMs = {
      baseline: ensureObject(pipeline.latency_ms.baseline),
      treatment: ensureObject(pipeline.latency_ms.treatment),
    }
  } else if (adxV1.pipeline?.stages) {
    // 从 ADX v1 的 stages 转换
    adxV1.pipeline.stages.forEach((stage: any) => {
      const stageKey = stage.name === '召回' ? 'recall' :
                       stage.name === '粗排' ? 'coarse' :
                       stage.name === '精排' ? 'fine' :
                       stage.name === '重排' ? 'rerank' :
                       stage.name === '拍卖' ? 'auction' : stage.name?.toLowerCase() || ''
      if (stage.latency_ms) {
        latencyMs.baseline[stageKey] = stage.latency_ms.baseline || 0
        latencyMs.treatment[stageKey] = stage.latency_ms.treatment || 0
      }
    })
  }
  
  // 统一 funnel
  let funnel = {
    baseline: {} as Record<string, number>,
    treatment: {} as Record<string, number>,
  }
  
  if (pipeline.funnel) {
    funnel = {
      baseline: ensureObject(pipeline.funnel.baseline),
      treatment: ensureObject(pipeline.funnel.treatment),
    }
  } else if (adxV1.pipeline?.stages) {
    // 从 ADX v1 的 stages 转换
    adxV1.pipeline.stages.forEach((stage: any) => {
      const stageKey = stage.name === '召回' ? 'after_recall' :
                       stage.name === '粗排' ? 'after_coarse' :
                       stage.name === '精排' ? 'after_fine' :
                       stage.name === '重排' ? 'final' :
                       stage.name === '拍卖' ? 'final' : `after_${stage.name?.toLowerCase()}`
      if (stage.candidates) {
        funnel.baseline[stageKey] = stage.candidates.baseline || 0
        funnel.treatment[stageKey] = stage.candidates.treatment || 0
      }
    })
  }
  
  // 统一 category_dist（自动识别 0-1 或 0-100）
  let categoryDist = {
    baseline: {} as Record<string, number>,
    treatment: {} as Record<string, number>,
  }
  
  if (pipeline.category_dist) {
    const baseline = ensureObject(pipeline.category_dist.baseline)
    const treatment = ensureObject(pipeline.category_dist.treatment)
    
    // 判断值域：如果 max > 1.5，视为百分数，除以 100
    const allValues = [...Object.values(baseline), ...Object.values(treatment)].filter(v => typeof v === 'number')
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0
    const isPercentage = maxValue > 1.5
    
    categoryDist = {
      baseline: Object.fromEntries(
        Object.entries(baseline).map(([k, v]) => [k, isPercentage ? (v as number) / 100 : (v as number)])
      ),
      treatment: Object.fromEntries(
        Object.entries(treatment).map(([k, v]) => [k, isPercentage ? (v as number) / 100 : (v as number)])
      ),
    }
  }
  
  // 统一 reasons（兼容两种嵌套结构）
  let reasons: any = undefined
  
  if (pipeline.reasons) {
    // 结构1: reasons.rerank.baseline / reasons.auction.baseline
    if (pipeline.reasons.rerank?.baseline || pipeline.reasons.auction?.baseline) {
      reasons = {
        rerank: {
          baseline: ensureObject(pipeline.reasons.rerank?.baseline),
          treatment: ensureObject(pipeline.reasons.rerank?.treatment),
        },
        auction: {
          baseline: ensureObject(pipeline.reasons.auction?.baseline),
          treatment: ensureObject(pipeline.reasons.auction?.treatment),
        },
      }
    }
    // 结构2: reasons.baseline.rerank / reasons.treatment.auction
    else if (pipeline.reasons.baseline?.rerank || pipeline.reasons.treatment?.rerank) {
      reasons = {
        rerank: {
          baseline: ensureObject(pipeline.reasons.baseline?.rerank),
          treatment: ensureObject(pipeline.reasons.treatment?.rerank),
        },
        auction: {
          baseline: ensureObject(pipeline.reasons.baseline?.auction),
          treatment: ensureObject(pipeline.reasons.treatment?.auction),
        },
      }
    }
    // ADX v1 数组格式
    else if (Array.isArray(pipeline.reasons.rerank) || Array.isArray(pipeline.reasons.auction)) {
      reasons = {
        rerank: {
          baseline: {},
          treatment: {},
        },
        auction: {
          baseline: {},
          treatment: {},
        },
      }
      if (Array.isArray(pipeline.reasons.rerank)) {
        pipeline.reasons.rerank.forEach((item: any) => {
          if (item.code) {
            reasons.rerank.baseline[item.code] = item.baseline_pct || 0
            reasons.rerank.treatment[item.code] = item.treatment_pct || 0
          }
        })
      }
      if (Array.isArray(pipeline.reasons.auction)) {
        pipeline.reasons.auction.forEach((item: any) => {
          if (item.code) {
            reasons.auction.baseline[item.code] = item.baseline_pct || 0
            reasons.auction.treatment[item.code] = item.treatment_pct || 0
          }
        })
      }
    }
  }
  
  // 统一 auction
  let auction: any = undefined
  
  if (pipeline.auction) {
    const baseline = ensureObject(pipeline.auction.baseline)
    const treatment = ensureObject(pipeline.auction.treatment)
    
    // 如果 win_rate 为 0，尝试从其他位置 fallback
    let baselineWinRate = baseline.win_rate ?? 0
    let treatmentWinRate = treatment.win_rate ?? 0
    
    if (baselineWinRate === 0 || treatmentWinRate === 0) {
      // 尝试从 bid.auction 或 bidding_budget.dsp.auction 获取
      const fallbackAuction = experiment?.bid?.auction || 
                              experiment?.bidding_budget?.dsp?.auction ||
                              adxV1.bidding_budget?.dsp?.auction
      if (fallbackAuction) {
        if (baselineWinRate === 0 && fallbackAuction.baseline?.win_rate) {
          baselineWinRate = fallbackAuction.baseline.win_rate
        }
        if (treatmentWinRate === 0 && fallbackAuction.treatment?.win_rate) {
          treatmentWinRate = fallbackAuction.treatment.win_rate
        }
      }
    }
    
    auction = {
      baseline: {
        win_rate: baselineWinRate,
        timeout_rate: baseline.timeout_rate ?? 0,
        floor_ecpm: baseline.floor_ecpm ?? baseline.floorECPM ?? 0,
        fill_rate: baseline.fill_rate,
        bid_ecpm_quantiles: ensureObject(baseline.bid_ecpm_quantiles),
      },
      treatment: {
        win_rate: treatmentWinRate,
        timeout_rate: treatment.timeout_rate ?? 0,
        floor_ecpm: treatment.floor_ecpm ?? treatment.floorECPM ?? 0,
        fill_rate: treatment.fill_rate,
        bid_ecpm_quantiles: ensureObject(treatment.bid_ecpm_quantiles),
      },
    }
  }
  
  // 统一 ocpx_timeseries
  const ocpxTimeseries = pipeline.ocpx_timeseries ? {
    baseline: ensureArray(pipeline.ocpx_timeseries.baseline),
    treatment: ensureArray(pipeline.ocpx_timeseries.treatment),
  } : undefined
  
  // 统一 topN_feed
  const topNFeed = pipeline.topN_feed ? {
    baseline: ensureArray(pipeline.topN_feed.baseline),
    treatment: ensureArray(pipeline.topN_feed.treatment),
  } : undefined
  
  // 统一 bottlenecks
  const bottlenecks = ensureArray(pipeline.bottlenecks || adxV1.bottleneck ? [{
    stage: adxV1.bottleneck,
    node: adxV1.bottleneck,
    note: adxV1.summary?.key_takeaway || '',
  }] : [])
  
  const result: NormalizedPipeline = {
    latency_ms: latencyMs,
    funnel,
    category_dist: categoryDist,
    bottlenecks,
  }
  
  if (reasons) result.reasons = reasons
  if (auction) result.auction = auction
  if (ocpxTimeseries) result.ocpx_timeseries = ocpxTimeseries
  if (topNFeed) result.topN_feed = topNFeed
  
  // 检查缺失字段并警告
  if (!pipeline.latency_ms && !adxV1.pipeline?.stages) {
    console.warn(`[${expId}] Missing field: pipeline.latency_ms`)
  }
  if (!pipeline.funnel && !adxV1.pipeline?.stages) {
    console.warn(`[${expId}] Missing field: pipeline.funnel`)
  }
  if (!pipeline.category_dist) {
    console.warn(`[${expId}] Missing field: pipeline.category_dist`)
  }
  
  return result
}


