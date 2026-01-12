// 数据加载器 - 类型定义和客户端辅助函数（不包含 fs/path）

export interface ExperimentSummary {
  experiment_id: string
  title: string
}

// v2 数据结构
export interface ExperimentDataV2 {
  experiment_id: string
  title: string
  created_at: string
  primary_segment: {
    id: string
    name: string
    dims: Record<string, any>
  }
  narrative: string
  knobs?: Record<string, any>
  kpi_framework?: {
    north_star: {
      name: string
      unit: string
      baseline_value: number
      treatment_value: number
    }
    guardrails: Array<{
      name: string
      unit: string
      baseline_value: number
      treatment_value: number
    }>
    process_kpis?: Array<{
      stage: string
      name: string
      baseline: number
      treatment: number
    }>
  }
  ceiling_estimate?: {
    ceiling_uplift_pct: number
    current_uplift_pct: number
    limit_stage: string
    key_path: string[]
    notes: string
  }
  pipeline: {
    funnel: {
      baseline: Record<string, number>
      treatment: Record<string, number>
    }
    latency_ms: {
      baseline: Record<string, number>
      treatment: Record<string, number>
    }
    category_dist: {
      baseline: Record<string, number>
      treatment: Record<string, number>
    }
    reasons: {
      rerank?: {
        baseline: Record<string, number>
        treatment: Record<string, number>
      }
      auction?: {
        baseline: Record<string, number>
        treatment: Record<string, number>
      }
    }
    search?: {
      query_dist: Array<{
        query: string
        share: number
        intent?: string
        ctr?: number
        cvr?: number
      }>
      match_rate: {
        baseline: number
        treatment: number
      }
      post_click_cvr: {
        baseline: number
        treatment: number
      }
    }
    bid?: {
      strategy: {
        type: string
        target: string
        multiplier_cap?: number[]
        notes?: string
      }
      pacing: {
        type: string
        daily_budget: number
        early_hour_spend_cap?: number
        notes?: string
      }
    }
    supply?: {
      inventory: {
        baseline: number
        treatment: number
      }
      freq_cap: {
        baseline: number
        treatment: number
      }
      geo_distribution?: Record<string, number>
      time_distribution?: Record<string, number>
    }
    query_intent?: {
      top_queries?: Array<{
        query: string
        intent: string
        impressions: number
        ctr: number
        cvr: number
        cost: number
        revenue: number
      }>
      intent_mix?: Array<{
        intent: string
        share: number
        ctr: number
        cvr: number
      }>
    }
    query_stats?: {
      top_queries: Array<{
        query: string
        intent: string
        baseline: {
          impressions: number
          clicks: number
          ctr: number
          lp_views: number // 落地页浏览量
          form_submits?: number // 表单提交数（可选）
          leads: number
          cvr: number
          revenue: number
          cpa?: number // 获客成本（可选）
        }
        treatment: {
          impressions: number
          clicks: number
          ctr: number
          lp_views: number // 落地页浏览量
          form_submits?: number // 表单提交数（可选）
          leads: number
          cvr: number
          revenue: number
          cpa?: number // 获客成本（可选）
        }
        landing_pages?: Array<{
          title: string
          url: string
          views: number
          form_submits?: number
          lead_rate: number
        }>
        issue_tag?: 'high_ctr_low_cvr' | 'high_cvr_low_volume' | 'low_ctr' | 'low_cvr'
        recommended_actions?: string[]
      }>
    }
    landing_stats?: {
      top_pages: Array<{
        title: string
        url: string
        baseline: {
          views: number
          leads: number
          lead_rate: number
          load_time: number
        }
        treatment: {
          views: number
          leads: number
          lead_rate: number
          load_time: number
        }
        issue_tag?: 'slow_load' | 'low_conversion' | 'high_bounce'
        recommended_actions?: string[]
      }>
    }
    bid_strategy?: {
      baseline: {
        type: string
        target: string
        multiplier_cap?: number[]
        floor_ecpm?: number
      }
      treatment: {
        type: string
        target: string
        multiplier_cap?: number[]
        floor_ecpm?: number
      }
    }
    pacing?: {
      baseline: {
        type: string
        daily_budget: number
        early_hour_spend_cap?: number
        hourly_distribution?: Record<string, number>
      }
      treatment: {
        type: string
        daily_budget: number
        early_hour_spend_cap?: number
        hourly_distribution?: Record<string, number>
      }
    }
    coverage_breakdown?: {
      baseline: {
        total_impressions: number
        by_intent: Record<string, number>
        by_device: Record<string, number>
        by_geo: Record<string, number>
      }
      treatment: {
        total_impressions: number
        by_intent: Record<string, number>
        by_device: Record<string, number>
        by_geo: Record<string, number>
      }
    }
    query_report?: {
      top_queries: Array<{
        query: string
        intent_label: string
        impressions: number
        clicks: number
        ctr: number
        lp_views: number
        leads: number
        cvr: number
        revenue_per_click?: number
        issue_tag?: string
        landing_pages?: Array<{
          title: string
          load_time: number
          lead_rate: number
        }>
        recommended_actions?: string[]
      }>
      funnel_by_intent: Array<{
        intent_label: string
        impressions: number
        clicks: number
        lp_views: number
        leads: number
        click_rate: number
        lp_rate: number
        lead_rate: number
      }>
      examples_by_issue: Array<{
        issue_tag: string
        description: string
        example_queries: Array<{
          query: string
          reason: string
        }>
        recommended_actions: string[]
      }>
    }
    auction: {
      baseline: {
        objective?: string
        floor_ecpm: number
        bid_ecpm_quantiles: Record<string, number>
        clearing_ecpm_quantiles?: Record<string, number>
        win_rate: number
        timeout_rate: number
        fill_rate?: number
      }
      treatment: {
        objective?: string
        floor_ecpm: number
        bid_ecpm_quantiles: Record<string, number>
        clearing_ecpm_quantiles?: Record<string, number>
        win_rate: number
        timeout_rate: number
        fill_rate?: number
      }
    }
    ocpx_timeseries: {
      hours?: number[]
      baseline: number[] | Array<{
        hour: number
        traffic_q: number
        spend: number
        target_cpa: number
        actual_cpa: number
        multiplier: number
        budget_left?: number
      }> | {
        multiplier: number[]
        cpa: number[]
        spend: number[]
      }
      treatment: number[] | Array<{
        hour: number
        traffic_q: number
        spend: number
        target_cpa: number
        actual_cpa: number
        multiplier: number
        budget_left?: number
      }> | {
        multiplier: number[]
        cpa: number[]
        spend: number[]
      }
    }
    topN_feed: {
      baseline: Array<{
        rank: number
        content_id: number
        category: string
        tags: string[]
        score: number
        author_id: number
        duration_s: number
      }>
      treatment: Array<{
        rank: number
        content_id: number
        category: string
        tags: string[]
        score: number
        author_id: number
        duration_s: number
      }>
    }
    bottlenecks?: Array<{
      stage?: string
      type?: string
      symptom?: string
      impact?: string
      node?: string // 兼容旧版本
      note?: string // 兼容旧版本
      suggested_actions?: string[]
    }>
  }
  metrics_summary?: {
    baseline: Record<string, any>
    treatment: Record<string, any>
  }
  breakdown?: Record<string, any>
  diagnosis_tree: {
    root: string
    branches: Array<{
      name: string
      node?: string // 兼容旧版本
      checks: string[]
      evidence_fields: string[]
      actions?: string[]
      type?: string // Coverage/Quality/Guardrail/Control
      stage?: string // Recall/Fine/Auction/Pacing/Timeout
      impact_metrics?: string[] // fill/CTR/revenue/cost/retention
      contribution?: number // pp 或占比变化
      evidence_link?: string // 跳转到对应图表的锚点
    }>
  }
}

// 统一的数据接口（兼容 v1 和 v2）
export type ExperimentData = ExperimentDataV2

// 辅助函数：获取北极星指标（兼容 v1 和 v2）
// 这些函数不依赖 fs/path，可以在客户端使用
export function getNorthStar(data: ExperimentData): { baseline: number | null; treatment: number | null; name: string; unit: string } {
  // 【修复】优先读取 v2 字段：north_star_baseline / north_star_treatment（在根级别）
  const rawData = data as any
  if (rawData.north_star_baseline != null || rawData.north_star_treatment != null) {
    const baseline = rawData.north_star_baseline != null && typeof rawData.north_star_baseline === 'number' ? rawData.north_star_baseline : null
    const treatment = rawData.north_star_treatment != null && typeof rawData.north_star_treatment === 'number' ? rawData.north_star_treatment : null
    if (baseline != null || treatment != null) {
      return {
        baseline,
        treatment,
        name: '视频播放量',
        unit: '次',
      }
    }
  }
  
  // 优先从 kpi_framework 读取
  if (data.kpi_framework?.north_star) {
    const baseline = data.kpi_framework.north_star.baseline_value ?? null
    const treatment = data.kpi_framework.north_star.treatment_value ?? null
    return {
      baseline: baseline != null ? baseline : null,
      treatment: treatment != null ? treatment : null,
      name: data.kpi_framework.north_star.name || '视频播放量',
      unit: data.kpi_framework.north_star.unit || '次',
    }
  }
  
  // 【新增】兼容 ADX v1 格式：从 summary.metrics_summary.north_star 读取
  const adxV1 = (data as any)?._adx_v1
  if (adxV1?.summary?.metrics_summary?.north_star) {
    const ns = adxV1.summary.metrics_summary.north_star
    const baseline = ns.baseline ?? null
    const treatment = ns.treatment ?? null
    if (baseline != null || treatment != null) {
      return {
        baseline: baseline != null && typeof baseline === 'number' ? baseline : null,
        treatment: treatment != null && typeof treatment === 'number' ? treatment : null,
        name: ns.name || '视频播放量',
        unit: ns.unit || '次',
      }
    }
  }
  
  // 【新增】兼容 ADX v1 格式：从 summary.north_star 读取（如果 metrics_summary 不存在）
  if (adxV1?.summary?.north_star) {
    const ns = adxV1.summary.north_star
    const baseline = ns.baseline ?? null
    const treatment = ns.treatment ?? null
    if (baseline != null || treatment != null) {
      return {
        baseline: baseline != null && typeof baseline === 'number' ? baseline : null,
        treatment: treatment != null && typeof treatment === 'number' ? treatment : null,
        name: ns.name || '视频播放量',
        unit: ns.unit || '次',
      }
    }
  }
  
  // 兼容 v1：从 metrics_summary.baseline.north_star 读取
  // 支持两种路径：.value 和 .ad_vv，以及 .revenue
  const baselineNorthStar = (data.metrics_summary?.baseline as any)?.north_star
  const treatmentNorthStar = (data.metrics_summary?.treatment as any)?.north_star
  
  // 优先读取 revenue，如果没有则读取 ad_vv，最后读取 value
  const baseline = baselineNorthStar?.revenue ?? baselineNorthStar?.ad_vv ?? baselineNorthStar?.value ?? null
  const treatment = treatmentNorthStar?.revenue ?? treatmentNorthStar?.ad_vv ?? treatmentNorthStar?.value ?? null
  
  // 如果 baseline 或 treatment 为 null/undefined，返回 null 而不是 0
  return {
    baseline: baseline != null && typeof baseline === 'number' ? baseline : null,
    treatment: treatment != null && typeof treatment === 'number' ? treatment : null,
    name: '视频播放量',
    unit: '次',
  }
}

// 辅助函数：获取护栏指标（兼容 v1 和 v2）
export function getGuardrails(data: ExperimentData): Array<{
  name: string
  unit: string
  baseline: number | null
  treatment: number | null
}> {
  if (data.kpi_framework?.guardrails) {
    return data.kpi_framework.guardrails.map(g => ({
      name: g.name || '',
      unit: g.unit || '',
      baseline: g.baseline_value != null && typeof g.baseline_value === 'number' ? g.baseline_value : null,
      treatment: g.treatment_value != null && typeof g.treatment_value === 'number' ? g.treatment_value : null,
    }))
  }
  
  // 【新增】兼容 ADX v1 数据：从 summary.guardrails 中提取
  const adxV1 = (data as any)?._adx_v1
  if (adxV1?.summary?.guardrails && Array.isArray(adxV1.summary.guardrails)) {
    return adxV1.summary.guardrails.map((g: any) => ({
      name: g.name || '',
      unit: '%',
      baseline: null, // ADX v1 格式中没有 baseline 值，返回 null 而不是 0
      treatment: null, // ADX v1 格式中只有 trend，没有具体数值，返回 null 而不是 0
    }))
  }
  
  // 兼容 v1：从 metrics_summary.baseline.guardrails 和 metrics_summary.treatment.guardrails 读取
  const guardrails = (data.metrics_summary?.treatment as any)?.guardrails ?? {}
  const baselineGuardrails = (data.metrics_summary?.baseline as any)?.guardrails ?? {}
  return Object.entries(guardrails).map(([key, value]) => {
    const name = key.includes('retention') ? '次日留存' :
                 key.includes('exit') ? '早退率' :
                 key.includes('complaint') ? '投诉率' :
                 key.includes('timeout') ? '超时率' :
                 key.includes('fill') ? '填充率' : key
    const unit = key.includes('retention') || key.includes('exit') || key.includes('timeout') || key.includes('fill') ? '%' :
                 key.includes('complaint') ? '‰' : ''
    const baselineValue = baselineGuardrails[key]
    const treatmentValue = value
    return {
      name,
      unit,
      // 使用 ?? null 而不是 || 0，这样 undefined/null 会显示为 "—"
      baseline: baselineValue != null && typeof baselineValue === 'number' ? baselineValue : null,
      treatment: treatmentValue != null && typeof treatmentValue === 'number' ? treatmentValue : null,
    }
  })
}

// 辅助函数：获取卡点（兼容 v1 和 v2）
export function getBottleneck(data: ExperimentData) {
  // 【防 500】确保 pipeline 存在
  if (!data.pipeline) {
    // 【新增】兼容 ADX v1 数据：从 _adx_v1 中提取 bottleneck
    const adxV1 = (data as any)?._adx_v1
    if (adxV1?.bottleneck) {
      return {
        stage: adxV1.bottleneck,
        node: adxV1.bottleneck,
        note: adxV1.summary?.key_takeaway || '',
        symptom: adxV1.summary?.key_takeaway || '',
        impact: '',
      }
    }
    return null
  }
  
  const bottlenecks = data.pipeline.bottlenecks || []
  if (bottlenecks.length === 0) return null
  
  const bottleneck = bottlenecks[0]
  // v2 格式
  if (bottleneck.stage && bottleneck.type && bottleneck.symptom && bottleneck.impact) {
    return bottleneck
  }
  // 兼容 v1 格式
  return {
    stage: bottleneck.node || bottleneck.stage || '',
    type: bottleneck.type || '',
    symptom: bottleneck.note || '',
    impact: '',
    node: bottleneck.node,
    note: bottleneck.note,
    suggested_actions: bottleneck.suggested_actions,
  }
}
