'use client'

import { useEffect } from 'react'

interface DebugFingerprintProps {
  expId: string
  pipeline?: any
}

/**
 * 极简 debug 组件：在浏览器 console 打印版本指纹
 * 只在 development 环境输出
 */
export default function DebugFingerprint({ expId, pipeline }: DebugFingerprintProps) {
  useEffect(() => {
    // 只在 development 环境输出
    if (process.env.NODE_ENV !== 'development') {
      return
    }
    
    // 三个核心布尔值
    const hasOcpxHours = !!(pipeline?.ocpx_timeseries?.hours)
    const hasOcpxBaselineArray = Array.isArray(pipeline?.ocpx_timeseries?.baseline)
    
    // category_dist.baseline 的 max 值
    const categoryDistMax = (() => {
      const baseline = pipeline?.category_dist?.baseline
      if (!baseline || typeof baseline !== 'object') return null
      const values = Object.values(baseline).filter(v => typeof v === 'number') as number[]
      return values.length > 0 ? Math.max(...values) : null
    })()
    
    // 在浏览器 console 打印
    console.log(`[${expId}] Browser Console - Version Fingerprint:`)
    console.log(`[${expId}] a) !!pipeline.ocpx_timeseries?.hours = ${hasOcpxHours}`)
    console.log(`[${expId}] b) Array.isArray(pipeline.ocpx_timeseries?.baseline) = ${hasOcpxBaselineArray}`)
    console.log(`[${expId}] c) category_dist.baseline max = ${categoryDistMax}`)
  }, [expId, pipeline])
  
  // 不渲染任何内容
  return null
}






