// 术语字典：指标、阶段、原因码、字段标签

export interface MetricTerm {
  zh: string
  en: string
  desc: string
  why_it_matters: string
}

export interface PipelineStageTerm {
  zh: string
  desc: string
}

export interface ReasonCodeTerm {
  zh: string
  desc: string
  impact: string
  suggestions: string[]
}

export interface FieldLabelTerm {
  zh: string
  desc: string
}

// Metrics 指标
export const metrics: Record<string, MetricTerm> = {
  ad_vv: {
    zh: '视频播放量',
    en: 'ad_vv',
    desc: '广告视频的总播放次数，是衡量广告曝光效果的核心指标',
    why_it_matters: '视频播放量直接影响广告收入和用户体验，是北极星指标之一'
  },
  revenue: {
    zh: '收入',
    en: 'revenue',
    desc: '广告带来的总收入',
    why_it_matters: '收入是商业化目标的核心指标，直接影响业务收益'
  },
  ctr: {
    zh: '点击率',
    en: 'CTR',
    desc: '点击率 = 点击数 / 曝光数，衡量广告对用户的吸引力',
    why_it_matters: '点击率反映广告内容质量和用户匹配度，影响整体转化效果'
  },
  cvr: {
    zh: '转化率',
    en: 'CVR',
    desc: '转化率 = 转化数 / 点击数，衡量用户从点击到完成目标行为的比例',
    why_it_matters: '转化率反映广告投放的精准度和用户质量，直接影响收入'
  },
  cpa: {
    zh: '获客成本',
    en: 'CPA',
    desc: 'Cost Per Action，每次转化动作的成本',
    why_it_matters: 'CPA 控制投放成本，需要平衡获客成本和转化质量'
  },
  ecpm: {
    zh: '千次曝光收入',
    en: 'eCPM',
    desc: 'Effective Cost Per Mille，每千次曝光带来的收入',
    why_it_matters: 'eCPM 反映广告单价和填充率，是收入效率的重要指标'
  },
  floor_ecpm: {
    zh: '底价',
    en: 'floor_ecpm',
    desc: '广告拍卖的最低出价，低于此价格不会参与竞价',
    why_it_matters: '底价设置影响广告填充率和收入，需要平衡填充和单价'
  },
  win_rate: {
    zh: '胜率',
    en: 'win_rate',
    desc: '在广告拍卖中成功竞得的比例',
    why_it_matters: '胜率反映出价策略的有效性，影响广告曝光机会'
  },
  timeout_rate: {
    zh: '超时率',
    en: 'timeout_rate',
    desc: '广告请求超过设定时间未返回的比例',
    why_it_matters: '超时率影响用户体验和广告填充，需要优化系统性能'
  },
  fill_rate: {
    zh: '填充率',
    en: 'fill_rate',
    desc: '广告请求成功返回广告的比例',
    why_it_matters: '填充率直接影响广告曝光机会和收入，是重要的护栏指标'
  },
  d1_retention: {
    zh: '次日留存率',
    en: 'd1_retention',
    desc: '用户次日仍在使用产品的比例',
    why_it_matters: '留存率反映用户体验质量，是重要的护栏指标'
  },
  early_exit_rate: {
    zh: '早退率',
    en: 'early_exit_rate',
    desc: '用户提前退出应用的比例',
    why_it_matters: '早退率反映用户体验问题，过高会影响长期留存'
  },
  complaint_rate: {
    zh: '投诉率',
    en: 'complaint_rate',
    desc: '用户投诉的比例',
    why_it_matters: '投诉率反映内容质量和用户体验，是重要的护栏指标'
  },
  completion_rate: {
    zh: '完播率',
    en: 'completion_rate',
    desc: '视频播放完成的比例',
    why_it_matters: '完播率反映内容质量和用户兴趣，影响用户体验'
  },
  load_fail_rate: {
    zh: '加载失败率',
    en: 'load_fail_rate',
    desc: '内容加载失败的比例',
    why_it_matters: '加载失败率影响用户体验，需要优化系统稳定性'
  },
  multiplier: {
    zh: '倍率',
    en: 'multiplier',
    desc: 'OCPX 控制中的倍率，用于动态调整出价',
    why_it_matters: '倍率稳定性影响 CPA 控制精度，波动过大需要优化'
  }
}

// Pipeline 阶段
export const pipelineStages: Record<string, PipelineStageTerm> = {
  recall: {
    zh: '召回',
    desc: '从海量内容库中初步筛选候选内容，扩大候选池'
  },
  coarse: {
    zh: '粗排',
    desc: '对召回的内容进行快速排序，筛选出较优的候选'
  },
  fine: {
    zh: '精排',
    desc: '对粗排后的内容进行精细排序，计算最终得分'
  },
  rerank: {
    zh: '重排',
    desc: '对精排结果进行多样性调整和去重，优化用户体验'
  },
  auction: {
    zh: '拍卖',
    desc: '广告竞价环节，决定最终展示的广告'
  }
}

// Reason Codes 原因码
export const reasonCodes: Record<string, ReasonCodeTerm> = {
  BID_TOO_LOW: {
    zh: '出价过低',
    desc: '广告出价低于底价，无法参与竞价',
    impact: '导致广告无法展示，填充率下降，影响收入',
    suggestions: [
      '提高底价设置，平衡填充率和单价',
      '优化 OCPX 倍率，提升出价竞争力',
      '检查预算分配，确保有足够预算参与竞价'
    ]
  },
  BUDGET_EXHAUSTED: {
    zh: '预算耗尽',
    desc: '当日广告预算已用完，无法继续投放',
    impact: '导致广告提前停止投放，影响曝光和收入',
    suggestions: [
      '调整预算分配节奏（pacing），避免早花光',
      '增加日预算或优化出价策略',
      '检查预算消耗速度，优化投放时段'
    ]
  },
  TIMEOUT: {
    zh: '请求超时',
    desc: '广告请求超过设定时间未返回结果',
    impact: '导致广告无法展示，填充率下降，用户体验差',
    suggestions: [
      '优化系统性能，降低响应延迟',
      '调整超时阈值，平衡成功率和响应速度',
      '检查网络和服务器负载，排查性能瓶颈'
    ]
  },
  FILTERED_BY_QUALITY: {
    zh: '质量过滤',
    desc: '内容被质量门槛过滤掉，不符合展示标准',
    impact: '导致可用内容减少，影响填充率和用户体验',
    suggestions: [
      '优化内容质量评估标准，避免过度过滤',
      '提升内容质量，减少被过滤的比例',
      '调整质量阈值，平衡质量和数量'
    ]
  },
  FILTERED_BY_DUP: {
    zh: '去重过滤',
    desc: '内容因重复展示被过滤',
    impact: '保证内容多样性，但可能影响填充率',
    suggestions: [
      '优化去重策略，平衡多样性和填充率',
      '增加内容池规模，提供更多候选',
      '调整去重时间窗口'
    ]
  },
  FILTERED_BY_FREQ_CAP: {
    zh: '频控过滤',
    desc: '内容因频次控制被过滤，避免过度曝光',
    impact: '保护用户体验，但可能影响填充率',
    suggestions: [
      '优化频控策略，平衡用户体验和填充率',
      '调整频控阈值，根据用户反馈优化',
      '增加内容多样性，减少对单一内容的依赖'
    ]
  },
  DIVERSITY_SWAP: {
    zh: '多样性换位',
    desc: '为了提升内容多样性，调整了内容排序',
    impact: '提升用户体验，但可能影响相关性',
    suggestions: [
      '优化多样性策略，平衡多样性和相关性',
      '调整多样性权重，根据用户反馈优化',
      '监控多样性对核心指标的影响'
    ]
  },
  RESOURCE_SLOT_INSERT: {
    zh: '资源位插入',
    desc: '在信息流中插入广告资源位',
    impact: '增加广告曝光机会，但可能影响用户体验',
    suggestions: [
      '优化资源位插入策略，平衡收入和体验',
      '调整插入频率和位置，减少对用户体验的影响',
      '监控插入对核心指标的影响'
    ]
  }
}

// Field Labels 字段标签
export const fieldLabels: Record<string, FieldLabelTerm> = {
  after_recall: {
    zh: '召回后',
    desc: '经过召回阶段后的内容数量'
  },
  after_coarse: {
    zh: '粗排后',
    desc: '经过粗排阶段后的内容数量'
  },
  after_fine: {
    zh: '精排后',
    desc: '经过精排阶段后的内容数量'
  },
  final: {
    zh: '最终',
    desc: '最终展示给用户的内容数量'
  },
  pool: {
    zh: '候选池',
    desc: '初始候选内容池的大小'
  },
  floor_ecpm: {
    zh: '底价',
    desc: '广告拍卖的最低出价'
  },
  win_rate: {
    zh: '胜率',
    desc: '在广告拍卖中成功竞得的比例'
  },
  timeout_rate: {
    zh: '超时率',
    desc: '请求超时的比例'
  },
  fill_rate: {
    zh: '填充率',
    desc: '广告请求成功返回的比例'
  },
  bid_ecpm_quantiles: {
    zh: '出价分位数',
    desc: '广告出价的分位数分布（p10/p50/p90）'
  },
  clearing_ecpm_quantiles: {
    zh: '成交价分位数',
    desc: '广告成交价的分位数分布'
  }
}

// 获取术语的辅助函数
export function getMetricTerm(key: string): MetricTerm | null {
  return metrics[key] || null
}

export function getPipelineStageTerm(key: string): PipelineStageTerm | null {
  return pipelineStages[key] || null
}

export function getReasonCodeTerm(key: string): ReasonCodeTerm | null {
  return reasonCodes[key] || null
}

export function getFieldLabelTerm(key: string): FieldLabelTerm | null {
  return fieldLabels[key] || null
}

// 格式化显示
export function formatMetric(key: string): string {
  const term = getMetricTerm(key)
  if (term) {
    return `${term.zh}（${term.en}）`
  }
  return key
}

export function formatPipelineStage(key: string): string {
  const term = getPipelineStageTerm(key)
  if (term) {
    return term.zh
  }
  return key
}

export function formatReasonCode(key: string): string {
  const term = getReasonCodeTerm(key)
  if (term) {
    return `${term.zh}（${key}）`
  }
  return key
}

export function formatFieldLabel(key: string): string {
  const term = getFieldLabelTerm(key)
  if (term) {
    return term.zh
  }
  return key
}







