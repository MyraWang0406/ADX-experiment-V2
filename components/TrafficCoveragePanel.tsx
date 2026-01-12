'use client'

import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { formatLift, safeFormatNumber } from '@/lib/utils'

interface TrafficCoveragePanelProps {
  data: {
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
  }
  narrative: string
}

export default function TrafficCoveragePanel({ data, narrative }: TrafficCoveragePanelProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)

  const coverage = data.coverage_breakdown

  if (!coverage) {
    return (
      <div id="traffic-coverage" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">流量覆盖（Traffic / Coverage）</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center">
          暂无流量覆盖数据
        </div>
      </div>
    )
  }

  const totalUplift = formatLift(coverage.baseline.total_impressions, coverage.treatment.total_impressions)
  const currentData = tab === 'baseline' ? coverage.baseline : tab === 'treatment' ? coverage.treatment : coverage.treatment

  return (
    <div id="traffic-coverage" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">流量覆盖（Traffic / Coverage）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">
        📊 分析流量分布，识别覆盖机会和优化方向。
      </p>

      <div className="space-y-6">
        {/* 总曝光 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3">总曝光</h3>
          <div className="text-2xl font-bold text-gray-900">
            {tab === 'compare' ? (
              <span>
                {safeFormatNumber(coverage.baseline.total_impressions)} → {safeFormatNumber(coverage.treatment.total_impressions)} ({totalUplift})
              </span>
            ) : (
              safeFormatNumber(currentData.total_impressions)
            )}
          </div>
        </div>

        {/* 按意图分布 */}
        {currentData.by_intent && Object.keys(currentData.by_intent).length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">按意图分布</h3>
            <div className="space-y-2">
              {Object.entries(currentData.by_intent).map(([intent, count]) => {
                const baselineCount = coverage.baseline.by_intent[intent] || 0
                const treatmentCount = coverage.treatment.by_intent[intent] || 0
                const uplift = formatLift(baselineCount, treatmentCount)
                
                return (
                  <div key={intent} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{intent}</span>
                    <div className="flex items-center gap-2">
                      {tab === 'compare' ? (
                        <span className="text-sm text-gray-900">
                          {safeFormatNumber(baselineCount)} → {safeFormatNumber(treatmentCount)} ({uplift})
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">{safeFormatNumber(count)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 按设备分布 */}
        {currentData.by_device && Object.keys(currentData.by_device).length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">按设备分布</h3>
            <div className="space-y-2">
              {Object.entries(currentData.by_device).map(([device, count]) => {
                const baselineCount = coverage.baseline.by_device[device] || 0
                const treatmentCount = coverage.treatment.by_device[device] || 0
                const uplift = formatLift(baselineCount, treatmentCount)
                
                return (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{device}</span>
                    <div className="flex items-center gap-2">
                      {tab === 'compare' ? (
                        <span className="text-sm text-gray-900">
                          {safeFormatNumber(baselineCount)} → {safeFormatNumber(treatmentCount)} ({uplift})
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">{safeFormatNumber(count)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 按地域分布 */}
        {currentData.by_geo && Object.keys(currentData.by_geo).length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">按地域分布</h3>
            <div className="space-y-2">
              {Object.entries(currentData.by_geo).slice(0, 10).map(([geo, count]) => {
                const baselineCount = coverage.baseline.by_geo[geo] || 0
                const treatmentCount = coverage.treatment.by_geo[geo] || 0
                const uplift = formatLift(baselineCount, treatmentCount)
                
                return (
                  <div key={geo} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{geo}</span>
                    <div className="flex items-center gap-2">
                      {tab === 'compare' ? (
                        <span className="text-sm text-gray-900">
                          {safeFormatNumber(baselineCount)} → {safeFormatNumber(treatmentCount)} ({uplift})
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900">{safeFormatNumber(count)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



