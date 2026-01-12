// 客户端工具函数（不包含 fs/path）

/**
 * 安全计算百分比变化，避免 NaN/Infinity
 */
export function safePercentChange(baseline: number | null | undefined, treatment: number | null | undefined): number | null {
  if (baseline == null || treatment == null) return null
  if (baseline <= 0) return null
  if (typeof baseline !== 'number' || typeof treatment !== 'number') return null
  if (!isFinite(baseline) || !isFinite(treatment)) return null
  
  const change = ((treatment - baseline) / baseline) * 100
  if (!isFinite(change)) return null
  return change
}

/**
 * 格式化百分比变化显示
 */
export function formatPercentChange(change: number | null, options?: { showSign?: boolean; decimals?: number }): string {
  if (change === null) return '--'
  const { showSign = true, decimals = 1 } = options || {}
  const sign = showSign && change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(decimals)}%`
}

/**
 * 格式化提升率（Lift）显示
 * @param baseline 基线值
 * @param treatment 实验组值
 * @returns 格式化后的字符串，如 "+5.2%" 或 "—"
 */
export function formatLift(baseline: number | null | undefined, treatment: number | null | undefined): string {
  if (baseline == null || treatment == null) return '—'
  if (typeof baseline !== 'number' || typeof treatment !== 'number') return '—'
  if (!isFinite(baseline) || !isFinite(treatment)) return '—'
  if (baseline <= 0) return '—' // baseline <= 0 时返回 "—"，tooltip 会显示说明
  
  const change = ((treatment - baseline) / baseline) * 100
  if (!isFinite(change)) return '—'
  
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

/**
 * 检查是否可以计算提升率（用于 tooltip 显示）
 */
export function canCalculateLift(baseline: number | null | undefined, treatment: number | null | undefined): boolean {
  if (baseline == null || treatment == null) return false
  if (typeof baseline !== 'number' || typeof treatment !== 'number') return false
  if (!isFinite(baseline) || !isFinite(treatment)) return false
  if (baseline <= 0) return false
  return true
}

/**
 * Normalize OCPX timeseries 数据，兼容 v1/v2 格式
 * v2 格式: { hours: [], baseline: { multiplier: [], cpa: [], spend: [] }, treatment: { ... } }
 * v1 格式: { baseline: [{ hour, multiplier, actual_cpa, spend, target_cpa }], treatment: [...] }
 */
export function normalizeOCPXData(data: any): {
  baseline: Array<{
    hour: number
    multiplier: number
    actual_cpa: number
    spend: number
    target_cpa: number
  }>
  treatment: Array<{
    hour: number
    multiplier: number
    actual_cpa: number
    spend: number
    target_cpa: number
  }>
} {
  // 开发环境警告
  if (process.env.NODE_ENV === 'development' && !data) {
    console.warn('[normalizeOCPXData] data 为空')
  }

  // 处理 baseline
  let baseline: any[] = []
  if (data && data.baseline) {
    // v2 格式：baseline 是对象，包含 multiplier/cpa/spend 数组
    if (data.baseline.multiplier && Array.isArray(data.baseline.multiplier)) {
      const hours = data.hours || Array.from({ length: data.baseline.multiplier.length }, (_, i) => i)
      const multipliers = data.baseline.multiplier || []
      const cpas = data.baseline.cpa || data.baseline.actual_cpa || []
      const spends = data.baseline.spend || []
      const targetCpas = data.baseline.target_cpa || []
      baseline = hours.map((hour: number, i: number) => ({
        hour,
        multiplier: multipliers[i] ?? 1,
        actual_cpa: cpas[i] ?? 0,
        spend: spends[i] ?? 0,
        target_cpa: targetCpas[i] ?? 0,
      }))
    }
    // v1 格式：baseline 是对象数组
    else if (Array.isArray(data.baseline)) {
      if (data.baseline.length > 0 && typeof data.baseline[0] === 'number') {
        // 数字数组（旧 v1 格式）
        const hours = data.hours || Array.from({ length: data.baseline.length }, (_, i) => i)
        baseline = hours.map((hour: number, i: number) => ({
          hour,
          multiplier: data.baseline[i] || 1,
          actual_cpa: 0,
          spend: 0,
          target_cpa: 0,
        }))
      } else {
        // 对象数组（标准 v1 格式）
        baseline = data.baseline.map((item: any) => ({
          hour: item.hour ?? 0,
          multiplier: item.multiplier ?? 1,
          actual_cpa: item.actual_cpa ?? 0,
          spend: item.spend ?? 0,
          target_cpa: item.target_cpa ?? 0,
        }))
      }
    }
  }

  // 处理 treatment
  let treatment: any[] = []
  if (data && data.treatment) {
    // v2 格式：treatment 是对象，包含 multiplier/cpa/spend 数组
    if (data.treatment.multiplier && Array.isArray(data.treatment.multiplier)) {
      const hours = data.hours || Array.from({ length: data.treatment.multiplier.length }, (_, i) => i)
      const multipliers = data.treatment.multiplier || []
      const cpas = data.treatment.cpa || data.treatment.actual_cpa || []
      const spends = data.treatment.spend || []
      const targetCpas = data.treatment.target_cpa || []
      treatment = hours.map((hour: number, i: number) => ({
        hour,
        multiplier: multipliers[i] ?? 1,
        actual_cpa: cpas[i] ?? 0,
        spend: spends[i] ?? 0,
        target_cpa: targetCpas[i] ?? 0,
      }))
    }
    // v1 格式：treatment 是对象数组
    else if (Array.isArray(data.treatment)) {
      if (data.treatment.length > 0 && typeof data.treatment[0] === 'number') {
        // 数字数组（旧 v1 格式）
        const hours = data.hours || Array.from({ length: data.treatment.length }, (_, i) => i)
        treatment = hours.map((hour: number, i: number) => ({
          hour,
          multiplier: data.treatment[i] || 1,
          actual_cpa: 0,
          spend: 0,
          target_cpa: 0,
        }))
      } else {
        // 对象数组（标准 v1 格式）
        treatment = data.treatment.map((item: any) => ({
          hour: item.hour ?? 0,
          multiplier: item.multiplier ?? 1,
          actual_cpa: item.actual_cpa ?? 0,
          spend: item.spend ?? 0,
          target_cpa: item.target_cpa ?? 0,
        }))
      }
    }
  }

  // 确保至少返回空数组
  return {
    baseline: baseline.length > 0 ? baseline : [],
    treatment: treatment.length > 0 ? treatment : [],
  }
}

/**
 * 格式化数字显示（添加千分位）
 * 缺失或无效时返回 "—"
 */
export function formatNumber(num: number | null | undefined, decimals: number = 0): string {
  if (num == null || num === undefined) return '—'
  if (typeof num !== 'number') return '—'
  if (!isFinite(num)) return '—'
  if (decimals > 0) {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  return num.toLocaleString('zh-CN')
}

/**
 * 安全显示数字（缺失时显示 "—"，不显示 0）
 */
export function safeFormatNumber(num: number | null | undefined, decimals: number = 0): string {
  if (num == null || num === undefined) return '—'
  if (typeof num !== 'number') return '—'
  if (!isFinite(num)) return '—'
  if (decimals > 0) {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  return num.toLocaleString('zh-CN')
}

/**
 * 格式化百分比显示（缺失时显示 "—"，不使用 0 兜底）
 * @param value 百分比值（0-1 小数或已为百分比）
 * @param isDecimal 是否为小数格式（true: 0.23 => 23.00%, false: 23 => 23.00%）
 * @param decimals 小数位数
 * @deprecated 使用 lib/format-utils.ts 中的 formatPercent
 */
export function formatPercent(value: number | null | undefined, isDecimal: boolean = true, decimals: number = 2): string {
  if (value == null || value === undefined) return '—'
  if (typeof value !== 'number') return '—'
  if (!isFinite(value)) return '—'
  
  const percentValue = isDecimal ? value * 100 : value
  return `${percentValue.toFixed(decimals)}%`
}
