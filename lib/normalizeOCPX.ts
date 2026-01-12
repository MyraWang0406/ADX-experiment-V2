/**
 * OCPX 数据兼容层
 * 统一处理不同格式的 ocpx_timeseries 数据
 */

export interface NormalizedOCPX {
  hours: number[]
  baseline: {
    multiplier: number[]
    cpa?: number[]
    actual_cpa?: number[]
    spend?: number[]
    traffic_q?: number[]
    trafficQ?: number[]
  }
  treatment: {
    multiplier: number[]
    cpa?: number[]
    actual_cpa?: number[]
    spend?: number[]
    traffic_q?: number[]
    trafficQ?: number[]
  }
}

/**
 * Normalize OCPX timeseries 数据
 * 
 * 规则：
 * 1. 若存在 hours + baseline{multiplier/cpa/spend} => 原样返回
 * 2. 否则若 baseline 是 [{hour, spend, actual_cpa, multiplier}] => 转成向量形式
 * 3. 允许 snake_case/camelCase：actual_cpa/actualCpa、traffic_q/trafficQ
 */
export function normalizeOCPX(raw: any): NormalizedOCPX | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  // 格式 1: 已存在 hours + baseline{multiplier/cpa/spend} => 原样返回（兼容 snake_case/camelCase）
  if (raw.hours && Array.isArray(raw.hours) && raw.baseline && typeof raw.baseline === 'object' && !Array.isArray(raw.baseline)) {
    const baseline = raw.baseline || {}
    const treatment = raw.treatment || {}
    
    // 兼容 snake_case/camelCase：actual_cpa/actualCpa、traffic_q/trafficQ
    const baselineCpa = baseline.actual_cpa ?? baseline.actualCpa ?? baseline.cpa
    const treatmentCpa = treatment.actual_cpa ?? treatment.actualCpa ?? treatment.cpa
    const baselineTrafficQ = baseline.traffic_q ?? baseline.trafficQ
    const treatmentTrafficQ = treatment.traffic_q ?? treatment.trafficQ
    
    return {
      hours: raw.hours,
      baseline: {
        multiplier: Array.isArray(baseline.multiplier) ? baseline.multiplier : [],
        cpa: Array.isArray(baselineCpa) ? baselineCpa : (Array.isArray(baseline.cpa) ? baseline.cpa : undefined),
        actual_cpa: Array.isArray(baselineCpa) ? baselineCpa : undefined,
        spend: Array.isArray(baseline.spend) ? baseline.spend : undefined,
        traffic_q: Array.isArray(baselineTrafficQ) ? baselineTrafficQ : undefined,
        trafficQ: Array.isArray(baselineTrafficQ) ? baselineTrafficQ : undefined,
      },
      treatment: {
        multiplier: Array.isArray(treatment.multiplier) ? treatment.multiplier : [],
        cpa: Array.isArray(treatmentCpa) ? treatmentCpa : (Array.isArray(treatment.cpa) ? treatment.cpa : undefined),
        actual_cpa: Array.isArray(treatmentCpa) ? treatmentCpa : undefined,
        spend: Array.isArray(treatment.spend) ? treatment.spend : undefined,
        traffic_q: Array.isArray(treatmentTrafficQ) ? treatmentTrafficQ : undefined,
        trafficQ: Array.isArray(treatmentTrafficQ) ? treatmentTrafficQ : undefined,
      },
    }
  }

  // 格式 2: baseline 是点序列数组 [{hour, spend, actual_cpa, multiplier}]
  if (Array.isArray(raw.baseline) && raw.baseline.length > 0) {
    const firstItem = raw.baseline[0]
    if (typeof firstItem === 'object' && ('hour' in firstItem || 'h' in firstItem)) {
      // 提取 hours
      const hours = raw.baseline.map((p: any) => p.hour ?? p.h ?? 0)
      
      // 转换 baseline
      const baseline = {
        multiplier: raw.baseline.map((p: any) => p.multiplier ?? 0),
        cpa: raw.baseline.map((p: any) => p.actual_cpa ?? p.actualCpa ?? p.cpa ?? 0),
        actual_cpa: raw.baseline.map((p: any) => p.actual_cpa ?? p.actualCpa ?? p.cpa ?? 0),
        spend: raw.baseline.map((p: any) => p.spend ?? 0),
        traffic_q: raw.baseline.map((p: any) => p.traffic_q ?? p.trafficQ ?? 0),
        trafficQ: raw.baseline.map((p: any) => p.traffic_q ?? p.trafficQ ?? 0),
      }
      
      // 转换 treatment（如果存在）
      let treatment = baseline
      if (Array.isArray(raw.treatment) && raw.treatment.length > 0) {
        treatment = {
          multiplier: raw.treatment.map((p: any) => p.multiplier ?? 0),
          cpa: raw.treatment.map((p: any) => p.actual_cpa ?? p.actualCpa ?? p.cpa ?? 0),
          actual_cpa: raw.treatment.map((p: any) => p.actual_cpa ?? p.actualCpa ?? p.cpa ?? 0),
          spend: raw.treatment.map((p: any) => p.spend ?? 0),
          traffic_q: raw.treatment.map((p: any) => p.traffic_q ?? p.trafficQ ?? 0),
          trafficQ: raw.treatment.map((p: any) => p.traffic_q ?? p.trafficQ ?? 0),
        }
      }
      
      return {
        hours,
        baseline,
        treatment,
      }
    }
  }

  // 未知格式，返回 null
  return null
}

