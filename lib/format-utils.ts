/**
 * 格式化工具函数
 * 严格区分 0 与缺失值
 */

/**
 * 格式化数值，缺失值显示 "—"，真实 0 显示 0
 */
export function formatValue(
  value: number | null | undefined,
  options?: {
    decimals?: number
    suffix?: string
    isPercent?: boolean
  }
): string {
  const { decimals = 2, suffix = '', isPercent = false } = options || {}

  // 严格检查：null/undefined/NaN 显示 "—"
  if (value == null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  // 真实 0 正常显示
  const num = isPercent ? value * 100 : value
  return `${num.toFixed(decimals)}${suffix}`
}

/**
 * 格式化百分比，缺失值显示 "—"，真实 0 显示 0.00%
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  return formatValue(value, { decimals, suffix: '%', isPercent: true })
}

/**
 * 格式化数字，缺失值显示 "—"，真实 0 显示 0
 */
export function formatNumber(value: number | null | undefined, decimals: number = 0): string {
  return formatValue(value, { decimals })
}








