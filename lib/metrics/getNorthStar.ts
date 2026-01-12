import type { ExperimentData } from '@/lib/data-loader'

export type NorthStarObjective = 'revenue' | 'ad_vv' | '收入' | '视频播放量' | '播放量'

export interface NorthStarResult {
  baselineValue: number | null
  treatmentValue: number | null
  uplift: number | null // 百分比，例如 26.3 表示 +26.3%
  name: string
  unit: string
}

/**
 * 统一的北极星指标获取函数
 * 支持根据 objective 选择不同的指标（revenue 或 ad_vv）
 */
export function getNorthStar(
  experiment: ExperimentData,
  objective: NorthStarObjective = 'ad_vv'
): NorthStarResult {
  // 映射 objective 到字段名
  const fieldMap: Record<string, string> = {
    'revenue': 'revenue',
    '收入': 'revenue',
    'ad_vv': 'ad_vv',
    '视频播放量': 'ad_vv',
    '播放量': 'ad_vv',
  }
  
  const fieldName = fieldMap[objective] || 'ad_vv'
  const defaultName = fieldName === 'revenue' ? '收入' : '视频播放量'
  const defaultUnit = fieldName === 'revenue' ? '元' : '次'

  // 优先从 kpi_framework 读取
  if (experiment.kpi_framework?.north_star) {
    const baseline = experiment.kpi_framework.north_star.baseline_value ?? null
    const treatment = experiment.kpi_framework.north_star.treatment_value ?? null
    
    // 计算 uplift
    const uplift = calculateUplift(baseline, treatment)
    
    return {
      baselineValue: baseline != null && typeof baseline === 'number' ? baseline : null,
      treatmentValue: treatment != null && typeof treatment === 'number' ? treatment : null,
      uplift,
      name: experiment.kpi_framework.north_star.name || defaultName,
      unit: experiment.kpi_framework.north_star.unit || defaultUnit,
    }
  }
  
  // 从 metrics_summary.baseline.north_star 读取
  const baselineNorthStar = (experiment.metrics_summary?.baseline as any)?.north_star
  const treatmentNorthStar = (experiment.metrics_summary?.treatment as any)?.north_star
  
  // 根据 fieldName 选择字段（revenue 或 ad_vv）
  const baseline = baselineNorthStar?.[fieldName] ?? baselineNorthStar?.value ?? null
  const treatment = treatmentNorthStar?.[fieldName] ?? treatmentNorthStar?.value ?? null
  
  // 计算 uplift
  const uplift = calculateUplift(baseline, treatment)
  
  return {
    baselineValue: baseline != null && typeof baseline === 'number' ? baseline : null,
    treatmentValue: treatment != null && typeof treatment === 'number' ? treatment : null,
    uplift,
    name: defaultName,
    unit: defaultUnit,
  }
}

/**
 * 计算提升率（百分比）
 * 返回 null 如果无法计算（baseline <= 0 或值为 null）
 */
function calculateUplift(baseline: number | null, treatment: number | null): number | null {
  if (baseline == null || treatment == null) return null
  if (typeof baseline !== 'number' || typeof treatment !== 'number') return null
  if (!isFinite(baseline) || !isFinite(treatment)) return null
  if (baseline <= 0) return null
  
  const change = ((treatment - baseline) / baseline) * 100
  if (!isFinite(change)) return null
  
  return Number(change.toFixed(1))
}


