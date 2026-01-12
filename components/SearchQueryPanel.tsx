'use client'

import { useState, useMemo } from 'react'
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { formatLift, safeFormatNumber } from '@/lib/utils'

interface SearchQueryPanelProps {
  data: {
    query_stats?: {
      top_queries: Array<{
        query: string
        intent: string
        baseline: {
          impressions: number
          clicks: number
          ctr: number
          lp_views: number
          form_submits?: number
          leads: number
          cvr: number
          revenue: number
          cpa?: number
        }
        treatment: {
          impressions: number
          clicks: number
          ctr: number
          lp_views: number
          form_submits?: number
          leads: number
          cvr: number
          revenue: number
          cpa?: number
        }
        post_click_dwell_time?: number // 点击后停留时间（秒）
        post_click_bounce_rate?: number // 点击后跳出率
        landing_page_type?: '通用内容页' | '清单页' | '活动页' // 当前落地页类型
        recommended_lp?: string // 推荐的落地页类型
        expected_cvr_lift?: number // 预期 CVR 提升（百分比，如 0.15 表示 15%）
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
  }
  narrative: string
}

const issueTagLabels: Record<string, { zh: string; desc: string; actions: string[] }> = {
  'high_ctr_low_cvr': {
    zh: '高点击低转化',
    desc: '点击率高但转化率低，可能是落地页质量或匹配问题',
    actions: ['优化落地页加载速度', '改进落地页转化流程', '调整匹配方式', '增加否词过滤低质流量']
  },
  'high_cvr_low_volume': {
    zh: '高转化低量',
    desc: '转化率高但曝光量低，建议扩量',
    actions: ['词包扩展', '匹配放宽', '出价提升', '预算增加']
  },
  'low_ctr': {
    zh: '点击率低',
    desc: '点击率异常低，可能是创意素材或匹配问题',
    actions: ['优化创意素材', '调整匹配方式', '改出价策略']
  },
  'low_cvr': {
    zh: '转化率低',
    desc: '转化率异常低，可能是落地页质量或流量质量问题',
    actions: ['优化落地页相关性', '调整出价', '加否词']
  },
}

export default function SearchQueryPanel({ data, narrative }: SearchQueryPanelProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)
  const [sortField, setSortField] = useState<'impressions' | 'clicks' | 'ctr' | 'cvr' | 'leads' | 'revenue' | 'cpa' | 'impact'>('impact')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedQueryIndex, setExpandedQueryIndex] = useState<number | null>(null)

  const queryStats = data.query_stats

  if (!queryStats || !queryStats.top_queries || queryStats.top_queries.length === 0) {
    return (
      <div id="query-intent" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query & Intent）</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center">
          暂无搜索词数据
        </div>
      </div>
    )
  }

  // 计算影响度分数
  const calculateImpactScore = (item: typeof queryStats.top_queries[0]): number => {
    const impressions = item.treatment.impressions
    const cvrDiff = item.treatment.cvr - item.baseline.cvr
    // revenue_per_conversion = revenue / leads（安全 fallback）
    const revenuePerConversion = item.treatment.leads > 0 
      ? item.treatment.revenue / item.treatment.leads 
      : (item.baseline.leads > 0 ? item.baseline.revenue / item.baseline.leads : 0)
    
    return impressions * cvrDiff * revenuePerConversion
  }

  // 问题判断：高点击低转化原因诊断
  const diagnoseHighCtrLowCvr = (item: typeof queryStats.top_queries[0]): string | null => {
    const ctr = item.treatment.ctr
    const cvr = item.treatment.cvr
    const dwellTime = item.post_click_dwell_time ?? (item.baseline.leads > 0 ? 6 : 3) // fallback: 有转化默认6s，无转化默认3s
    
    // 高点击：CTR > 3%
    const isHighCtr = ctr > 0.03
    // 低转化：CVR < 1.2%
    const isLowCvr = cvr < 0.012
    
    if (!isHighCtr || !isLowCvr) {
      return null
    }
    
    // 判断原因
    if (dwellTime < 5) {
      return '疑似落地页与搜索意图不匹配'
    } else {
      return '疑似转化路径存在问题'
    }
  }

  // 生成落地页优化建议
  const getLandingPageRecommendation = (item: typeof queryStats.top_queries[0]): { current: string; recommended: string; lift: number } | null => {
    // 优先使用 mock 数据中的字段
    if (item.recommended_lp && item.expected_cvr_lift !== undefined) {
      return {
        current: item.landing_page_type || '通用内容页',
        recommended: item.recommended_lp,
        lift: item.expected_cvr_lift
      }
    }
    
    // Fallback: 根据规则生成建议
    const intent = item.intent
    const currentLpType = item.landing_page_type || '通用内容页'
    
    // 规则：学习类 query + 通用页 → 推荐「结构化清单页」
    if (intent === '学习' && currentLpType === '通用内容页') {
      return {
        current: currentLpType,
        recommended: '结构化清单页',
        lift: 0.15 // 默认预期提升 15%
      }
    }
    
    // 规则：求职类 query + 内容页 → 推荐「转化型活动页」
    if (intent === '求职' && currentLpType === '通用内容页') {
      return {
        current: currentLpType,
        recommended: '转化型活动页',
        lift: 0.20 // 默认预期提升 20%
      }
    }
    
    return null
  }

  // 排序逻辑
  const sortedQueries = useMemo(() => {
    const queries = [...queryStats.top_queries]
    return queries.sort((a, b) => {
      let aVal: number, bVal: number
      const currentView = tab === 'baseline' ? 'baseline' : tab === 'treatment' ? 'treatment' : 'treatment'
      
      switch (sortField) {
        case 'impact':
          aVal = calculateImpactScore(a)
          bVal = calculateImpactScore(b)
          break
        case 'impressions':
          aVal = a[currentView].impressions
          bVal = b[currentView].impressions
          break
        case 'clicks':
          aVal = a[currentView].clicks
          bVal = b[currentView].clicks
          break
        case 'ctr':
          aVal = a[currentView].ctr
          bVal = b[currentView].ctr
          break
        case 'cvr':
          aVal = a[currentView].cvr
          bVal = b[currentView].cvr
          break
        case 'leads':
          aVal = a[currentView].leads
          bVal = b[currentView].leads
          break
        case 'revenue':
          aVal = a[currentView].revenue
          bVal = b[currentView].revenue
          break
        case 'cpa':
          aVal = a[currentView].cpa || 0
          bVal = b[currentView].cpa || 0
          break
        default:
          return 0
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [queryStats.top_queries, sortField, sortDirection, view])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  return (
    <div id="query-intent" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query & Intent）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">
        📊 洞察哪些 query 在拖累/贡献目标，查看 query → 落地页 → 表单/询单 的完整漏斗。
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                搜索词
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                意图
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('impressions')}
              >
                曝光
                {sortField === 'impressions' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('clicks')}
              >
                <Term labelKey="clicks" type="metric">点击</Term>
                {sortField === 'clicks' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ctr')}
              >
                <Term labelKey="ctr" type="metric">CTR(点击率)</Term>
                {sortField === 'ctr' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                落地页浏览量
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                表单/询单
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cvr')}
              >
                <Term labelKey="cvr" type="metric">CVR(转化率)</Term>
                {sortField === 'cvr' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('leads')}
              >
                <Term labelKey="leads" type="metric">Leads(线索)</Term>
                {sortField === 'leads' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cpa')}
              >
                <Term labelKey="cpa" type="metric">CPA(获客成本)</Term>
                {sortField === 'cpa' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('impact')}
              >
                影响度
                {sortField === 'impact' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                问题判断
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                建议动作
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                问题
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                详情
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedQueries.map((item, index) => {
              const ctrUplift = formatLift(item.baseline.ctr * 100, item.treatment.ctr * 100)
              const cvrUplift = formatLift(item.baseline.cvr * 100, item.treatment.cvr * 100)
              const leadsUplift = formatLift(item.baseline.leads, item.treatment.leads)
              
              // 判断问题类型
              const isHighCtrLowCvr = item.treatment.ctr > 0.03 && item.treatment.cvr < 0.01
              const isHighCvrLowVolume = item.treatment.cvr > 0.02 && item.treatment.impressions < 50000
              const issue = item.issue_tag || (isHighCtrLowCvr ? 'high_ctr_low_cvr' : isHighCvrLowVolume ? 'high_cvr_low_volume' : undefined)
              const issueInfo = issue ? issueTagLabels[issue] : null
              
              const currentData = tab === 'baseline' ? item.baseline : tab === 'treatment' ? item.treatment : item.treatment
              
              // 计算转化率
              const lpViewRate = currentData.clicks > 0 ? (currentData.lp_views / currentData.clicks * 100).toFixed(1) : '0.0'
              const formSubmitRate = currentData.lp_views > 0 && currentData.form_submits ? (currentData.form_submits / currentData.lp_views * 100).toFixed(1) : '—'
              
              const impactScore = calculateImpactScore(item)
              const isHighNegativeImpact = impactScore < -1000
              
              return (
                <>
                  <tr 
                    key={index} 
                    className={`hover:bg-gray-50 ${
                      issue === 'high_ctr_low_cvr' ? 'bg-red-50' : 
                      issue === 'high_cvr_low_volume' ? 'bg-orange-50' : 
                      isHighNegativeImpact ? 'bg-red-50' :
                      ''
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.query}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.intent}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tab === 'compare' ? (
                        <span>{safeFormatNumber(item.baseline.impressions)} → {safeFormatNumber(item.treatment.impressions)}</span>
                      ) : (
                        safeFormatNumber(currentData.impressions)
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tab === 'compare' ? (
                        <span>{safeFormatNumber(item.baseline.clicks)} → {safeFormatNumber(item.treatment.clicks)}</span>
                      ) : (
                        safeFormatNumber(currentData.clicks)
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tab === 'compare' ? (
                        <span>{(item.baseline.ctr * 100).toFixed(2)}% → {(item.treatment.ctr * 100).toFixed(2)}% ({ctrUplift})</span>
                      ) : (
                        `${(currentData.ctr * 100).toFixed(2)}%`
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tab === 'compare' ? (
                        <span>{safeFormatNumber(item.baseline.lp_views)} → {safeFormatNumber(item.treatment.lp_views)} ({lpViewRate}%)</span>
                      ) : (
                        <span>{safeFormatNumber(currentData.lp_views)} <span className="text-gray-400 text-xs">({lpViewRate}%)</span></span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tab === 'compare' ? (
                        <span>
                          {currentData.form_submits !== undefined ? (
                            <span>{safeFormatNumber(item.baseline.form_submits || 0)} → {safeFormatNumber(item.treatment.form_submits || 0)} ({formSubmitRate}%)</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </span>
                      ) : (
                        <span>
                          {currentData.form_submits !== undefined ? (
                            <span>{safeFormatNumber(currentData.form_submits)} <span className="text-gray-400 text-xs">({formSubmitRate}%)</span></span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tab === 'compare' ? (
                        <span>{(item.baseline.cvr * 100).toFixed(2)}% → {(item.treatment.cvr * 100).toFixed(2)}% ({cvrUplift})</span>
                      ) : (
                        `${(currentData.cvr * 100).toFixed(2)}%`
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tab === 'compare' ? (
                        <span>{safeFormatNumber(item.baseline.leads)} → {safeFormatNumber(item.treatment.leads)} ({leadsUplift})</span>
                      ) : (
                        safeFormatNumber(currentData.leads)
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {currentData.cpa !== undefined ? (
                        tab === 'compare' ? (
                          <span>¥{item.baseline.cpa?.toFixed(2) || '—'} → ¥{item.treatment.cpa?.toFixed(2) || '—'}</span>
                        ) : (
                          `¥${currentData.cpa.toFixed(2)}`
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm font-semibold ${
                      impactScore < -1000 ? 'text-red-600' : impactScore > 1000 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {safeFormatNumber(impactScore, 0)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {(() => {
                        const diagnosis = diagnoseHighCtrLowCvr(item)
                        if (diagnosis) {
                          return <span className="text-red-600 font-medium text-xs">{diagnosis}</span>
                        }
                        return <span className="text-gray-400 text-xs">—</span>
                      })()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {(() => {
                        const recommendation = getLandingPageRecommendation(item)
                        if (recommendation) {
                          return (
                            <div className="text-xs space-y-0.5">
                              <div className="text-gray-600">{recommendation.current}</div>
                              <div className="text-blue-600 font-medium">→ {recommendation.recommended}</div>
                              <div className="text-green-600">+{(recommendation.lift * 100).toFixed(1)}% CVR</div>
                            </div>
                          )
                        }
                        return <span className="text-gray-400 text-xs">—</span>
                      })()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      {issueInfo ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          issue === 'high_ctr_low_cvr' ? 'bg-red-100 text-red-700' :
                          issue === 'high_cvr_low_volume' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {issueInfo.zh}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setExpandedQueryIndex(expandedQueryIndex === index ? null : index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedQueryIndex === index ? '收起' : '展开'}
                      </button>
                    </td>
                  </tr>
                  {expandedQueryIndex === index && (
                    <tr>
                      <td colSpan={12} className="px-3 py-4 bg-gray-50">
                        <div className="space-y-4">
                          {/* 漏斗视图 */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">漏斗转化</h4>
                            <div className="grid grid-cols-4 gap-4 text-xs">
                              <div className="text-center">
                                <div className="text-gray-500 mb-1">曝光</div>
                                <div className="text-sm font-semibold text-gray-900">{safeFormatNumber(currentData.impressions)}</div>
                                <div className="text-gray-400 mt-1">100%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500 mb-1">点击</div>
                                <div className="text-sm font-semibold text-gray-900">{safeFormatNumber(currentData.clicks)}</div>
                                <div className="text-gray-400 mt-1">{(currentData.ctr * 100).toFixed(2)}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500 mb-1">落地页浏览</div>
                                <div className="text-sm font-semibold text-gray-900">{safeFormatNumber(currentData.lp_views)}</div>
                                <div className="text-gray-400 mt-1">{lpViewRate}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-gray-500 mb-1">线索</div>
                                <div className="text-sm font-semibold text-gray-900">{safeFormatNumber(currentData.leads)}</div>
                                <div className="text-gray-400 mt-1">{(currentData.cvr * 100).toFixed(2)}%</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 落地页列表 */}
                          {item.landing_pages && item.landing_pages.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">落地页列表</h4>
                              <div className="space-y-2">
                                {item.landing_pages.map((lp, lpIndex) => (
                                  <div key={lpIndex} className="border border-gray-200 rounded p-2 text-xs">
                                    <div className="font-medium text-gray-900">{lp.title}</div>
                                    <div className="text-gray-500 truncate">{lp.url}</div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span>浏览量: {safeFormatNumber(lp.views)}</span>
                                      {lp.form_submits !== undefined && (
                                        <span>表单提交: {safeFormatNumber(lp.form_submits)}</span>
                                      )}
                                      <span>转化率: {(lp.lead_rate * 100).toFixed(2)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* 推荐动作 */}
                          {item.recommended_actions && item.recommended_actions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">推荐动作</h4>
                              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                {item.recommended_actions.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
