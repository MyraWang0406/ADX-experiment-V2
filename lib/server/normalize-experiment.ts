import 'server-only'
import type { ExperimentData, ExperimentDataV2 } from '@/lib/data-loader'

/**
 * 数据 Normalize 层：统一不同格式的 mock 数据为 ExperimentData 格式
 * 支持：
 * - v2 标准格式（ExperimentDataV2）
 * - ADX v1 格式（experiments_adx_v1.json）
 * - v1 旧格式（向后兼容）
 */

/**
 * Normalize ADX v1 格式到 ExperimentData
 */
export function normalizeADXV1(data: any): ExperimentData {
  // 【防 500】确保所有字段都有默认值
  const summary = data.summary || {}
  // 【修复】优先从 summary.metrics_summary.north_star 读取，如果没有则从 summary.north_star 读取
  const northStar = summary.metrics_summary?.north_star || summary.north_star || {}
  const pipeline = data.pipeline || {}
  const stages = pipeline.stages || []
  
  // 转换 pipeline.stages 到 latency_ms 和 funnel
  const latencyMs: Record<string, { baseline: number; treatment: number }> = {}
  const funnel: Record<string, { baseline: number; treatment: number }> = {}
  
  stages.forEach((stage: any) => {
    const stageKey = stage.name === '召回' ? 'recall' :
                     stage.name === '粗排' ? 'coarse' :
                     stage.name === '精排' ? 'fine' :
                     stage.name === '重排' ? 'rerank' :
                     stage.name === '拍卖' ? 'auction' : stage.name?.toLowerCase() || ''
    
    if (stage.latency_ms) {
      latencyMs[stageKey] = {
        baseline: stage.latency_ms.baseline || 0,
        treatment: stage.latency_ms.treatment || 0,
      }
    }
    
    if (stage.candidates) {
      funnel[`after_${stageKey}`] = {
        baseline: stage.candidates.baseline || 0,
        treatment: stage.candidates.treatment || 0,
      }
    }
  })
  
  // 转换 reasons（ADX v1 是数组格式）
  const reasons: any = {}
  if (Array.isArray(data.reasons?.rerank)) {
    reasons.rerank = {
      baseline: {},
      treatment: {},
    }
    data.reasons.rerank.forEach((item: any) => {
      if (item.code) {
        reasons.rerank.baseline[item.code] = item.baseline_pct || 0
        reasons.rerank.treatment[item.code] = item.treatment_pct || 0
      }
    })
  }
  if (Array.isArray(data.reasons?.auction)) {
    reasons.auction = {
      baseline: {},
      treatment: {},
    }
    data.reasons.auction.forEach((item: any) => {
      if (item.code) {
        reasons.auction.baseline[item.code] = item.baseline_pct || 0
        reasons.auction.treatment[item.code] = item.treatment_pct || 0
      }
    })
  }
  
  // 转换 query_intent 到 pipeline.search
  const search: any = {}
  if (data.query_intent) {
    if (data.query_intent.top_queries) {
      search.query_dist = data.query_intent.top_queries.map((q: any) => ({
        query: q.query || '',
        share: (q.impressions || 0) / 1000000, // 简化为占比
        intent: q.intent || '',
        ctr: q.ctr || 0,
        cvr: q.cvr || 0,
      }))
    }
    if (data.query_intent.match_effect) {
      search.match_rate = {
        baseline: data.query_intent.match_effect.baseline || 0,
        treatment: data.query_intent.match_effect.treatment || 0,
      }
    }
    if (data.query_intent.post_click_cvr) {
      search.post_click_cvr = {
        baseline: data.query_intent.post_click_cvr.baseline || 0,
        treatment: data.query_intent.post_click_cvr.treatment || 0,
      }
    }
  }
  
  return {
    experiment_id: data.id || '',
    title: data.title || '未知实验',
    created_at: new Date().toISOString(),
    primary_segment: {
      id: '',
      name: '',
      dims: {},
    },
    narrative: summary.key_takeaway || data.summary?.key_takeaway || '',
    kpi_framework: {
      north_star: {
        name: northStar.name || '视频播放量',
        unit: '次',
        // 【修复】优先读取 baseline/treatment，如果没有则读取 value
        baseline_value: northStar.baseline ?? northStar.value ?? 0,
        treatment_value: northStar.treatment ?? northStar.value ?? 0,
      },
      guardrails: (summary.guardrails || []).map((g: any) => ({
        name: g.name || '',
        unit: '%',
        baseline_value: 0,
        treatment_value: 0,
      })),
    },
    pipeline: {
      funnel: {
        baseline: Object.fromEntries(
          Object.entries(funnel).map(([k, v]) => [k, v.baseline])
        ),
        treatment: Object.fromEntries(
          Object.entries(funnel).map(([k, v]) => [k, v.treatment])
        ),
      },
      latency_ms: {
        baseline: Object.fromEntries(
          Object.entries(latencyMs).map(([k, v]) => [k, v.baseline])
        ),
        treatment: Object.fromEntries(
          Object.entries(latencyMs).map(([k, v]) => [k, v.treatment])
        ),
      },
      category_dist: {
        baseline: {},
        treatment: {},
      },
      reasons: Object.keys(reasons).length > 0 ? reasons : undefined,
      search: Object.keys(search).length > 0 ? search : undefined,
      // 保留原始 ADX v1 数据供组件直接使用
      bidding_budget: data.bidding_budget,
      supply_coverage: data.supply_coverage,
      adx_exchange: data.adx_exchange,
    },
    diagnosis_tree: {
      root: summary.key_takeaway || '',
      branches: [],
    },
    // 保留原始 ADX v1 数据
    _adx_v1: data,
  } as any
}

/**
 * Normalize v2 标准格式（已经是 ExperimentDataV2，只需确保类型兼容）
 */
export function normalizeV2(data: any): ExperimentData {
  // 【调试】确保 metrics_summary 被保留
  if (data.metrics_summary) {
    console.log(`[normalizeV2] metrics_summary exists, keys:`, Object.keys(data.metrics_summary))
  } else {
    console.warn(`[normalizeV2] metrics_summary is missing in data`)
  }
  // v2 格式已经是标准格式，直接返回（但需要确保所有必需字段存在）
  return {
    ...data,
    experiment_id: data.experiment_id || '',
    title: data.title || '未知实验',
    created_at: data.created_at || new Date().toISOString(),
    primary_segment: data.primary_segment || { id: '', name: '', dims: {} },
    narrative: data.narrative || '',
    kpi_framework: data.kpi_framework || {
      north_star: { name: '视频播放量', unit: '次', baseline_value: 0, treatment_value: 0 },
      guardrails: [],
    },
    // 【重要】确保 metrics_summary 被保留
    metrics_summary: data.metrics_summary,
    pipeline: data.pipeline || {
      funnel: { baseline: {}, treatment: {} },
      category_dist: { baseline: {}, treatment: {} },
    },
    diagnosis_tree: data.diagnosis_tree || { root: '', branches: [] },
  }
}

/**
 * 统一入口：根据数据格式自动选择 normalize 函数
 */
export function normalizeExperimentData(rawData: any): ExperimentData | null {
  if (!rawData || typeof rawData !== 'object') {
    return null
  }
  
  // 判断数据格式
  // ADX v1 格式特征：有 summary、pipeline.stages（数组）、bidding_budget.dsp
  if (rawData.summary && Array.isArray(rawData.pipeline?.stages)) {
    return normalizeADXV1(rawData)
  }
  
  // v2 格式特征：有 experiment_id、kpi_framework、pipeline.funnel
  if (rawData.experiment_id && rawData.kpi_framework && rawData.pipeline?.funnel) {
    return normalizeV2(rawData)
  }
  
  // v1 旧格式：尝试直接返回（向后兼容）
  if (rawData.experiment_id || rawData.id) {
    return normalizeV2(rawData) // 使用 v2 normalize 作为兜底
  }
  
  return null
}

