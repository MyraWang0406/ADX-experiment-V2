import { Suspense } from 'react'
import ExperimentSummaryCard from '@/components/ExperimentSummaryCard'
import DebugPanel from '@/components/DebugPanel'

// Server Component: 直接使用 server-only 函数读取数据（不使用 HTTP fetch）
import { loadExperimentsList, loadExperimentData } from '@/lib/server/data-loader'

interface ExperimentWithData {
  id: string
  title: string
  created_at: string
  data: any
  status?: {
    status: 'NORMAL' | 'WARNING' | 'ALERT'
    isAbnormal: boolean
    hasBottleneck: boolean
  }
  conclusion?: string
}

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'NORMAL':
      return { text: '正常', color: 'text-green-700 bg-green-50 border-green-200' }
    case 'WARNING':
      return { text: '关注', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' }
    case 'ALERT':
      return { text: '异常', color: 'text-red-700 bg-red-50 border-red-200' }
    default:
      return { text: '未知', color: 'text-gray-700 bg-gray-50 border-gray-200' }
  }
}

// 计算实验状态：基于护栏是否异常 + 是否存在瓶颈
const computeExperimentStatus = (exp: ExperimentWithData, getGuardrails: any, getBottleneck: any) => {
  try {
    const guardrails = getGuardrails(exp.data)
    const bottleneck = getBottleneck(exp.data)

    const isAbnormal = guardrails?.some((g: any) => g.status && g.status !== 'normal') || false
    const hasBottleneck = bottleneck && bottleneck.title && bottleneck.title !== '无显著瓶颈'

    let status: 'NORMAL' | 'WARNING' | 'ALERT' = 'NORMAL'
    if (isAbnormal) status = 'ALERT'
    else if (hasBottleneck) status = 'WARNING'

    return { status, isAbnormal, hasBottleneck }
  } catch (e) {
    console.warn('[computeExperimentStatus] failed:', e)
    return { status: 'NORMAL' as const, isAbnormal: false, hasBottleneck: false }
  }
}

// 生成一句话结论：用于首页卡片展示
const generateConclusion = (exp: ExperimentWithData, getGuardrails: any, getBottleneck: any) => {
  try {
    const guardrails = getGuardrails(exp.data)
    const bottleneck = getBottleneck(exp.data)

    const abnormalCount = guardrails?.filter((g: any) => g.status && g.status !== 'normal')?.length || 0
    const bottleneckText =
      bottleneck && bottleneck.title && bottleneck.title !== '无显著瓶颈'
        ? `存在瓶颈：${bottleneck.title}`
        : '无显著瓶颈'

    if (abnormalCount > 0) {
      return `护栏异常 ${abnormalCount} 项，${bottleneckText}`
    }
    return `护栏正常，${bottleneckText}`
  } catch (e) {
    return '数据不足，建议补齐关键指标'
  }
}

export default async function Home() {
  const experimentsList = await loadExperimentsList()

  // 动态导入 data-loader 的业务函数（避免 server/client 混淆）
  const { getGuardrails, getBottleneck } = await import('@/lib/data-loader')

  // 【关键修复】不要因为某一个实验 json 缺失就让首页整页 500
  // 缺失的数据直接跳过，并在开发态 console 给出提示
  const loaded = await Promise.all(
    experimentsList.map(async (exp: any): Promise<ExperimentWithData | null> => {
      const id = String(exp?.experiment_id ?? exp?.id ?? exp?.exp_id ?? '').trim()
      if (!id) return null

      const data = await loadExperimentData(id)
      if (!data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Home] Experiment ${id} not found, skipped`)
        }
        return null
      }

      return {
        id,
        title: exp?.title || data?.title || id,
        created_at: data?.created_at || exp?.created_at || new Date().toISOString(),
        data,
      }
    })
  )

  const experimentsWithData: ExperimentWithData[] = loaded.filter(
    (x): x is ExperimentWithData => Boolean(x)
  )

  // 计算状态和结论
  const experimentsWithStatus = experimentsWithData.map((exp) => {
    const status = computeExperimentStatus(exp, getGuardrails, getBottleneck)
    const conclusion = generateConclusion(exp, getGuardrails, getBottleneck)
    return { ...exp, status, conclusion }
  })

  // 按状态排序：ALERT > WARNING > NORMAL
  const statusPriority: Record<string, number> = { ALERT: 0, WARNING: 1, NORMAL: 2 }
  const sortedExperiments = experimentsWithStatus.sort((a, b) => {
    const pa = statusPriority[a.status?.status || 'NORMAL'] ?? 2
    const pb = statusPriority[b.status?.status || 'NORMAL'] ?? 2
    if (pa !== pb) return pa - pb
    // 次排序：创建时间倒序
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // 总览统计
  const total = sortedExperiments.length
  const alertCount = sortedExperiments.filter((e) => e.status?.status === 'ALERT').length
  const warningCount = sortedExperiments.filter((e) => e.status?.status === 'WARNING').length
  const normalCount = sortedExperiments.filter((e) => e.status?.status === 'NORMAL').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-25 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 border-b border-blue-700 shadow-lg relative overflow-hidden wave-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">搜广推实验控制台</h1>
              <p className="mt-2 text-sm sm:text-base text-blue-100">
                统一查看实验结果、护栏风险、瓶颈诊断与策略建议
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-300 bg-opacity-30 text-white border-blue-200">
                总实验 {total}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500 bg-opacity-80 text-white border-red-400`}
              >
                异常 {alertCount}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-500 bg-opacity-80 text-white border-yellow-400`}
              >
                关注 {warningCount}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-green-500 bg-opacity-80 text-white border-green-400`}
              >
                正常 {normalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Experiments grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedExperiments.map((exp) => (
            <ExperimentSummaryCard
              key={exp.id}
              experiment={exp}
              status={exp.status!.status}
              conclusion={exp.conclusion!}
            />
          ))}
        </div>

        {sortedExperiments.length === 0 && (
          <div className="mt-10 rounded-lg border border-blue-200 bg-white p-6 text-sm text-blue-600">
            当前没有可展示的实验数据（/public/_mock 或 data-loader 返回为空）。
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-blue-200 bg-white bg-opacity-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-xs text-blue-600">AI Recommendation Ads Demo</span>
          <span className="text-xs text-blue-400">Data Source: /public/_mock</span>
        </div>
      </footer>

      {/* Debug Panel */}
      <Suspense fallback={null}>
        <DebugPanel experimentsCount={total} dataSource="/_mock/index.json" />
      </Suspense>
    </div>
  )
}
