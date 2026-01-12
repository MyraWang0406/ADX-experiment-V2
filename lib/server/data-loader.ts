import 'server-only'
import fs from 'fs'
import path from 'path'
import type { ExperimentDataV2, ExperimentSummary, ExperimentData } from '@/lib/data-loader'
import { normalizeExperimentData } from './normalize-experiment'
import { normalizeExperimentDetail } from '@/lib/normalizeExperimentDetail'

/**
 * 把各种可能的 expId 统一成文件名使用的 id：
 * - "exp_001" -> "001"
 * - "001" -> "001"
 * - "1" -> "001"
 */
function normalizeExpId(expId: string): string {
  let s = String(expId || '').trim()
  s = s.replace(/^exp_/, '')
  if (/^\d+$/.test(s)) s = s.padStart(3, '0')
  return s
}

// --- ADX v1 helper ---
function getAdxV1FilePaths(): string[] {
  return [
    // 新标准路径
    path.join(process.cwd(), 'public', '_mock', 'experiments_adx_v1.json'),
    // 兼容历史错误路径（有人写成 public/mock/mock）
    path.join(process.cwd(), 'public', 'mock', 'mock', 'experiments_adx_v1.json'),
    // 兼容另一种常见目录
    path.join(process.cwd(), 'public', 'mock', 'experiments_adx_v1.json'),
  ]
}

function loadAdxV1RawExperiment(expId: string): any | null {
  try {
    const norm = normalizeExpId(expId)
    const targets = new Set([
      String(expId),
      norm,
      `exp_${norm}`,
    ])

    const paths = getAdxV1FilePaths()
    for (const p of paths) {
      if (!fs.existsSync(p)) continue
      const txt = fs.readFileSync(p, 'utf-8')
      const json = JSON.parse(txt)
      const list: any[] = Array.isArray(json?.experiments) ? json.experiments : []

      const found = list.find((x) => {
        const idStr = String(x?.id ?? x?.experiment_id ?? '').trim()
        if (!idStr) return false
        if (targets.has(idStr)) return true
        // 再兜底：去掉前缀后比一遍
        const stripped = idStr.replace(/^exp_/, '')
        return stripped === norm
      })

      if (found) return found
    }
    return null
  } catch (e) {
    console.warn('[loadAdxV1RawExperiment] failed:', e)
    return null
  }
}

// 读取 experiments list：优先从 public/_mock/index.json 读取，兼容多目录
export async function loadExperimentsList(): Promise<{ experiment_id: string; title: string }[]> {
  const mockIndexPath = path.join(process.cwd(), 'public', '_mock', 'index.json')
  const fallbackPaths = [
    path.join(process.cwd(), 'public', 'mock', 'index.json'),
    path.join(process.cwd(), 'public', 'mock', 'mock', 'index.json'),
  ]

  try {
    let fileContents: string | null = null

    if (fs.existsSync(mockIndexPath)) {
      fileContents = fs.readFileSync(mockIndexPath, 'utf-8')
    } else {
      for (const fp of fallbackPaths) {
        if (fs.existsSync(fp)) {
          fileContents = fs.readFileSync(fp, 'utf-8')
          break
        }
      }
    }

    if (!fileContents) {
      console.warn('[loadExperimentsList] index.json not found, returning empty list')
      return []
    }

    const data = JSON.parse(fileContents)
    if (data.experiments && Array.isArray(data.experiments)) {
      const experiments = data.experiments
        .map((exp: any) => {
          const eid = exp.experiment_id ?? exp.id ?? ''
          return {
            experiment_id: eid,
            title: exp.title || '未知实验',
          }
        })
        .filter((exp: any) => exp.experiment_id)

      console.log(
        `[loadExperimentsList] Loaded ${experiments.length} experiments from _mock/index.json`
      )
      return experiments
    }

    return []
  } catch (error) {
    console.error('[loadExperimentsList] Failed to load experiments:', error)
    return []
  }
}

/**
 * 读取 experiment detail：
 * - 兼容 expId = "001" / "exp_001" / "1"
 * - 优先 v2: public/_mock/experiments/exp_001.json
 * - 并补齐 ADX v1 原始数据到 _adx_v1
 */
export async function loadExperimentData(expId: string): Promise<any | null> {
  const norm = normalizeExpId(expId) // "exp_001" -> "001"
  const fileName = `exp_${norm}.json`

  const mockPaths = [
    // 标准 v2 路径
    path.join(process.cwd(), 'public', '_mock', 'experiments', fileName),
    // 兼容路径
    path.join(process.cwd(), 'public', 'mock', 'experiments', fileName),
    path.join(process.cwd(), 'public', 'mock', 'mock', 'experiments', fileName),
  ]

  let jsonRaw: any | null = null
  let usedPath: string | null = null

  for (const p of mockPaths) {
    if (!fs.existsSync(p)) continue
    try {
      const txt = fs.readFileSync(p, 'utf-8')
      jsonRaw = JSON.parse(txt)
      usedPath = p
      break
    } catch (e) {
      console.warn(`[loadExperimentData] Failed to parse ${p}:`, e)
    }
  }

  if (!jsonRaw) {
    console.warn(
      `[loadExperimentData] Experiment ${expId} (norm=${norm}, file=${fileName}) not found in mock paths`
    )
    return null
  }

  try {
    // v2 normalize（兼容字段结构差异）
    let normalized: any
    try {
      normalized = normalizeExperimentData(jsonRaw as ExperimentDataV2)
    } catch {
      normalized = jsonRaw
    }

    // detail normalize（补齐视图需要的字段）
    try {
      normalized = normalizeExperimentDetail(normalized as any)
    } catch {
      // ignore
    }

    // 【关键修复】补齐 ADX v1 raw 到 _adx_v1，使 ADX 视角组件能出数
    if (!(normalized as any)._adx_v1) {
      const adxData = loadAdxV1RawExperiment(expId)
      if (adxData) {
        ;(normalized as any)._adx_v1 = adxData
      }
    }

    ;(normalized as any)._source = usedPath
    return normalized
  } catch (error) {
    console.error(`[loadExperimentData] Failed to normalize experiment ${expId}:`, error)
    return jsonRaw
  }
}

// 兼容旧导出
export async function loadExperiment(expId: string): Promise<any | null> {
  return loadExperimentData(expId)
}

export async function loadExperimentSummary(expId: string): Promise<ExperimentSummary | null> {
  const data = await loadExperimentData(expId)
  if (!data) return null
  return {
    experiment_id: expId,
    title: data?.title || `实验 ${expId}`,
  } as any
}

export async function loadExperimentList(): Promise<{ experiment_id: string; title: string }[]> {
  return loadExperimentsList()
}

export async function loadAllExperiments(): Promise<any[]> {
  const list = await loadExperimentsList()
  const res = await Promise.all(list.map((x) => loadExperimentData(x.experiment_id)))
  return res.filter(Boolean)
}

export type { ExperimentData, ExperimentDataV2, ExperimentSummary }
