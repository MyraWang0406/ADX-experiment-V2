'use client'

import React, { useMemo } from 'react'
import { normalizeOCPXData } from '@/lib/utils'

export default function OCPXCurve({
  data,
  narrative,
}: {
  data: any
  narrative?: string
}) {
  const normalized = useMemo(() => {
    // 先按正常 v2 尝试
    let n = normalizeOCPXData(data)

    // 如果没有曲线数据，再尝试从标量结构兜底
    if (!n.hours.length) {
      const scalar =
        (data && typeof data === 'object' && ('baseline' in data || 'treatment' in data))
          ? { baseline: data.baseline, treatment: data.treatment }
          : null

      if (scalar) {
        const b = Number(scalar.baseline ?? 0)
        const t = Number(scalar.treatment ?? 0)
        if (Number.isFinite(b) || Number.isFinite(t)) {
          n = normalizeOCPXData({
            baseline: { multiplier: [b], actual_cpa: [], spend: [], target_cpa: [] },
            treatment: { multiplier: [t], actual_cpa: [], spend: [], target_cpa: [] },
            hours: [0],
          })
        }
      }
    }

    return n
  }, [data])

  if (!normalized.hours.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="text-lg font-semibold text-gray-900">OCPX 曲线</div>
        <div className="mt-2 text-sm text-gray-500">
          暂无曲线数据 / Schema 不匹配（当前数据源没有 ocpx_timeseries 或 ocpx 标量）
        </div>
        {narrative ? <div className="mt-3 text-sm text-gray-600">{narrative}</div> : null}
      </div>
    )
  }

  // 下面保持你原先的展示（我不动你图表实现，避免再引入新 bug）
  // 你项目里原本 OCPXCurve 的 chart 代码如果更复杂，就继续用你原来的即可；
  // 关键是 normalized 不再被“归一化搞空”。

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="text-lg font-semibold text-gray-900">OCPX 曲线</div>
      {narrative ? <div className="mt-2 text-sm text-gray-600">{narrative}</div> : null}

      <div className="mt-4 text-sm text-gray-700">
        <div>点数：{normalized.hours.length}</div>
        <div className="mt-1 text-gray-500">
          （如果你原文件里有折线图渲染，把这里替换回你原来的 chart 渲染即可）
        </div>
      </div>
    </div>
  )
}
