'use client'

import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { safePercentChange, formatPercentChange } from '@/lib/utils'

interface SupplyPanelProps {
  data: {
    inventory?: {
      baseline: number
      treatment: number
    }
    freq_cap?: {
      baseline: number
      treatment: number
    }
    geo_distribution?: Record<string, number>
    time_distribution?: Record<string, number>
  }
  narrative: string
}

export default function SupplyPanel({ data, narrative }: SupplyPanelProps) {
  const { tab } = useExperimentDetail()
  const view = tab // 兼容旧代码，实际使用 tab
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)

  if (!data || (!data.inventory && !data.freq_cap && !data.geo_distribution && !data.time_distribution)) {
    return (
      <div id="supply" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">流量&供给（Supply）</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-2">数据缺失</p>
          <p className="text-xs">需要以下字段：</p>
          <ul className="text-xs list-disc list-inside mt-1">
            <li>pipeline.supply.inventory (baseline/treatment)</li>
            <li>pipeline.supply.freq_cap (baseline/treatment)</li>
            <li>pipeline.supply.geo_distribution (可选)</li>
            <li>pipeline.supply.time_distribution (可选)</li>
          </ul>
        </div>
      </div>
    )
  }

  const inventoryBaseline = data.inventory?.baseline || 0
  const inventoryTreatment = data.inventory?.treatment || 0
  const inventoryChange = safePercentChange(inventoryBaseline, inventoryTreatment)
  
  const freqCapBaseline = data.freq_cap?.baseline || 0
  const freqCapTreatment = data.freq_cap?.treatment || 0
  const freqCapChange = safePercentChange(freqCapBaseline, freqCapTreatment)

  return (
    <div id="supply" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">流量&供给（Supply）</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 库存 */}
        {data.inventory && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-base font-semibold text-gray-800 mb-3">库存（Inventory）</h3>
            <div className="space-y-2">
              {(tab === 'compare' || tab === 'baseline') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">基线</div>
                  <div className="text-xl font-bold text-blue-400">{inventoryBaseline.toLocaleString()}</div>
                </div>
              )}
              {(tab === 'compare' || tab === 'treatment') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">实验组</div>
                  <div className="text-xl font-bold text-blue-800">{inventoryTreatment.toLocaleString()}</div>
                </div>
              )}
              <div className="pt-2 border-t border-blue-200">
                <div className="text-xs text-gray-600 mb-1">变化</div>
                <div className={`text-lg font-bold ${inventoryChange !== null && inventoryChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {inventoryChange !== null ? formatPercentChange(inventoryChange) : '--'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 频控 */}
        {data.freq_cap && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-base font-semibold text-gray-800 mb-3">频控（Frequency Cap）</h3>
            <div className="space-y-2">
              {(tab === 'compare' || tab === 'baseline') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">基线</div>
                  <div className="text-xl font-bold text-blue-400">{freqCapBaseline.toLocaleString()}</div>
                </div>
              )}
              {(tab === 'compare' || tab === 'treatment') && (
                <div>
                  <div className="text-xs text-gray-600 mb-1">实验组</div>
                  <div className="text-xl font-bold text-blue-800">{freqCapTreatment.toLocaleString()}</div>
                </div>
              )}
              <div className="pt-2 border-t border-blue-200">
                <div className="text-xs text-gray-600 mb-1">变化</div>
                <div className={`text-lg font-bold ${freqCapChange !== null && freqCapChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {freqCapChange !== null ? formatPercentChange(freqCapChange) : '--'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 地域分布 */}
        {data.geo_distribution && Object.keys(data.geo_distribution).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-3">地域分布</h3>
            <div className="space-y-2">
              {Object.entries(data.geo_distribution).slice(0, 5).map(([geo, share]) => (
                <div key={geo} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{geo}</span>
                  <span className="text-sm font-semibold text-gray-900">{(share * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 时段分布 */}
        {data.time_distribution && Object.keys(data.time_distribution).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-800 mb-3">时段分布</h3>
            <div className="space-y-2">
              {Object.entries(data.time_distribution).slice(0, 5).map(([time, share]) => (
                <div key={time} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{time}</span>
                  <span className="text-sm font-semibold text-gray-900">{(share * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



