// 术语中英文对照表

export const glossary: Record<string, { zh: string; desc?: string }> = {
  // 核心指标
  'Win Rate': { zh: '胜率', desc: '在广告拍卖中成功竞得的比例' },
  'Floor eCPM': { zh: '底价eCPM', desc: '广告拍卖的最低出价' },
  'Timeout': { zh: '超时', desc: '请求超过设定时间未返回' },
  'Auction': { zh: '竞价', desc: '广告拍卖环节' },
  'Pacing': { zh: '预算节奏', desc: '预算分配的时间节奏' },
  'Coverage': { zh: '覆盖', desc: '内容或广告的覆盖范围' },
  'Lift': { zh: '提升率', desc: '相对于基线的提升百分比' },
  'Ceiling': { zh: '天花板', desc: '理论上可达到的最大值' },
  'CTR': { zh: '点击率', desc: '点击次数 / 曝光次数' },
  'CVR': { zh: '转化率', desc: '转化次数 / 点击次数' },
  'CPA': { zh: '获客成本', desc: 'Cost Per Action，每次转化成本' },
  'eCPM': { zh: '千次曝光收入', desc: 'Effective Cost Per Mille' },
  'Fill Rate': { zh: '填充率', desc: '成功返回广告的请求比例' },
  'Multiplier': { zh: '倍率', desc: 'OCPX 控制中的倍率' },
  'Actual CPA': { zh: '实际CPA', desc: '实际每次转化成本' },
  'Spend': { zh: '消耗', desc: '广告预算消耗' },
  
  // Pipeline 阶段
  'Recall': { zh: '召回', desc: '从海量内容库中初步筛选候选' },
  'Coarse': { zh: '粗排', desc: '快速排序筛选较优候选' },
  'Fine': { zh: '精排', desc: '精细排序计算最终得分' },
  'Rerank': { zh: '重排', desc: '多样性调整和去重' },
  
  // 原因码
  'BID_TOO_LOW': { zh: '出价过低', desc: '出价低于底价无法参与竞价' },
  'BUDGET_EXHAUSTED': { zh: '预算耗尽', desc: '当日预算已用完' },
  'TIMEOUT': { zh: '超时', desc: '请求超时未返回' },
  'FILTERED_BY_QUALITY': { zh: '质量过滤', desc: '被质量门槛过滤' },
  'FILTERED_BY_DUP': { zh: '去重过滤', desc: '因重复被过滤' },
  'FILTERED_BY_FREQ_CAP': { zh: '频控过滤', desc: '因频次控制被过滤' },
  'DIVERSITY_SWAP': { zh: '多样性换位', desc: '为提升多样性调整排序' },
  'RESOURCE_SLOT_INSERT': { zh: '资源位插入', desc: '在信息流中插入广告位' },
}

/**
 * 格式化术语显示：中文（英文）
 */
export function formatTerm(term: string): string {
  const entry = glossary[term]
  if (entry) {
    return `${entry.zh}（${term}）`
  }
  return term
}

/**
 * 获取术语中文
 */
export function getTermZh(term: string): string {
  return glossary[term]?.zh || term
}









