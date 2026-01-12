/**
 * 安全访问工具函数
 * 用于统一处理 baseline/treatment 数据访问，避免 undefined 错误
 */

export type ViewType = 'baseline' | 'treatment' | 'compare'

/**
 * 安全获取 variant 数据
 * @param obj 包含 baseline/treatment 的对象
 * @param view 视图类型
 * @returns 安全的数据对象，永远不会是 undefined
 */
export function safeVariant<T extends { baseline?: any; treatment?: any }>(
  obj: T | undefined | null,
  view: ViewType
): any {
  if (!obj) {
    return view === 'compare' ? { baseline: {}, treatment: {} } : {}
  }

  const baseline = obj.baseline ?? {}
  const treatment = obj.treatment ?? {}

  switch (view) {
    case 'baseline':
      return baseline
    case 'treatment':
      return treatment
    case 'compare':
      return { baseline, treatment }
    default:
      return {}
  }
}

/**
 * 安全获取嵌套对象的值
 */
export function safeGet(obj: any, path: string, defaultValue: any = 0): any {
  if (!obj || typeof obj !== 'object') return defaultValue
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return defaultValue
    }
    current = current[key]
  }
  
  return current ?? defaultValue
}

/**
 * 确保数组存在
 */
export function ensureArray<T>(value: T[] | undefined | null, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? value : defaultValue
}

/**
 * 确保对象存在
 */
export function ensureObject<T extends Record<string, any>>(
  value: T | undefined | null,
  defaultValue: T = {} as T
): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : defaultValue
}


