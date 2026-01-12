/**
 * 统一的格式化工具函数
 * 严格区分 0 与缺失值
 */

/**
 * 格式化百分比，缺失值显示 "—"，真实 0 显示 0.00%
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  // 严格检查：null/undefined/NaN 显示 "—"
  if (value == null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }
  
  // 真实 0 正常显示
  const num = value * 100
  return `${num.toFixed(decimals)}%`
}

/**
 * 格式化数字，缺失值显示 "—"，真实 0 显示 0
 */
export function formatNumber(value: number | null | undefined, decimals: number = 0): string {
  if (value == null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }
  return decimals > 0 ? value.toFixed(decimals) : value.toString()
}


