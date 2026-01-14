/**
 * 统一的标签映射表
 * reason_code / code => 中文名
 */

export const reasonCodeLabels: Record<string, string> = {
  FILTERED_BY_DUP: '去重过滤',
  FILTERED_BY_QUALITY: '质量门槛过滤',
  FILTERED_BY_FREQ_CAP: '频控过滤',
  DIVERSITY_SWAP: '多样性换位',
  RESOURCE_SLOT_INSERT: '资源位插入',
  BUDGET_EXHAUSTED: '预算耗尽',
  BID_TOO_LOW: '出价不足/低于floor',
  TIMEOUT: '超时未返回',
}

/**
 * 获取 reason code 的中文标签
 */
export function getReasonLabel(code: string): string {
  return reasonCodeLabels[code] || code
}

/**
 * 格式化 reason code：只显示中文（用于图表轴/legend）
 */
export function formatReasonLabel(code: string): string {
  return getReasonLabel(code)
}








