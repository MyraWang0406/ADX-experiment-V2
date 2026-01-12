'use client'

import { useState, useMemo } from 'react'
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { formatNumber } from '@/lib/utils'

interface QueryPanelProps {
  data: {
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
  }
  narrative: string
}

type SortField = 'clicks' | 'ctr' | 'cvr' | 'leads'

const issueTagLabels: Record<string, string> = {
  '高点低转': '高点击率但转化率低',
  '低展低点': '曝光量低且点击率低',
  'CTR异常': '点击率异常低',
  'CVR异常': '转化率异常低',
}

export default function QueryPanel({ data, narrative }: QueryPanelProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)
  const [sortField, setSortField] = useState<SortField>('clicks')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null)

  const queryReport = data.query_report

  if (!queryReport || !queryReport.top_queries || queryReport.top_queries.length === 0) {
    return (
      <div id="query-report" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query）</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-2">暂无搜索词数据</p>
          <p className="text-xs">请检查 `pipeline.query_report` 字段是否包含数据。</p>
        </div>
      </div>
    )
  }

  // 排序逻辑
  const sortedQueries = useMemo(() => {
    const queries = [...queryReport.top_queries]
    return queries.sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortField) {
        case 'clicks':
          aVal = a.clicks
          bVal = b.clicks
          break
        case 'ctr':
          aVal = a.ctr
          bVal = b.ctr
          break
        case 'cvr':
          aVal = a.cvr
          bVal = b.cvr
          break
        case 'leads':
          aVal = a.leads
          bVal = b.leads
          break
        default:
          return 0
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [queryReport.top_queries, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getIssueCards = () => {
    if (!queryReport.examples_by_issue || queryReport.examples_by_issue.length === 0) {
      return null
    }
    return queryReport.examples_by_issue.map((issue) => (
      <div key={issue.issue_tag} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">{issue.issue_tag}</h4>
          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-200 rounded">
            {issueTagLabels[issue.issue_tag] || issue.issue_tag}
          </span>
        </div>
        <p className="text-xs text-gray-600 mb-3">{issue.description}</p>
        <div className="space-y-1 mb-3">
          {issue.example_queries.slice(0, 2).map((ex, idx) => (
            <div key={idx} className="text-xs text-gray-700">
              <span className="font-medium">"{ex.query}"</span>
              <span className="text-gray-500 ml-1">- {ex.reason}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-2">
          <div className="text-xs font-medium text-gray-700 mb-1">建议动作：</div>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {issue.recommended_actions.map((action, idx) => (
              <li key={idx}>• {action}</li>
            ))}
          </ul>
        </div>
      </div>
    ))
  }

  return (
    <div id="query-report" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">
        📊 洞察哪些 query 在拖累/贡献目标，快速定位问题并给出优化建议。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：Query 漏斗表格 */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Query 漏斗表格</h3>
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
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Term labelKey="impressions" type="metric">曝光</Term>
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
                      <Term labelKey="ctr" type="metric">CTR</Term>
                      {sortField === 'ctr' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('cvr')}
                    >
                      <Term labelKey="cvr" type="metric">CVR</Term>
                      {sortField === 'cvr' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('leads')}
                    >
                      <Term labelKey="leads" type="metric">Leads</Term>
                      {sortField === 'leads' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      问题
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedQueries.map((item, index) => (
                    <>
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.query}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.intent_label}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatNumber(item.impressions)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{formatNumber(item.clicks)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{(item.ctr * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{(item.cvr * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{item.leads}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {item.issue_tag ? (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                              {item.issue_tag}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setExpandedQuery(expandedQuery === item.query ? null : item.query)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            {expandedQuery === item.query ? '收起' : '展开'}
                          </button>
                        </td>
                      </tr>
                      {expandedQuery === item.query && (
                        <tr>
                          <td colSpan={9} className="px-3 py-4 bg-gray-50">
                            <div className="space-y-4">
                              {/* 落地页列表 */}
                              {item.landing_pages && item.landing_pages.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-2">落地页列表</h5>
                                  <div className="space-y-2">
                                    {item.landing_pages.map((lp, lpIdx) => (
                                      <div key={lpIdx} className="bg-white border border-gray-200 rounded p-2 text-xs">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-gray-900">{lp.title}</span>
                                          <span className="text-gray-500">加载时间: {lp.load_time}s</span>
                                        </div>
                                        <div className="text-gray-600">
                                          <Term labelKey="lead_rate" type="metric">转化率</Term>: {(lp.lead_rate * 100).toFixed(2)}%
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* 推荐动作 */}
                              {item.recommended_actions && item.recommended_actions.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-2">推荐动作</h5>
                                  <ul className="space-y-1 text-xs text-gray-600">
                                    {item.recommended_actions.map((action, actionIdx) => (
                                      <li key={actionIdx} className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 右侧：问题雷达 */}
        <div className="lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">问题雷达</h3>
          <div className="space-y-3">
            {getIssueCards() || (
              <div className="text-sm text-gray-500 text-center py-4">暂无问题数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



