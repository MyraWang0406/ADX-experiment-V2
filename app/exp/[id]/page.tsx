import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import PipelineMap from '@/components/PipelineMap'
import FunnelComparison from '@/components/FunnelComparison'
import CategoryDistribution from '@/components/CategoryDistribution'
import TopNFeed from '@/components/TopNFeed'
import OCPXCurve from '@/components/OCPXCurve'
import DiagnosisTree from '@/components/DiagnosisTree'
import ReasonDistribution from '@/components/ReasonDistribution'
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

import { loadExperiment } from '@/lib/server/experiment-loader'
import { loadExperimentsList } from '@/lib/server/data-loader'
import { normalizePipeline } from '@/lib/normalize-pipeline'
import DebugFingerprint from '@/components/DebugFingerprint'
import ExperimentDetailClient, { ViewSwitcherInClient } from '@/components/exp/ExperimentDetailClient'

// ✅ 静态导出：动态路由必须列出所有 params，并禁止 fallback
export const dynamicParams = false
export const dynamic = 'force-static'
export const revalidate = false

// ✅ 重要：不要把 Next 的 notFound()/redirect() 当成普通 error catch 掉
function isNextControlFlowError(err: any) {
  const d = String(err?.digest || '')
  return d.includes('NEXT_NOT_FOUND') || d.includes('NEXT_REDIRECT')
}

export async function generateStaticParams() {
  const fallback = ['exp_001', 'exp_002', 'exp_003']

  try {
    const list: any[] = await loadExperimentsList()
    const ids = (Array.isArray(list) ? list : [])
      .map((x: any) => String(x?.experiment_id ?? x?.id ?? x?.exp_id ?? '').trim())
      .filter(Boolean)

    const uniq = Array.from(new Set(ids))
    const finalIds = uniq.length ? uniq : fallback
    return finalIds.map((id) => ({ id }))
  } catch {
    return fallback.map((id) => ({ id }))
  }
}

interface ExperimentPageProps {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

function toNumber(v: any) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function wrapScalarOCPX(ocpx: any) {
  if (!ocpx || typeof ocpx !== 'object') return null
  const b = toNumber((ocpx as any).baseline)
  const t = toNumber((ocpx as any).treatment)
  if (b === null && t === null) return null

  return {
    baseline: { multiplier: b !== null ? [b] : [], actual_cpa: [], spend: [], target_cpa: [] },
    treatment: { multiplier: t !== null ? [t] : [], actual_cpa: [], spend: [], target_cpa: [] },
    hours: [0],
  }
}

export default async function ExperimentPage({ params, searchParams }: ExperimentPageProps) {
  const expId = params?.id
  if (!expId || typeof expId !== 'string') notFound()

  // ✅ lite=1：先验证路由/数据/渲染链路 OK（避免大组件引起额外噪音）
  const lite = String((searchParams as any)?.lite || '') === '1'
  if (lite) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-xl font-bold">EXP LITE OK</h1>
        <pre className="mt-4 text-sm bg-gray-50 border rounded p-3">{expId}</pre>
      </div>
    )
  }

  let experiment: ExperimentData | null = null

  try {
    const data = await loadExperiment(expId, undefined as any, undefined as any)
    if (!data || typeof data !== 'object') notFound()
    experiment = data as ExperimentData
  } catch (err: any) {
    if (isNextControlFlowError(err)) throw err
    console.error(`[exp/${expId}] loadExperiment failed:`, err)
    notFound()
  }

  if (!experiment) notFound()

  let normalizedPipeline: any = {}
  try {
    normalizedPipeline = normalizePipeline(experiment)
  } catch (err) {
    console.error(`[exp/${expId}] normalizePipeline failed:`, err)
    normalizedPipeline = {}
  }

  const safeExperiment: ExperimentData = {
    ...experiment,
    experiment_id: (experiment as any).experiment_id || (experiment as any).id || expId,
    title: (experiment as any).title || '未知实验',
    created_at: (experiment as any).created_at || new Date().toISOString(),
    narrative: (experiment as any).narrative || '',
    primary_segment: (experiment as any).primary_segment || { id: '', name: '', dims: {} },

    pipeline: {
      ...((experiment as any).pipeline || {}),
      ...(normalizedPipeline || {}),
    },

    diagnosis_tree: (experiment as any).diagnosis_tree || { root: '', branches: [] },
  }

  const dataSource =
    String((safeExperiment as any)?._source || '') || `experiment:${safeExperiment.experiment_id}`

  const ocpxCandidate =
    (safeExperiment.pipeline as any)?.ocpx_timeseries ||
    (safeExperiment.pipeline as any)?.bidding_budget?.dsp?.ocpx ||
    (safeExperiment as any)?._adx_v1?.bidding_budget?.dsp?.ocpx

  const ocpxData =
    (safeExperiment.pipeline as any)?.ocpx_timeseries ||
    wrapScalarOCPX(ocpxCandidate) ||
    { baseline: [], treatment: [] }

  return (
    <>
      <DebugFingerprint expId={expId} pipeline={(safeExperiment as any).pipeline} />

      <div className="min-h-screen bg-gray-50">
        <AnchorNav />
        <ExperimentHeader experiment={safeExperiment} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <DecisionSummary experiment={safeExperiment} />
            </div>
            <div className="lg:col-span-1">
              <DecisionPanel experiment={safeExperiment} />
            </div>
          </div>

          <Suspense fallback={<div className="p-4 text-center text-gray-500">加载实验详情中...</div>}>
            <ExperimentDetailClient data={safeExperiment} dataSource={dataSource}>
              {/* 搜索词&意图 */}
              <div id="query-intent" className="space-y-6">
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
                {safeExperiment.pipeline?.landing_stats && (
                  <LandingConversionPanel
                    data={{ landing_stats: safeExperiment.pipeline.landing_stats }}
                    narrative={safeExperiment.narrative || ''}
                  />
                )}
              </div>

              {/* 出价&预算 */}
              <div id="bidding-budget" className="space-y-6">
                {(safeExperiment.pipeline?.bid_strategy ||
                  safeExperiment.pipeline?.pacing ||
                  (safeExperiment.pipeline as any)?.bidding_budget ||
                  (safeExperiment.pipeline as any)?.supply_coverage ||
                  (safeExperiment.pipeline as any)?.adx_exchange ||
                  (safeExperiment as any)?._adx_v1?.bidding_budget ||
                  (safeExperiment as any)?._adx_v1?.supply_coverage ||
                  (safeExperiment as any)?._adx_v1?.adx_exchange) && (
                  <BiddingBudgetPanel
                    data={{
                      bid_strategy: safeExperiment.pipeline?.bid_strategy,
                      pacing: safeExperiment.pipeline?.pacing,
                      bidding_budget:
                        (safeExperiment.pipeline as any)?.bidding_budget ||
                        (safeExperiment as any)?._adx_v1?.bidding_budget,
                      supply_coverage:
                        (safeExperiment.pipeline as any)?.supply_coverage ||
                        (safeExperiment as any)?._adx_v1?.supply_coverage,
                      adx_exchange:
                        (safeExperiment.pipeline as any)?.adx_exchange ||
                        (safeExperiment as any)?._adx_v1?.adx_exchange,
                    }}
                    narrative={safeExperiment.narrative || ''}
                    pipeline={safeExperiment.pipeline}
                  />
                )}
              </div>

              {/* 流量覆盖 */}
              <div id="traffic-coverage" className="space-y-6">
                {safeExperiment.pipeline?.coverage_breakdown && (
                  <TrafficCoveragePanel
                    data={{ coverage_breakdown: safeExperiment.pipeline.coverage_breakdown }}
                    narrative={safeExperiment.narrative || ''}
                  />
                )}

                <PipelineMap
                  data={
                    safeExperiment.pipeline || {
                      funnel: { baseline: {}, treatment: {} },
                      category_dist: { baseline: {}, treatment: {} },
                    }
                  }
                  narrative={safeExperiment.narrative || ''}
                  processKpis={safeExperiment.kpi_framework?.process_kpis}
                />

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
                  <SupplyPanel data={safeExperiment.pipeline.supply} narrative={safeExperiment.narrative || ''} />
                )}
              </div>

              {/* 排序策略链路 */}
              <div id="ranking-strategy" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">
                  排序策略（Ranking / Relevance）
                </h2>

                <CategoryDistribution
                  data={safeExperiment.pipeline?.category_dist || { baseline: {}, treatment: {} }}
                  narrative={safeExperiment.narrative || ''}
                />

                <div id="topn">
                  <TopNFeed
                    data={safeExperiment.pipeline?.topN_feed || { baseline: [], treatment: [] }}
                    narrative={safeExperiment.narrative || ''}
                  />
                </div>
              </div>

              {/* 出价策略链路 */}
              <div id="bidding-strategy" className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">
                  出价策略（Bidding / Pacing / Auction）
                </h2>

                <AuctionBidPanel
                  auction={safeExperiment.pipeline?.auction}
                  bid={safeExperiment.pipeline?.bid}
                  reasons={safeExperiment.pipeline?.reasons}
                  narrative={safeExperiment.narrative || ''}
                />

                <OCPXCurve data={ocpxData} narrative={safeExperiment.narrative || ''} />
              </div>

              {/* 原因诊断 */}
              <div id="diagnosis">
                <ViewSwitcherInClient />

                <ReasonDistribution
                  data={safeExperiment.pipeline?.reasons || (safeExperiment as any)?._adx_v1?.reasons}
                  narrative={safeExperiment.narrative || ''}
                />

                <DiagnosisTree
                  data={(safeExperiment as any).diagnosis_tree || null}
                  narrative={safeExperiment.narrative || ''}
                />
              </div>
            </ExperimentDetailClient>
          </Suspense>
        </div>
      </div>
    </>
  )
}
