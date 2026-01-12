// 节点名称映射
export const nodeNames: Record<string, string> = {
  recall: '召回',
  coarse: '粗排',
  fine: '精排',
  rerank: '重排',
  auction: '拍卖',
}

// Reason code 映射（从 index.json 加载）
export const reasonCodeMap: Record<string, string> = {
  FILTERED_BY_DUP: '去重过滤',
  FILTERED_BY_QUALITY: '质量门槛过滤',
  FILTERED_BY_FREQ_CAP: '频控过滤',
  DIVERSITY_SWAP: '多样性换位',
  RESOURCE_SLOT_INSERT: '资源位插入',
  BUDGET_EXHAUSTED: '预算耗尽',
  BID_TOO_LOW: '出价不足/低于floor',
  TIMEOUT: '超时未返回',
}

export function getReasonName(code: string): string {
  return reasonCodeMap[code] || code
}

export function formatReason(code: string, showCode: boolean = false): string {
  const name = getReasonName(code)
  return showCode ? `${name} (${code})` : name
}


