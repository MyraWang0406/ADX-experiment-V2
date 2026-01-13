'use client'

import React, { useMemo, useState } from 'react'

type DiagnosisBranch = {
  name?: string
  node?: string
  title?: string
  evidence?: any[]
  children?: DiagnosisBranch[]
  checks?: any[]
  reasons?: any[]
  confidence?: number
}

interface DiagnosisTreeProps {
  data?: {
    root?: string
    branches?: Array<{
      name?: string
      node?: string
      title?: string
      checks?: any[]
      evidence_fields?: string[]
      evidence?: any[]
      children?: DiagnosisBranch[]
      [key: string]: any
    }>
  } | null
  diagnosis?: DiagnosisBranch | null | undefined
  narrative?: string
}

function formatCheckText(raw: string): { zh: string; code?: string } {
  const s = String(raw || '').trim()
  const m1 = s.match(/^([A-Z0-9_]+)\((.+)\)$/)
  if (m1) return { code: m1[1], zh: m1[2] }
  const m2 = s.match(/^(.+)\(([A-Z0-9_]+)\)$/)
  if (m2) return { code: m2[2], zh: m2[1] }
  return { zh: s }
}

const symptomCategories: Record<string, { zh: string; desc: string }> = {
  '量不足': { zh: '量不足', desc: '广告填充不足或覆盖率低' },
  '相关性不足': { zh: '相关性不足', desc: '内容质量或相关性不足，误杀或噪声' },
  '体验受损': { zh: '体验受损', desc: '用户体验指标异常，如留存下降、早退增加' },
  'OCPX不稳': { zh: 'OCPX不稳', desc: 'OCPX控制不稳定，CPA波动大' },
}

// 二级：原因 bucket 映射（补全你数据里常见的 code）
const reasonBucketMap: Record<string, { zh: string; category: string }> = {
  BID_TOO_LOW: { zh: '出价过低', category: '量不足' },
  BUDGET_EXHAUSTED: { zh: '预算耗尽', category: '量不足' },
  TIMEOUT: { zh: '超时', category: '量不足' },
  LOW_COVERAGE: { zh: '覆盖率低', category: '量不足' },

  FILTERED_BY_QUALITY: { zh: '质量过滤', category: '相关性不足' },
  FILTERED_BY_DUP: { zh: '重复/同质过滤', category: '相关性不足' },
  FILTERED_BY_FREQ_CAP: { zh: '频控限制', category: '相关性不足' },
  DIVERSITY_SWAP: { zh: '多样性换位', category: '相关性不足' },
  RESOURCE_SLOT_INSERT: { zh: '资源位插入', category: '相关性不足' },

  LOW_RELEVANCE: { zh: '相关性不足', category: '相关性不足' },
  LOW_QUALITY: { zh: '质量不足', category: '相关性不足' },
  FILTER_TOO_STRICT: { zh: '过滤过严', category: '相关性不足' },

  USER_DROP: { zh: '用户流失', category: '体验受损' },
  RETENTION_DROP: { zh: '留存下降', category: '体验受损' },
  BOUNCE_UP: { zh: '早退升高', category: '体验受损' },

  OCPX_UNSTABLE: { zh: 'OCPX不稳', category: 'OCPX不稳' },
  CPA_VOLATILE: { zh: 'CPA波动', category: 'OCPX不稳' },
  LEARNING_RESET: { zh: '学习重置', category: 'OCPX不稳' },
}

function getSymptomCategory(branch: DiagnosisBranch): string {
  const s = String(branch?.name ?? branch?.node ?? branch?.title ?? '')
  if (/ocpx/i.test(s)) return 'OCPX不稳'
  if (s.includes('量不足')) return '量不足'
  if (s.includes('相关性不足') || s.includes('质量')) return '相关性不足'
  if (s.includes('体验')) return '体验受损'
  return '量不足'
}

function flattenBranches(root: DiagnosisBranch | null | undefined): DiagnosisBranch[] {
  if (!root) return []
  const out: DiagnosisBranch[] = []
  const stack: DiagnosisBranch[] = [root]
  while (stack.length) {
    const cur = stack.pop()!
    out.push(cur)
    if (cur.children && Array.isArray(cur.children)) {
      for (let i = cur.children.length - 1; i >= 0; i--) {
        stack.push(cur.children[i]!)
      }
    }
  }
  return out
}

export default function DiagnosisTree({ data, diagnosis, narrative }: DiagnosisTreeProps) {
  const [activeCategory, setActiveCategory] = useState<string>('量不足')

  const diagnosisNode: DiagnosisBranch | null | undefined = useMemo(() => {
    if (diagnosis) return diagnosis
    if (data?.branches && Array.isArray(data.branches) && data.branches.length > 0) {
      return {
        name: data.root || '诊断根节点',
        children: data.branches.map((b: any) => ({
          name: b.name || b.node || b.title,
          node: b.node,
          title: b.title,
          checks: b.checks,
          evidence: b.evidence || (b.evidence_fields ? b.evidence_fields.map((f: string) => ({ field: f })) : []),
          children: b.children,
          ...b,
        })),
      }
    }
    return null
  }, [data, diagnosis])

  const { branchesByCategory, checksByCategory, evidenceByCategory } = useMemo(() => {
    const branches = flattenBranches(diagnosisNode)

    const byCat: Record<string, DiagnosisBranch[]> = {
      量不足: [],
      相关性不足: [],
      体验受损: [],
      OCPX不稳: [],
    }

    const checksCat: Record<string, any[]> = { 量不足: [], 相关性不足: [], 体验受损: [], OCPX不稳: [] }
    const evidenceCat: Record<string, any[]> = { 量不足: [], 相关性不足: [], 体验受损: [], OCPX不稳: [] }

    for (const b of branches) {
      const cat = getSymptomCategory(b)
      byCat[cat] = byCat[cat] || []
      byCat[cat].push(b)

      const localChecks: any[] = []
      if (Array.isArray((b as any).checks)) localChecks.push(...((b as any).checks as any[]))
      if (Array.isArray((b as any).reasons)) localChecks.push(...((b as any).reasons as any[]))
      checksCat[cat] = checksCat[cat] || []
      for (const c of localChecks) checksCat[cat].push({ check: c })

      if (Array.isArray((b as any).evidence)) {
        evidenceCat[cat] = evidenceCat[cat] || []
        evidenceCat[cat].push(...((b as any).evidence as any[]))
      }
    }

    // ✅ checks 去重 + code→中文映射
    const dedupeChecks = (items: any[]) => {
      const uniqueMap = new Map<string, { zh: string; code?: string; checkObj?: any }>()
      items.forEach(({ check }) => {
        const checkStr =
          typeof check === 'string'
            ? check
            : (check?.title || check?.symptom || String(check ?? ''))
        const checkObj = typeof check === 'object' && check !== null ? check : null

        let { zh, code } = formatCheckText(checkStr)

        // 形如 "BID_TOO_LOW" 这种：把 zh 当作 code
        if (!code && /^[A-Z0-9_]+$/.test(zh)) code = zh

        const mappedZh =
          (code && reasonBucketMap[code]?.zh) ||
          reasonBucketMap[zh]?.zh ||
          zh

        const mappedCode = code || (reasonBucketMap[zh] ? zh : undefined)

        const key = (mappedCode || mappedZh).trim()
        if (!key) return
        if (!uniqueMap.has(key)) uniqueMap.set(key, { zh: mappedZh, code: mappedCode, checkObj })
      })
      return [...uniqueMap.values()]
    }

    const checksByCatFinal: Record<string, any[]> = {
      量不足: dedupeChecks(checksCat['量不足'] || []),
      相关性不足: dedupeChecks(checksCat['相关性不足'] || []),
      体验受损: dedupeChecks(checksCat['体验受损'] || []),
      OCPX不稳: dedupeChecks(checksCat['OCPX不稳'] || []),
    }

    return {
      branchesByCategory: byCat,
      checksByCategory: checksByCatFinal,
      evidenceByCategory: evidenceCat,
    }
  }, [diagnosisNode])

  const categories = Object.keys(symptomCategories)

  const activeChecks = checksByCategory[activeCategory] || []
  const activeEvidence = evidenceByCategory[activeCategory] || []

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">原因诊断（证据闭环）</h2>
          <p className="mt-1 text-sm text-gray-600">
            大原因并列展示，点击查看该类下的证据与检查项（已去重）
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {categories.map((cat) => {
          const isActive = cat === activeCategory
          const meta = symptomCategories[cat]
          const count = (checksByCategory[cat] || []).length
          return (
            <button
              key={cat}
              className={[
                'text-left rounded-lg border px-3 py-2 transition',
                isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50',
              ].join(' ')}
              onClick={() => setActiveCategory(cat)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-900">{meta?.zh || cat}</div>
                <div className="text-xs text-gray-600">{count}</div>
              </div>
              <div className="mt-1 text-xs text-gray-600 line-clamp-2">{meta?.desc}</div>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-900">检查项（已去重）</div>
        {activeChecks.length === 0 ? (
          <div className="mt-2 text-sm text-gray-500">暂无检查项（数据不足或未生成）</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {activeChecks.map((c: any, idx: number) => (
              <div
                key={`${c.code || c.zh}-${idx}`}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <div className="text-sm text-gray-900">{c.zh}</div>
                {c.code ? <div className="text-xs text-gray-500 mt-0.5">{c.code}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-gray-900">证据</div>
        {activeEvidence.length === 0 ? (
          <div className="mt-2 text-sm text-gray-500">暂无证据</div>
        ) : (
          <div className="mt-3 space-y-2">
            {activeEvidence.slice(0, 12).map((e: any, idx: number) => {
              const title =
                e?.title ||
                e?.metric ||
                e?.name ||
                e?.field ||
                (typeof e === 'string' ? e : '') ||
                '证据项'

              const detail =
                e?.detail ??
                e?.desc ??
                e?.value

              return (
                <div key={idx} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                  <div className="text-sm text-gray-900">{String(title)}</div>
                  {detail !== undefined && detail !== null ? (
                    <div className="text-xs text-gray-600 mt-1">{String(detail)}</div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
