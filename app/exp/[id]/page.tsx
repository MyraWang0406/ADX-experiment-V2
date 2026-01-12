import { notFound } from 'next/navigation'
import Link from 'next/link'
import PipelineMap from '@/components/PipelineMap'
import FunnelComparison from '@/components/FunnelComparison'
import CategoryDistribution from '@/components/CategoryDistribution'
import TopNFeed from '@/components/TopNFeed'
import OCPXCurve from '@/components/OCPXCurve'
import DiagnosisTree from '@/components/DiagnosisTree'
import ReasonDistribution from '@/components/ReasonDistribution'
import AIReflection from '@/components/AIReflection'
import DecisionSummary from '@/components/DecisionSummary'
import AnchorNav from '@/components/AnchorNav'
import SearchIntentPanel from '@/components/SearchIntentPanel'
import AuctionBidPanel from '@/components/AuctionBidPanel'
import SupplyPanel from '@/components/SupplyPanel'
import DecisionPanel from '@/components/DecisionPanel'
import QueryIntentPanel from '@/components/QueryIntentPanel'
import QueryPanel from '@/components/QueryPanel'
import SearchQueryPanel from '@/components/SearchQueryPanel'
import LandingConversionPanel from '@/components/LandingConversionPanel'
import BiddingBudgetPanel from '@/components/BiddingBudgetPanel'
import TrafficCoveragePanel from '@/components/TrafficCoveragePanel'
import QueryConversionFunnel from '@/components/QueryConversionFunnel'
import ExperimentHeader from './ExperimentHeader'
import type { ExperimentData } from '@/lib/data-loader'
// Server Component: 使用统一的数据加载器（支持 demo/live 模式切换）
import { loadExperiment } from '@/lib/server/experiment-loader'
import { normalizePipeline } from '@/lib/normalize-pipeline'
import DebugFingerprint from '@/components/DebugFingerprint'
import ExperimentDetailClient, { ViewSwitcherInClient } from '@/components/exp/ExperimentDetailClient'

interface ExperimentPageProps {
  params: {
    id: string
  }
  searchParams?: {
    mode?: string | string[]
    tab?: string
    view?: string
  }
}

export default async function ExperimentPage({ params, searchParams }: ExperimentPageProps) {
  // 【防 500】确保 params.id 存在，避免 undefined 导致后续错误
  // 【兼容性】支持多种可能的参数名
  const expId = params?.id ?? (params ? Object.values(params)[0] as string : '') ?? ''
  
  // 【临时日志】开发环境输出 params 和 expId
  if (process.env.NODE_ENV === 'development') {
    console.log('[exp] params=', params, 'expId=', expId)
  }
  
  if (!expId || typeof expId !== 'string') {
    const errorMsg = `Missing expId in route params. Received params: ${JSON.stringify(params)}`
    console.error('[exp]', errorMsg)
    throw new Error(errorMsg)
  }
  
  let experiment: ExperimentData | null = null
  let dataSource: string = 'unknown'
  
  try {
    // 【临时日志】开发环境输出加载 URL
    if (process.env.NODE_ENV === 'development') {
      console.log('[exp] loading url=', `/mock/experiments/${expId}.json (will try _mock first)`)
    }
    
    // 【防 500】使用统一的数据加载器，支持 demo/live 模式切换
    // 模式优先级：searchParams.mode > 环境变量 > demo（默认）
    const data = await loadExperiment(expId, undefined, searchParams)
    if (!data || typeof data !== 'object') {
      // 【防 500】数据不存在或格式错误时，不抛出异常，而是调用 notFound()（返回 404，不是 500）
      console.error(`[${expId}] loadExperiment returned null or invalid data`)
      notFound()
      return null as any
    }
    experiment = data
    
    // 【Debug】确定数据来源（从 _adx_v1 标记或文件路径推断）
    if ((experiment as any)?._adx_v1) {
      dataSource = '/_mock/experiments_adx_v1.json'
    } else {
      // 尝试从文件路径推断（如果数据加载器有记录的话）
      dataSource = `/_mock/experiments/${expId}.json`
    }
  } catch (error) {
    // 【防 500】即使数据加载器内部抛出异常（理论上不应该），也要捕获并返回 404 而不是 500
    console.error(`Failed to load experiment ${expId}:`, error)
    notFound()
    return null as any
  }
  
  // 【防 500】双重检查：确保 experiment 不为 null，避免后续组件访问 null 属性
  if (!experiment) {
    notFound()
    return null as any
  }
  
  // 【防 500】为 experiment 提供最小化的 fallback 结构，确保所有必需字段都存在
  // 【统一 normalize】先 normalize pipeline 数据，确保所有组件接收统一格式
  const normalizedPipeline = normalizePipeline(experiment)
  
  const safeExperiment: ExperimentData = {
    ...experiment, // 先展开原有字段
    // 【防 500】然后覆盖可能缺失的必需字段，确保它们都有值
    experiment_id: experiment.experiment_id || expId,
    title: experiment.title || '未知实验',
    created_at: experiment.created_at || new Date().toISOString(),
    narrative: experiment.narrative || '',
    primary_segment: experiment.primary_segment || { id: '', name: '', dims: {} },
    // 【统一 normalize】使用 normalize 后的 pipeline 数据
    pipeline: {
      ...normalizedPipeline,
      // 保留原始字段（如果组件需要）
      ...experiment.pipeline,
    },
    diagnosis_tree: experiment.diagnosis_tree || { root: '', branches: [] },
  }

  return (
    <>
      {/* 【Debug】在浏览器 console 打印版本指纹 */}
      <DebugFingerprint expId={expId} pipeline={safeExperiment.pipeline} />
      <div className="min-h-screen bg-gray-50">
        {/* 【防 500】AnchorNav 是 Client Component，使用 window/document，但在 SSR 阶段不会执行这些代码，所以安全 */}
        <AnchorNav />
        {/* 【防 500】ExperimentHeader 是 Client Component，传入安全的数据结构 */}
        <ExperimentHeader experiment={safeExperiment} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* 决策摘要 + 下一步动作 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            {/* 【防 500】DecisionSummary 是 Client Component，传入安全的数据结构 */}
            <DecisionSummary experiment={safeExperiment} />
          </div>
          <div className="lg:col-span-1">
            {/* 【防 500】DecisionPanel 是 Client Component，传入安全的数据结构 */}
            <DecisionPanel experiment={safeExperiment} />
          </div>
        </div>

        <ExperimentDetailClient data={safeExperiment} dataSource={dataSource}>
          {/* 搜索词&意图 */}
          <div id="query-intent" className="space-y-6">
            {/* 【防 500】使用可选链和逻辑与，确保 pipeline 和 query_stats 存在才渲染 */}
            {safeExperiment.pipeline?.query_stats && (
              <>
                <QueryConversionFunnel
                  data={{ query_stats: safeExperiment.pipeline.query_stats }}
                  narrative={safeExperiment.narrative || ''}
                />
                <SearchQueryPanel
                  data={{ query_stats: safeExperiment.pipeline.query_stats }}
                  narrative={safeExperiment.narrative || ''}
                />
              </>
            )}
            {safeExperiment.pipeline?.query_intent && (
              <QueryIntentPanel
                data={{ query_intent: safeExperiment.pipeline.query_intent }}
                narrative={safeExperiment.narrative || ''}
              />
            )}
            {safeExperiment.pipeline?.query_report && (
              <QueryPanel
                data={{ query_report: safeExperiment.pipeline.query_report }}
                narrative={safeExperiment.narrative || ''}
              />
            )}
          </div>

          {/* 落地页&转化 */}
          <div id="landing-conversion" className="space-y-6">
            {/* 【防 500】使用可选链确保 landing_stats 存在 */}
            {safeExperiment.pipeline?.landing_stats && (
              <LandingConversionPanel
                data={{ landing_stats: safeExperiment.pipeline.landing_stats }}
                narrative={safeExperiment.narrative || ''}
              />
            )}
          </div>

          {/* 出价&预算 */}
          <div id="bidding-budget" className="space-y-6">
            {/* 【防 500】使用可选链确保 bid_strategy 或 pacing 存在，或 ADX v1 数据存在 */}
            {(safeExperiment.pipeline?.bid_strategy || safeExperiment.pipeline?.pacing || (safeExperiment as any)?._adx_v1?.bidding_budget || (safeExperiment as any)?._adx_v1?.supply_coverage || (safeExperiment as any)?._adx_v1?.adx_exchange) && (
              <BiddingBudgetPanel
                data={{
                  bid_strategy: safeExperiment.pipeline?.bid_strategy,
                  pacing: safeExperiment.pipeline?.pacing,
                  // 【修复类型错误】使用类型断言访问可能不存在的字段
                  bidding_budget: (safeExperiment.pipeline as any)?.bidding_budget || (safeExperiment as any)?._adx_v1?.bidding_budget,
                  supply_coverage: (safeExperiment.pipeline as any)?.supply_coverage || (safeExperiment as any)?._adx_v1?.supply_coverage,
                  adx_exchange: (safeExperiment.pipeline as any)?.adx_exchange || (safeExperiment as any)?._adx_v1?.adx_exchange,
                }}
                narrative={safeExperiment.narrative || ''}
                pipeline={safeExperiment.pipeline}
              />
            )}
          </div>

          {/* 流量覆盖 */}
          <div id="traffic-coverage" className="space-y-6">
            {/* 【防 500】使用可选链确保 coverage_breakdown 存在 */}
            {safeExperiment.pipeline?.coverage_breakdown && (
              <TrafficCoveragePanel
                data={{ coverage_breakdown: safeExperiment.pipeline.coverage_breakdown }}
                narrative={safeExperiment.narrative || ''}
              />
            )}
            {/* 【防 500】PipelineMap 需要 pipeline 数据，使用安全的数据结构 */}
            <PipelineMap 
              data={safeExperiment.pipeline || { funnel: { baseline: {}, treatment: {} }, category_dist: { baseline: {}, treatment: {} } }} 
              narrative={safeExperiment.narrative || ''}
              processKpis={safeExperiment.kpi_framework?.process_kpis}
            />
            {/* 【防 500】FunnelComparison 需要 funnel 数据，使用可选链和 fallback */}
            <FunnelComparison 
              data={safeExperiment.pipeline?.funnel || { baseline: {}, treatment: {} }}
              narrative={safeExperiment.narrative || ''}
            />
            {safeExperiment.pipeline?.search && (
              <SearchIntentPanel
                data={safeExperiment.pipeline.search}
                narrative={safeExperiment.narrative || ''}
              />
            )}
            {safeExperiment.pipeline?.supply && (
              <SupplyPanel
                data={safeExperiment.pipeline.supply}
                narrative={safeExperiment.narrative || ''}
              />
            )}
          </div>

          {/* 排序策略链路 */}
          <div id="ranking-strategy" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">排序策略（Ranking / Relevance）</h2>
            
            {/* 【防 500】CategoryDistribution 需要 category_dist 数据，使用可选链和 fallback */}
            <CategoryDistribution 
              data={safeExperiment.pipeline?.category_dist || { baseline: {}, treatment: {} }}
              narrative={safeExperiment.narrative || ''}
            />
            
            <div id="topn">
              {/* 【防 500】TopNFeed 需要 topN_feed 数据，使用可选链和 fallback */}
              <TopNFeed 
                data={safeExperiment.pipeline?.topN_feed || { baseline: [], treatment: [] }}
                narrative={safeExperiment.narrative || ''}
              />
            </div>
          </div>

          {/* 出价策略链路 */}
          <div id="bidding-strategy" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">出价策略（Bidding / Pacing / Auction）</h2>
            
            {/* 【防 500】AuctionBidPanel 需要多个可选字段，使用可选链 */}
            <AuctionBidPanel
              auction={safeExperiment.pipeline?.auction}
              bid={safeExperiment.pipeline?.bid}
              reasons={safeExperiment.pipeline?.reasons}
              narrative={safeExperiment.narrative || ''}
            />
            
            {/* 【防 500】OCPXCurve 已经有 fallback，但确保 narrative 不为 undefined */}
            <OCPXCurve 
              data={safeExperiment.pipeline?.ocpx_timeseries || { baseline: [], treatment: [] }}
              narrative={safeExperiment.narrative || ''}
            />
          </div>

          {/* 原因诊断 */}
          <div id="diagnosis">
            {/* View Switcher - 视角切换控件 */}
            <ViewSwitcherInClient />
            {/* 【防 500】ReasonDistribution 需要 reasons 数据，使用可选链 */}
            <ReasonDistribution 
              data={safeExperiment.pipeline?.reasons || (safeExperiment as any)?._adx_v1?.reasons}
              narrative={safeExperiment.narrative || ''}
            />
            {/* 【防 500】DiagnosisTree 需要 diagnosis_tree 数据，使用可选链和 fallback */}
            <DiagnosisTree 
              data={safeExperiment.diagnosis_tree || null}
              narrative={safeExperiment.narrative || ''}
            />
          </div>
        </ExperimentDetailClient>
        </div>
      </div>
    </>
  )
}
