'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'
import Term from '@/components/Term'
import { normalizeOCPXData } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'
import { ensureArray } from '@/lib/utils-safe'

interface OCPXCurveProps {
  data: any // 接受原始数据，在组件内 normalize（兼容 v2 + ADX v1）
  narrative: string
}

export default function OCPXCurve({ data, narrative }: OCPXCurveProps) {
  const { tab, view } = useExperimentDetail()
  const narrativeFirstLine = narrative.split('。')[0] || narrative.substring(0, 50)

  // 【强容错】先检查原始数据
  if (!data || (typeof data !== 'object')) {
    return (
      <div id="ocpx" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">OCPX 曲线</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <EmptyState title="暂无曲线数据" message="数据格式不符合预期，无法渲染曲线图" />
      </div>
    )
  }

  // Normalize 数据（兼容 v2 曲线 + ADX v1 标量/分视角）
  // - v2：传入的是 ocpx_timeseries（baseline/treatment 为数组或对象）
  // - v1：可能只有标量 baseline/treatment（比如 bidding_budget.dsp.ocpx）
  // - v1：也可能把 ocpx 包在 dsp/ssp/adx 下，需要根据当前 view 取
  let normalized
  try {
    // 先把输入“捞”成 normalizeOCPXData 能识别的结构
    let input: any = data

    if (input && typeof input === 'object') {
      // 1) 如果是 { ocpx_timeseries: ... } 或 { ocpx: ... } 的包装
      if ((input as any).ocpx_timeseries) input = (input as any).ocpx_timeseries
      else if ((input as any).ocpx) input = (input as any).ocpx

      // 2) 如果是 ADX v1 bidding_budget：{ dsp:{ocpx:{...}}, ssp:{...}, adx:{...} }
      //    根据 view 取；All 则优先 dsp，其次 ssp/adx
      else if ((input as any).dsp || (input as any).ssp || (input as any).adx) {
        const v = String(view || '').toUpperCase()
        const pick = (o: any) => (o && typeof o === 'object' ? (o.ocpx ?? o) : null)

        if (v === 'DSP') input = pick((input as any).dsp)
        else if (v === 'SSP') input = pick((input as any).ssp)
        else if (v === 'ADX') input = pick((input as any).adx)
        else input = pick((input as any).dsp) || pick((input as any).ssp) || pick((input as any).adx) || input
      }
    }

    // 3) v1 标量兜底：{ baseline: 1.02, treatment: 1.05 }
    if (input && typeof input === 'object') {
      const b = (input as any).baseline
      const t = (input as any).treatment
      const isScalar =
        (typeof b === 'number' || (typeof b === 'string' && b.trim() !== '')) &&
        (typeof t === 'number' || (typeof t === 'string' && t.trim() !== ''))

      if (isScalar && !Array.isArray(b) && !Array.isArray(t) && typeof b !== 'object' && typeof t !== 'object') {
        const bn = Number(b)
        const tn = Number(t)
        if (Number.isFinite(bn) || Number.isFinite(tn)) {
          input = { baseline: [bn], treatment: [tn], hours: [0] }
        }
      }
    }

    normalized = normalizeOCPXData(input)
  } catch (e) {
    console.warn('OCPX data normalization failed:', e)
    normalized = { baseline: [], treatment: [] }
  }

  // 【强容错】确保 baseline 和 treatment 都是数组
  const baseline = ensureArray(normalized?.baseline, ensureArray((data as any)?.baseline))
  const treatment = ensureArray(normalized?.treatment, ensureArray((data as any)?.treatment))

  // 确保至少有一个数据点
  if (baseline.length === 0 && treatment.length === 0) {
    return (
      <div id="ocpx" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">OCPX 曲线</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
        <EmptyState title="暂无曲线数据 / Schema不匹配" message="数据格式不符合预期，无法渲染曲线图" />
      </div>
    )
  }

  // 生成图表数据
  const maxLength = Math.max(baseline.length, treatment.length, 1) // 至少1个点
  const chartData = Array.from({ length: maxLength }, (_, index) => ({
    hour: baseline[index]?.hour ?? treatment[index]?.hour ?? index,
    baseline_multiplier: baseline[index]?.multiplier ?? (baseline.length > 0 ? 1 : 0),
    treatment_multiplier: treatment[index]?.multiplier ?? (treatment.length > 0 ? 1 : 0),
    baseline_actual_cpa: baseline[index]?.actual_cpa ?? 0,
    treatment_actual_cpa: treatment[index]?.actual_cpa ?? 0,
    baseline_spend: baseline[index]?.spend ?? 0,
    treatment_spend: treatment[index]?.spend ?? 0,
  }))

  // 计算稳定性（仅在数据存在时）
  let diffSummary = '数据不足'
  if (baseline.length > 0 && treatment.length > 0 && Array.isArray(baseline) && Array.isArray(treatment)) {
    const baselineMultipliers = baseline.map((d: any) => d?.multiplier).filter((v: any) => isFinite(v))
    const treatmentMultipliers = treatment.map((d: any) => d?.multiplier).filter((v: any) => isFinite(v))

    if (baselineMultipliers.length > 0 && treatmentMultipliers.length > 0) {
      const baselineMean = baselineMultipliers.reduce((a, b) => a + b, 0) / baselineMultipliers.length
      const treatmentMean = treatmentMultipliers.reduce((a, b) => a + b, 0) / treatmentMultipliers.length
      const baselineStd = Math.sqrt(baselineMultipliers.reduce((sum, val) => sum + Math.pow(val - baselineMean, 2), 0) / baselineMultipliers.length)
      const treatmentStd = Math.sqrt(treatmentMultipliers.reduce((sum, val) => sum + Math.pow(val - treatmentMean, 2), 0) / treatmentMultipliers.length)

      // 计算 CPA 偏离
      const baselineCpaMean = baseline.reduce((sum: number, d: any) => sum + (d?.actual_cpa || 0), 0) / baseline.length
      const treatmentCpaMean = treatment.reduce((sum: number, d: any) => sum + (d?.actual_cpa || 0), 0) / treatment.length
      const targetCpa = baseline[0]?.target_cpa || treatment[0]?.target_cpa || 0
      const baselineCpaDev = targetCpa > 0 ? Math.abs(baselineCpaMean - targetCpa) : 0
      const treatmentCpaDev = targetCpa > 0 ? Math.abs(treatmentCpaMean - targetCpa) : 0

      diffSummary = `倍率波动: ${baselineStd.toFixed(3)} → ${treatmentStd.toFixed(3)}；CPA偏离: ${baselineCpaDev.toFixed(2)} → ${treatmentCpaDev.toFixed(2)}`
    }
  }

  // 计算各图表的 Y 轴 domain
  const multiplierValues = chartData.flatMap(d => [d.baseline_multiplier, d.treatment_multiplier]).filter(v => isFinite(v) && v > 0)
  const multiplierMin = multiplierValues.length > 0 ? Math.min(...multiplierValues) : 0.9
  const multiplierMax = multiplierValues.length > 0 ? Math.max(...multiplierValues) : 1.1
  const multiplierDomain = [Math.max(0.8, multiplierMin * 0.95), multiplierMax * 1.05]

  const cpaValues = chartData.flatMap(d => [d.baseline_actual_cpa, d.treatment_actual_cpa]).filter(v => isFinite(v) && v > 0)
  const cpaMin = cpaValues.length > 0 ? Math.min(...cpaValues) : 0
  const cpaMax = cpaValues.length > 0 ? Math.max(...cpaValues) : 10
  const cpaDomain = [Math.max(0, cpaMin * 0.95), cpaMax * 1.05]

  const spendValues = chartData.flatMap(d => [d.baseline_spend, d.treatment_spend]).filter(v => isFinite(v) && v >= 0)
  const spendMin = spendValues.length > 0 ? Math.min(...spendValues) : 0
  const spendMax = spendValues.length > 0 ? Math.max(...spendValues) : 1000
  const spendDomain = [Math.max(0, spendMin * 0.95), spendMax * 1.05]

  // 自定义 Tooltip 组件
  const createCustomTooltip = (baselineKey: string, treatmentKey: string, unit: string = '') => {
    return ({ active, payload }: any) => {
      if (active && payload && payload.length > 0) {
        const data = payload[0].payload
        const baselineVal = data[baselineKey]
        const treatmentVal = data[treatmentKey]
        const delta = treatmentVal - baselineVal
        const deltaPercent = baselineVal > 0 ? ((delta / baselineVal) * 100).toFixed(1) : '0.0'

        return (
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
            <p className="font-semibold text-gray-800 mb-2">时间: {data.hour} 时</p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-gray-600">基线:</span>
                <span className="font-semibold text-blue-600">{baselineVal.toFixed(2)}{unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-800 border-2 border-blue-800" style={{ background: 'transparent' }}></div>
                <span className="text-gray-600">实验组:</span>
                <span className="font-semibold text-blue-800">{treatmentVal.toFixed(2)}{unit}</span>
              </div>
              <div className="pt-1 border-t border-gray-200 mt-1">
                <span className="text-gray-600">差值:</span>
                <span className={`font-bold ml-2 ${delta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}{unit} ({delta >= 0 ? '+' : ''}{deltaPercent}%)
                </span>
              </div>
            </div>
          </div>
        )
      }
      return null
    }
  }

  return (
    <div id="ocpx" className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">OCPX 曲线</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-2">{narrativeFirstLine}</p>
      <p className="text-xs sm:text-sm text-blue-600 mb-4 sm:mb-6 font-medium">📊 差异摘要：{diffSummary}</p>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-1">
            <Term labelKey="multiplier" type="metric">倍率（Multiplier）</Term>
          </h3>
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
            <LineChart data={chartData} margin={{ top: 50, right: 30, left: 50, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                label={{ value: '时间（小时）', position: 'insideBottom', offset: -10 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: '倍率', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                tick={{ fontSize: 12 }}
                domain={multiplierDomain}
              />
              <Tooltip content={createCustomTooltip('baseline_multiplier', 'treatment_multiplier')} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', paddingBottom: '10px' }}
                iconType="line"
                verticalAlign="top"
              />
              {(tab === 'compare' || tab === 'baseline') && (
                <Line
                  type="monotone"
                  dataKey="baseline_multiplier"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  name="基线倍率"
                  dot={{ fill: '#60a5fa', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              )}
              {(tab === 'compare' || tab === 'treatment') && (
                <Line
                  type="monotone"
                  dataKey="treatment_multiplier"
                  stroke="#1e40af"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  name="实验组倍率"
                  dot={{ fill: '#1e40af', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-1">
            <Term labelKey="cpa" type="metric">实际 CPA（Cost Per Action）</Term>
          </h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" label={{ value: '小时', position: 'insideBottom', offset: -5 }} />
              <YAxis
                label={{ value: 'CPA', angle: -90, position: 'insideLeft' }}
                domain={cpaDomain}
              />
              <Tooltip content={createCustomTooltip('baseline_actual_cpa', 'treatment_actual_cpa')} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {(tab === 'compare' || tab === 'baseline') && (
                <Line
                  type="monotone"
                  dataKey="baseline_actual_cpa"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  name="基线 CPA"
                  dot={{ fill: '#60a5fa', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              )}
              {(tab === 'compare' || tab === 'treatment') && (
                <Line
                  type="monotone"
                  dataKey="treatment_actual_cpa"
                  stroke="#1e40af"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  name="实验组 CPA"
                  dot={{ fill: '#1e40af', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-1">
            消耗（Spend）
          </h3>
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" label={{ value: '小时', position: 'insideBottom', offset: -5 }} />
              <YAxis
                label={{ value: '消耗', angle: -90, position: 'insideLeft' }}
                domain={spendDomain}
              />
              <Tooltip content={createCustomTooltip('baseline_spend', 'treatment_spend')} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {(tab === 'compare' || tab === 'baseline') && (
                <Line
                  type="monotone"
                  dataKey="baseline_spend"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  name="基线消耗"
                  dot={{ fill: '#60a5fa', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              )}
              {(tab === 'compare' || tab === 'treatment') && (
                <Line
                  type="monotone"
                  dataKey="treatment_spend"
                  stroke="#1e40af"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  name="实验组消耗"
                  dot={{ fill: '#1e40af', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
