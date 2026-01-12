/**
 * ADX v1 数据结构类型定义
 * 所有字段都是可选的，确保兼容旧数据结构
 */

export type OwnerType = 'DSP' | 'SSP' | 'ADX' | 'Algo' | 'Infra'

export interface ReasonItem {
  code: string
  owner?: OwnerType
  baseline_pct?: number
  treatment_pct?: number
}

export interface ActionItem {
  id: string
  title: string
  owner?: OwnerType
  validation?: string
  evidence_fields?: string[]
}

export interface DSPMetrics {
  ocpx?: {
    baseline?: number
    treatment?: number
  }
  bid_multiplier?: {
    baseline?: number
    treatment?: number
  }
  pacing?: {
    mode?: string
    early_hour_spend_cap?: {
      baseline?: number
      treatment?: number
    }
  }
  budget_exhausted_rate?: {
    baseline?: number
    treatment?: number
  }
}

export interface SSPMetrics {
  fill_rate?: {
    baseline?: number
    treatment?: number
  }
  floor_ecpm?: {
    baseline?: number
    treatment?: number
  }
  inventory_quality?: {
    baseline?: number
    treatment?: number
  }
}

export interface ADXMetrics {
  bid_request_qps?: {
    baseline?: number
    treatment?: number
  }
  bid_response_rate?: {
    baseline?: number
    treatment?: number
  }
  timeout_rate?: {
    baseline?: number
    treatment?: number
  }
  clearing_price_ecpm?: {
    baseline?: number
    treatment?: number
  }
}

export interface ExperimentADXV1 {
  id?: string
  title?: string
  goal?: string
  status?: 'normal' | 'warning' | 'abnormal'
  risk_level?: number
  bottleneck?: string
  lift_pct?: number
  summary?: {
    north_star?: {
      name?: string
      baseline?: number
      treatment?: number
      lift_pct?: number
    }
    guardrails?: Array<{
      name?: string
      trend?: 'up' | 'down' | 'flat'
    }>
    ceiling?: {
      current?: number
      ceiling?: number
      gap?: number
      limit_reason?: string
    }
    key_takeaway?: string
  }
  pipeline?: {
    stages?: Array<{
      name?: string
      latency_ms?: {
        baseline?: number
        treatment?: number
      }
      candidates?: {
        baseline?: number
        treatment?: number
      }
      note?: string
    }>
  }
  bidding_budget?: {
    dsp?: DSPMetrics
  }
  supply_coverage?: {
    ssp?: SSPMetrics
  }
  adx_exchange?: {
    adx?: ADXMetrics
  }
  reasons?: {
    rerank?: ReasonItem[]
    auction?: ReasonItem[]
  }
  actions?: ActionItem[]
  query_intent?: any
  coverage_breakdown?: any
}

export interface ExperimentsADXV1Data {
  last_updated?: string
  experiments?: ExperimentADXV1[]
}

/**
 * 校验并规范化实验数据，提供默认值
 */
export function normalizeExperimentADXV1(data: any): ExperimentADXV1 {
  if (!data || typeof data !== 'object') {
    return {}
  }
  
  return {
    id: data.id || '',
    title: data.title || '未知实验',
    goal: data.goal || '视频播放量',
    status: data.status || 'normal',
    risk_level: data.risk_level ?? 0,
    bottleneck: data.bottleneck || '',
    lift_pct: data.lift_pct ?? 0,
    summary: data.summary || {},
    pipeline: data.pipeline || { stages: [] },
    bidding_budget: data.bidding_budget || {},
    supply_coverage: data.supply_coverage || {},
    adx_exchange: data.adx_exchange || {},
    reasons: data.reasons || { rerank: [], auction: [] },
    actions: data.actions || [],
    query_intent: data.query_intent,
    coverage_breakdown: data.coverage_breakdown,
  }
}

/**
 * 从 reasons 和 actions 中提取所有 owner
 */
export function extractOwners(data: ExperimentADXV1): OwnerType[] {
  const owners = new Set<OwnerType>()
  
  // 从 reasons 提取
  if (data.reasons) {
    Object.values(data.reasons).forEach((reasonList) => {
      if (Array.isArray(reasonList)) {
        reasonList.forEach((item) => {
          if (item.owner) {
            owners.add(item.owner as OwnerType)
          }
        })
      }
    })
  }
  
  // 从 actions 提取
  if (data.actions && Array.isArray(data.actions)) {
    data.actions.forEach((action) => {
      if (action.owner) {
        owners.add(action.owner as OwnerType)
      }
    })
  }
  
  return Array.from(owners)
}

/**
 * 根据视角过滤 reasons
 */
export function filterReasonsByView(
  reasons: { rerank?: ReasonItem[]; auction?: ReasonItem[] } | undefined,
  view: 'All' | 'DSP' | 'SSP' | 'ADX'
): { rerank?: ReasonItem[]; auction?: ReasonItem[] } {
  if (!reasons || view === 'All') {
    return reasons || { rerank: [], auction: [] }
  }
  
  const filterFn = (items: ReasonItem[] | undefined) => {
    if (!items || !Array.isArray(items)) return []
    return items.filter((item) => item.owner === view)
  }
  
  return {
    rerank: filterFn(reasons.rerank),
    auction: filterFn(reasons.auction),
  }
}

/**
 * 根据视角过滤 actions
 */
export function filterActionsByView(
  actions: ActionItem[] | undefined,
  view: 'All' | 'DSP' | 'SSP' | 'ADX'
): ActionItem[] {
  if (!actions || !Array.isArray(actions) || view === 'All') {
    return actions || []
  }
  
  return actions.filter((action) => action.owner === view)
}



