import 'server-only'
import type { ExperimentData } from '@/lib/data-loader'
import { loadExperimentData } from './data-loader'

/**
 * 实验数据加载器 - 支持 demo/live 模式切换
 * 
 * 模式切换方式：
 * 1. Query 参数：?mode=live（优先级最高）
 * 2. 环境变量：NEXT_PUBLIC_EXPERIMENT_MODE=live
 * 3. 默认：demo 模式（使用本地 mock）
 */

export type ExperimentMode = 'demo' | 'live'

/**
 * 获取当前实验模式
 * @param searchParams - URL search params（来自 page.tsx 的 searchParams）
 */
export function getExperimentMode(searchParams?: { mode?: string | string[] }): ExperimentMode {
  // 优先级 1: Query 参数
  if (searchParams?.mode) {
    const mode = Array.isArray(searchParams.mode) ? searchParams.mode[0] : searchParams.mode
    if (mode === 'live') {
      return 'live'
    }
  }
  
  // 优先级 2: 环境变量
  const envMode = process.env.NEXT_PUBLIC_EXPERIMENT_MODE
  if (envMode === 'live') {
    return 'live'
  }
  
  // 默认: demo 模式
  return 'demo'
}

/**
 * 从 API 加载实验数据（live 模式）
 */
async function loadExperimentFromAPI(expId: string): Promise<ExperimentData | null> {
  // 【防 500】构建 API URL，确保使用正确的协议和主机
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
  const apiUrl = `${baseUrl}/api/experiments/${encodeURIComponent(expId)}`
  
  try {
    // 【防 500】fetch 可能失败（网络错误、超时、500 等），需要完整的错误处理
    const response = await fetch(apiUrl, {
      cache: 'no-store', // 确保每次都是最新数据
      headers: {
        'Content-Type': 'application/json',
      },
      // 【防 500】设置超时，避免长时间等待
      signal: AbortSignal.timeout(10000), // 10 秒超时
    })
    
    // 【防 500】检查响应状态，非 200 时返回 null
    if (!response.ok) {
      console.error(`[${expId}] API fetch failed: status=${response.status}, url=${apiUrl}`)
      return null
    }
    
    // 【防 500】JSON 解析可能失败，需要 try-catch
    const data = await response.json()
    
    // 【防 500】确保返回的数据是对象
    if (data && typeof data === 'object' && !data.error) {
      return data as ExperimentData
    }
    
    return null
  } catch (error: any) {
    // 【防 500】网络错误、超时、JSON 解析错误等都捕获，返回 null（fallback 到 demo）
    console.error(`[${expId}] API fetch error: url=${apiUrl}, error=${error.message || error}`)
    return null
  }
}

/**
 * 统一的数据加载接口
 * @param expId - 实验 ID
 * @param mode - 模式（可选，不传则自动检测）
 * @param searchParams - URL search params（用于自动检测模式）
 */
export async function loadExperiment(
  expId: string,
  mode?: ExperimentMode,
  searchParams?: { mode?: string | string[] }
): Promise<ExperimentData | null> {
  // 【防 500】确保 expId 有效
  if (!expId || typeof expId !== 'string') {
    return null
  }
  
  // 确定使用的模式
  const actualMode = mode || getExperimentMode(searchParams)
  
  if (actualMode === 'live') {
    // Live 模式：从 API 加载
    const apiData = await loadExperimentFromAPI(expId)
    
    // 【防 500】API 失败时 fallback 到 demo 模式（确保页面不崩溃）
    if (apiData) {
      return apiData
    } else {
      console.warn(`Live mode failed for ${expId}, falling back to demo mode`)
      // 继续执行下面的 demo 模式逻辑
    }
  }
  
  // Demo 模式：从本地 mock 加载（默认）
  return await loadExperimentData(expId)
}

