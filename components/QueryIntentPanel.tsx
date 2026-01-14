'use client'

interface QueryIntentPanelProps {
  data: {
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
  }
  narrative: string
}

export default function QueryIntentPanel({ data, narrative }: QueryIntentPanelProps) {
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)
  const queryIntent = data.query_intent

  if (!queryIntent || (!queryIntent.top_queries && !queryIntent.intent_mix)) {
    return (
      <div id="query-intent" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query & Intent）</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-2">数据缺失</p>
          <p className="text-xs">需要以下字段：</p>
          <ul className="text-xs list-disc list-inside mt-1">
            <li>pipeline.query_intent.top_queries[] (query, intent, impressions, ctr, cvr, cost, revenue)</li>
            <li>pipeline.query_intent.intent_mix[] (intent, share, ctr, cvr)</li>
          </ul>
        </div>
      </div>
    )
  }

  const topQueries = queryIntent.top_queries || []
  const intentMix = queryIntent.intent_mix || []

  return (
    <div id="query-intent" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">搜索词&意图（Query & Intent）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Queries 表格 */}
        {topQueries.length > 0 && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Top 搜索词（前10条）</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-2 font-semibold text-gray-700">排名</th>
                    <th className="text-left p-2 font-semibold text-gray-700">搜索词</th>
                    <th className="text-left p-2 font-semibold text-gray-700">意图</th>
                    <th className="text-right p-2 font-semibold text-gray-700">曝光</th>
                    <th className="text-right p-2 font-semibold text-gray-700">点击率（CTR）</th>
                    <th className="text-right p-2 font-semibold text-gray-700">转化率（CVR）</th>
                    <th className="text-right p-2 font-semibold text-gray-700">成本</th>
                    <th className="text-right p-2 font-semibold text-gray-700">收入</th>
                  </tr>
                </thead>
                <tbody>
                  {topQueries.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 text-gray-600">{index + 1}</td>
                      <td className="p-2 text-gray-900 font-medium">{item.query}</td>
                      <td className="p-2 text-gray-700">{item.intent}</td>
                      <td className="p-2 text-right text-gray-700">{item.impressions.toLocaleString()}</td>
                      <td className="p-2 text-right text-gray-700">{(item.ctr * 100).toFixed(2)}%</td>
                      <td className="p-2 text-right text-gray-700">{(item.cvr * 100).toFixed(2)}%</td>
                      <td className="p-2 text-right text-gray-700">{item.cost.toFixed(2)}</td>
                      <td className="p-2 text-right text-gray-700 font-semibold">{item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Intent Mix 列表 */}
        {intentMix.length > 0 && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">意图分布（Intent Mix）</h3>
            <div className="space-y-3">
              {intentMix.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">{item.intent}</span>
                    <span className="text-sm text-gray-600">占比: {(item.share * 100).toFixed(1)}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>点击率（CTR）: <span className="font-medium text-gray-900">{(item.ctr * 100).toFixed(2)}%</span></div>
                    <div>转化率（CVR）: <span className="font-medium text-gray-900">{(item.cvr * 100).toFixed(2)}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}









