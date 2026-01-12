/**
 * Mock 数据检查脚本
 * 分析 experiments_adx_v1.json 和 experiments/exp_*.json 的数据结构
 */

import fs from 'fs'
import path from 'path'

interface InspectionResult {
  expId: string
  source: string
  categoryDist: {
    type: 'map' | 'array' | 'missing'
    valueRange: '0-1' | '0-100' | 'unknown'
    sampleValues: number[]
  }
  ocpxTimeseries: {
    exists: boolean
    location: string
    format: '{hours+arrays}' | '[{hour,...}]' | 'unknown'
    sampleStructure: any
  }
  auctionWinRate: {
    exists: boolean
    baseline: number | null
    treatment: number | null
    isZero: boolean
  }
}

function inspectExperiment(expId: string, data: any, source: string): InspectionResult {
  const result: InspectionResult = {
    expId,
    source,
    categoryDist: {
      type: 'missing',
      valueRange: 'unknown',
      sampleValues: [],
    },
    ocpxTimeseries: {
      exists: false,
      location: '',
      format: 'unknown',
      sampleStructure: null,
    },
    auctionWinRate: {
      exists: false,
      baseline: null,
      treatment: null,
      isZero: false,
    },
  }

  // 1. 检查 pipeline.category_dist
  const categoryDist = data?.pipeline?.category_dist
  if (categoryDist) {
    if (Array.isArray(categoryDist)) {
      result.categoryDist.type = 'array'
    } else if (typeof categoryDist === 'object' && categoryDist !== null) {
      result.categoryDist.type = 'map'
      
      // 检查 baseline 和 treatment 的值域
      const baseline = categoryDist.baseline || {}
      const treatment = categoryDist.treatment || {}
      const allValues: number[] = [
        ...Object.values(baseline) as number[],
        ...Object.values(treatment) as number[],
      ].filter(v => typeof v === 'number')
      
      result.categoryDist.sampleValues = allValues.slice(0, 5)
      
      if (allValues.length > 0) {
        const maxValue = Math.max(...allValues)
        if (maxValue <= 1) {
          result.categoryDist.valueRange = '0-1'
        } else if (maxValue <= 100) {
          result.categoryDist.valueRange = '0-100'
        }
      }
    }
  }

  // 2. 检查 ocpx_timeseries
  // 可能在 pipeline.ocpx_timeseries 或 bid.ocpx_timeseries 或 bidding_budget.dsp.ocpx_timeseries
  const ocpxPaths = [
    { path: data?.pipeline?.ocpx_timeseries, location: 'pipeline.ocpx_timeseries' },
    { path: data?.bid?.ocpx_timeseries, location: 'bid.ocpx_timeseries' },
    { path: data?.bidding_budget?.dsp?.ocpx_timeseries, location: 'bidding_budget.dsp.ocpx_timeseries' },
  ]
  
  for (const { path: ocpxData, location } of ocpxPaths) {
    if (ocpxData) {
      result.ocpxTimeseries.exists = true
      result.ocpxTimeseries.location = location
      
      if (Array.isArray(ocpxData)) {
        result.ocpxTimeseries.format = '[{hour,...}]'
        result.ocpxTimeseries.sampleStructure = ocpxData[0] || null
      } else       if (typeof ocpxData === 'object' && ocpxData !== null) {
        // 检查是否是 {hours: [...], baseline: [...], treatment: [...]} 格式
        if (ocpxData.hours && Array.isArray(ocpxData.hours)) {
          result.ocpxTimeseries.format = '{hours+arrays}'
          result.ocpxTimeseries.sampleStructure = {
            hours: ocpxData.hours.slice(0, 3),
            baseline: ocpxData.baseline ? (Array.isArray(ocpxData.baseline) ? ocpxData.baseline.slice(0, 3) : Object.keys(ocpxData.baseline).slice(0, 3)) : null,
            treatment: ocpxData.treatment ? (Array.isArray(ocpxData.treatment) ? ocpxData.treatment.slice(0, 3) : Object.keys(ocpxData.treatment).slice(0, 3)) : null,
          }
        } else {
          result.ocpxTimeseries.format = 'unknown'
          result.ocpxTimeseries.sampleStructure = Object.keys(ocpxData).slice(0, 5)
        }
      }
      break
    }
  }

  // 3. 检查 pipeline.auction.win_rate
  const auction = data?.pipeline?.auction
  if (auction) {
    if (auction.baseline?.win_rate !== undefined) {
      result.auctionWinRate.exists = true
      result.auctionWinRate.baseline = auction.baseline.win_rate
    }
    if (auction.treatment?.win_rate !== undefined) {
      result.auctionWinRate.exists = true
      result.auctionWinRate.treatment = auction.treatment.win_rate
    }
    result.auctionWinRate.isZero = 
      (result.auctionWinRate.baseline === 0 || result.auctionWinRate.baseline === null) &&
      (result.auctionWinRate.treatment === 0 || result.auctionWinRate.treatment === null)
  }

  return result
}

function main() {
  const results: InspectionResult[] = []
  const projectRoot = process.cwd()

  // 1. 读取 experiments_adx_v1.json
  const adxV1Path = path.join(projectRoot, 'public', 'mock', 'mock', 'experiments_adx_v1.json')
  if (fs.existsSync(adxV1Path)) {
    try {
      const adxV1Data = JSON.parse(fs.readFileSync(adxV1Path, 'utf8'))
      if (adxV1Data.experiments && Array.isArray(adxV1Data.experiments)) {
        adxV1Data.experiments.forEach((exp: any) => {
          if (exp.id) {
            results.push(inspectExperiment(exp.id, exp, 'experiments_adx_v1.json'))
          }
        })
      }
    } catch (e) {
      console.error(`Failed to read ${adxV1Path}:`, e)
    }
  }

  // 2. 读取 experiments/exp_001.json ~ exp_003.json
  const expIds = ['exp_001', 'exp_002', 'exp_003']
  const v2BasePath = path.join(projectRoot, 'public', 'mock', 'ai_reco_ads_demo_data_v2', 'experiments')
  
  expIds.forEach(expId => {
    const expPath = path.join(v2BasePath, `${expId}.json`)
    if (fs.existsSync(expPath)) {
      try {
        const expData = JSON.parse(fs.readFileSync(expPath, 'utf8'))
        results.push(inspectExperiment(expId, expData, `experiments/${expId}.json`))
      } catch (e) {
        console.error(`Failed to read ${expPath}:`, e)
      }
    }
  })

  // 3. 输出总结
  console.log('\n=== Mock 数据检查结果 ===\n')
  
  results.forEach(result => {
    console.log(`\n【${result.expId}】来源: ${result.source}`)
    console.log(`  └─ pipeline.category_dist:`)
    console.log(`     - 类型: ${result.categoryDist.type}`)
    console.log(`     - 值域: ${result.categoryDist.valueRange}`)
    if (result.categoryDist.sampleValues.length > 0) {
      console.log(`     - 示例值: ${result.categoryDist.sampleValues.join(', ')}`)
    }
    
    console.log(`  └─ ocpx_timeseries:`)
    if (result.ocpxTimeseries.exists) {
      console.log(`     - 位置: ${result.ocpxTimeseries.location}`)
      console.log(`     - 格式: ${result.ocpxTimeseries.format}`)
      if (result.ocpxTimeseries.sampleStructure) {
        console.log(`     - 示例结构: ${JSON.stringify(result.ocpxTimeseries.sampleStructure, null, 2).split('\n').slice(0, 5).join('\n')}...`)
      }
    } else {
      console.log(`     - 不存在`)
    }
    
    console.log(`  └─ pipeline.auction.win_rate:`)
    if (result.auctionWinRate.exists) {
      console.log(`     - baseline: ${result.auctionWinRate.baseline}`)
      console.log(`     - treatment: ${result.auctionWinRate.treatment}`)
      if (result.auctionWinRate.isZero) {
      console.log(`     - ⚠️  疑似缺失（值为 0）`)
      }
    } else {
      console.log(`     - 不存在`)
    }
  })

  // 4. 汇总统计
  console.log('\n\n=== 汇总统计 ===\n')
  
  const categoryDistTypes = new Set(results.map(r => r.categoryDist.type))
  const categoryDistRanges = new Set(results.map(r => r.categoryDist.valueRange))
  const ocpxExists = results.filter(r => r.ocpxTimeseries.exists).length
  const winRateMissing = results.filter(r => r.auctionWinRate.isZero || !r.auctionWinRate.exists).length
  
  console.log(`总实验数: ${results.length}`)
  console.log(`category_dist 类型: ${Array.from(categoryDistTypes).join(', ')}`)
  console.log(`category_dist 值域: ${Array.from(categoryDistRanges).join(', ')}`)
  console.log(`ocpx_timeseries 存在数: ${ocpxExists}/${results.length}`)
  console.log(`auction.win_rate 缺失/为0: ${winRateMissing}/${results.length}`)
  
  console.log('\n')
}

main()

