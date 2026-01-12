/**
 * 实验详情数据 Normalize 层
 * 统一处理不同格式的 mock 数据，确保 UI 组件能正确渲染
 */

import { normalizeOCPX } from './normalizeOCPX'

export interface NormalizedCategoryDist {
  key: string
  share: number // 0-1 范围
}

export interface NormalizedOCPXPoint {
  hour: number
  trafficQ?: number
  spend?: number
  actualCpa?: number
  multiplier?: number
  budgetLeft?: number
}

export interface NormalizedAuction {
  winRate: {
    baseline: number
    treatment: number
  }
  timeoutRate: {
    baseline: number
    treatment: number
  }
  floorECPM: {
    baseline: number
    treatment: number
  }
  quantiles?: {
    baseline: Record<string, number>
    treatment: Record<string, number>
  }
  fillRate?: {
    baseline: number
    treatment: number
  }
}

/**
 * A) Normalize category_dist
 * - 支持 map（{类目: 数值}）或数组
 * - 如果 baseline 的 max <= 1.5，则认为是 0~1 份额，统一 *100（保留 1 位小数）
 * - 输出统一为 map 格式（组件期望的格式）
 */
export function normalizeCategoryDist(dist: any): {
  baseline: Record<string, number>
  treatment: Record<string, number>
} {
  const normalizeSingle = (data: any): Record<string, number> => {
    if (!data) return {}
    
    let items: Array<{ key: string; value: number }> = []
    
    // 处理 map 格式
    if (typeof data === 'object' && !Array.isArray(data)) {
      items = Object.entries(data).map(([key, value]) => ({
        key,
        value: typeof value === 'number' ? value : 0,
      }))
    }
    // 处理数组格式
    else if (Array.isArray(data)) {
      items = data.map((item: any) => ({
        key: item.key || item.category || item.name || String(item),
        value: typeof item.value === 'number' ? item.value : (typeof item.share === 'number' ? item.share : 0),
      }))
    }
    
    if (items.length === 0) return {}
    
    // 判断值域：如果 max <= 1.5，视为 0~1 份额，需要 *100
    const maxValue = items.length > 0 ? Math.max(...items.map(i => i.value)) : 0
    const isDecimal = maxValue <= 1.5
    
    // 转换为统一格式：如果 <= 1.5 则 *100，否则保持原值
    const normalized: Record<string, number> = {}
    items.forEach(item => {
      normalized[item.key] = isDecimal ? Number((item.value * 100).toFixed(1)) : Number(item.value.toFixed(1))
    })
    
    return normalized
  }
  
  return {
    baseline: normalizeSingle(dist?.baseline),
    treatment: normalizeSingle(dist?.treatment),
  }
}

/**
 * B) Normalize OCPX timeseries
 * - 支持两种输入：
 *   1) 点序列：[{hour, traffic_q, spend, actual_cpa, multiplier, ...}]
 *   2) hours + 多数组：{hours:[], baseline:{multiplier:[], cpa:[], spend:[]}, treatment:{...}}
 * - 统一输出向量形式：{hours: [], baseline: {multiplier: [], ...}, treatment: {...}}
 * - 字段命名兼容 snake_case/camelCase
 */
export function normalizeOCPXSeries(series: any): {
  hours: number[]
  baseline: { multiplier: number[]; actual_cpa?: number[]; spend?: number[] }
  treatment: { multiplier: number[]; actual_cpa?: number[]; spend?: number[] }
} | null {
  if (!series) {
    return null
  }
  
  // 格式 1: 点序列数组 [{hour, spend, actual_cpa, multiplier...}]
  if (Array.isArray(series) && series.length > 0) {
    const firstItem = series[0]
    if (typeof firstItem === 'object' && 'hour' in firstItem) {
      // 转换为向量形式
      const hours = series.map((p: any) => p.hour ?? p.h ?? 0)
      const baseline = {
        multiplier: series.map((p: any) => p.multiplier ?? 0),
        actual_cpa: series.map((p: any) => p.actual_cpa ?? p.actualCpa ?? p.cpa ?? 0),
        spend: series.map((p: any) => p.spend ?? 0),
      }
      // 假设 treatment 也是同样的结构（如果数据中有区分）
      const treatment = baseline // 如果没有 treatment，使用 baseline
      
      return { hours, baseline, treatment }
    }
  }
  
  // 格式 2: {hours: [], baseline: {multiplier: [], ...}, treatment: {...}}
  if (typeof series === 'object' && series.hours && Array.isArray(series.hours)) {
    const hours = series.hours
    const baseline = series.baseline || {}
    const treatment = series.treatment || {}
    
    return {
      hours,
      baseline: {
        multiplier: Array.isArray(baseline.multiplier) ? baseline.multiplier : [],
        actual_cpa: Array.isArray(baseline.actual_cpa) ? baseline.actual_cpa :
                    Array.isArray(baseline.cpa) ? baseline.cpa : [],
        spend: Array.isArray(baseline.spend) ? baseline.spend : [],
      },
      treatment: {
        multiplier: Array.isArray(treatment.multiplier) ? treatment.multiplier : [],
        actual_cpa: Array.isArray(treatment.actual_cpa) ? treatment.actual_cpa :
                    Array.isArray(treatment.cpa) ? treatment.cpa : [],
        spend: Array.isArray(treatment.spend) ? treatment.spend : [],
      },
    }
  }
  
  // 未知格式，返回 null
  return null
}

/**
 * C) Normalize auction
 * - 如果 pipeline.auction.win_rate 为 0 或 auction 缺失：
 *   尝试从 bid.auction 或其它可用位置 fallback
 * - 缺失值用 null，不允许用 0 冒充
 */
export function normalizeAuction(auction: any, fallbackAuction?: any): {
  baseline: {
    win_rate: number | null
    timeout_rate: number | null
    floor_ecpm: number | null
    fill_rate?: number | null
    bid_ecpm_quantiles?: Record<string, number>
  }
  treatment: {
    win_rate: number | null
    timeout_rate: number | null
    floor_ecpm: number | null
    fill_rate?: number | null
    bid_ecpm_quantiles?: Record<string, number>
  }
} | null {
  // 优先使用主 auction，如果 win_rate 为 0 或缺失，尝试 fallback
  let source = auction
  
  if (!source || 
      (source.baseline?.win_rate === 0 && source.treatment?.win_rate === 0) ||
      (!source.baseline?.win_rate && !source.treatment?.win_rate)) {
    source = fallbackAuction
  }
  
  if (!source) {
    return null
  }
  
  const baseline = source.baseline || {}
  const treatment = source.treatment || {}
  
  // 【修复】确保 win_rate 是数字类型，不要用 parseInt（会丢失小数）
  // 如果 baseline 或 treatment 的 win_rate 为 null/undefined，尝试从其他位置获取
  let baselineWinRate: number | null = null
  let treatmentWinRate: number | null = null
  
  // 使用 Number() 或直接读取，确保小数不被截断
  if (baseline.win_rate != null && typeof baseline.win_rate === 'number') {
    baselineWinRate = baseline.win_rate
  } else if (fallbackAuction?.baseline?.win_rate != null && typeof fallbackAuction.baseline.win_rate === 'number') {
    baselineWinRate = fallbackAuction.baseline.win_rate
  }
  
  if (treatment.win_rate != null && typeof treatment.win_rate === 'number') {
    treatmentWinRate = treatment.win_rate
  } else if (fallbackAuction?.treatment?.win_rate != null && typeof fallbackAuction.treatment.win_rate === 'number') {
    treatmentWinRate = fallbackAuction.treatment.win_rate
  }
  
  // 缺失值用 null，不允许用 0 冒充
  return {
    baseline: {
      win_rate: baselineWinRate,
      timeout_rate: baseline.timeout_rate ?? null,
      floor_ecpm: baseline.floor_ecpm ?? baseline.floorECPM ?? null,
      fill_rate: baseline.fill_rate !== undefined ? baseline.fill_rate : null,
      bid_ecpm_quantiles: baseline.bid_ecpm_quantiles || undefined,
    },
    treatment: {
      win_rate: treatmentWinRate,
      timeout_rate: treatment.timeout_rate ?? null,
      floor_ecpm: treatment.floor_ecpm ?? treatment.floorECPM ?? null,
      fill_rate: treatment.fill_rate !== undefined ? treatment.fill_rate : null,
      bid_ecpm_quantiles: treatment.bid_ecpm_quantiles || undefined,
    },
  }
}

/**
 * 统一入口：Normalize 实验详情数据
 */
export function normalizeExperimentDetail(raw: any): any {
  if (!raw || typeof raw !== 'object') {
    return raw
  }
  
  const normalized = { ...raw }
  
  // A) Normalize category_dist
  if (raw.pipeline?.category_dist) {
    const normalizedDist = normalizeCategoryDist(raw.pipeline.category_dist)
    // normalizedDist 已经是 map 格式（Record<string, number>），直接使用
    normalized.pipeline = {
      ...normalized.pipeline,
      category_dist: normalizedDist,
    }
  }
  
  // B) Normalize ocpx_timeseries
  if (raw.pipeline?.ocpx_timeseries) {
    const normalizedOCPX = normalizeOCPX(raw.pipeline.ocpx_timeseries)
    if (normalizedOCPX) {
      normalized.pipeline = {
        ...normalized.pipeline,
        ocpx_timeseries: normalizedOCPX,
      }
    }
  }
  
  // C) Normalize auction
  if (raw.pipeline?.auction || raw.bid?.auction) {
    const normalizedAuction = normalizeAuction(
      raw.pipeline?.auction,
      raw.bid?.auction || raw.bidding_budget?.dsp?.auction
    )
    
    if (normalizedAuction) {
      normalized.pipeline = {
        ...normalized.pipeline,
        auction: normalizedAuction,
      }
    }
  }
  
  return normalized
}

