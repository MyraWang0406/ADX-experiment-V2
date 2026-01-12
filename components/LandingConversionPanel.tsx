'use client'

import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { formatLift, safeFormatNumber } from '@/lib/utils'

interface LandingConversionPanelProps {
  data: {
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
  }
  narrative: string
}

const issueTagLabels: Record<string, { zh: string; desc: string }> = {
  'slow_load': { zh: '加载慢', desc: '页面加载时间过长，影响用户体验和转化' },
  'low_conversion': { zh: '转化低', desc: '转化率低于平均水平' },
  'high_bounce': { zh: '跳出高', desc: '用户跳出率高，页面吸引力不足' },
}

export default function LandingConversionPanel({ data, narrative }: LandingConversionPanelProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)

  const landingStats = data.landing_stats

  if (!landingStats || !landingStats.top_pages || landingStats.top_pages.length === 0) {
    return (
      <div id="landing-conversion" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">落地页&转化（Landing & Conversion）</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center">
          暂无落地页数据
        </div>
      </div>
    )
  }

  return (
    <div id="landing-conversion" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">落地页&转化（Landing & Conversion）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">
        📊 分析落地页表现，识别转化瓶颈和优化机会。
      </p>

      <div className="space-y-4">
        {landingStats.top_pages.map((page, index) => {
          const currentData = tab === 'baseline' ? page.baseline : tab === 'treatment' ? page.treatment : page.treatment
          const leadRateUplift = formatLift(page.baseline.lead_rate * 100, page.treatment.lead_rate * 100)
          const leadsUplift = formatLift(page.baseline.leads, page.treatment.leads)
          const issueInfo = page.issue_tag ? issueTagLabels[page.issue_tag] : null
          
          return (
            <div 
              key={index}
              className={`border rounded-lg p-4 ${
                page.issue_tag === 'slow_load' ? 'border-red-200 bg-red-50' :
                page.issue_tag === 'low_conversion' ? 'border-orange-200 bg-orange-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{page.title}</h3>
                  <p className="text-xs text-gray-500 truncate">{page.url}</p>
                </div>
                {issueInfo && (
                  <span className={`px-2 py-0.5 rounded text-xs ml-2 ${
                    page.issue_tag === 'slow_load' ? 'bg-red-100 text-red-700' :
                    page.issue_tag === 'low_conversion' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {issueInfo.zh}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">浏览量</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {tab === 'compare' ? (
                      <span>{safeFormatNumber(page.baseline.views)} → {safeFormatNumber(page.treatment.views)}</span>
                    ) : (
                      safeFormatNumber(currentData.views)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">线索数</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {tab === 'compare' ? (
                      <span>{safeFormatNumber(page.baseline.leads)} → {safeFormatNumber(page.treatment.leads)} ({leadsUplift})</span>
                    ) : (
                      safeFormatNumber(currentData.leads)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">转化率</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {tab === 'compare' ? (
                      <span>{(page.baseline.lead_rate * 100).toFixed(2)}% → {(page.treatment.lead_rate * 100).toFixed(2)}% ({leadRateUplift})</span>
                    ) : (
                      `${(currentData.lead_rate * 100).toFixed(2)}%`
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">加载时间</div>
                  <div className={`text-sm font-semibold ${
                    currentData.load_time > 3 ? 'text-red-600' : currentData.load_time > 2 ? 'text-orange-600' : 'text-gray-900'
                  }`}>
                    {currentData.load_time.toFixed(1)}s
                  </div>
                </div>
              </div>
              
              {page.recommended_actions && page.recommended_actions.length > 0 && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">推荐动作：</div>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {page.recommended_actions.map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}



