'use client'

import { useState } from 'react'
import { getNorthStar, getGuardrails, getBottleneck } from '@/lib/data-loader'
import { formatLift, safePercentChange } from '@/lib/utils'

interface AIReflectionProps {
  experimentData: any
}

export default function AIReflection({ experimentData }: AIReflectionProps) {
  const [showModal, setShowModal] = useState(false)
  const [showJSON, setShowJSON] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [copiedJSON, setCopiedJSON] = useState(false)

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const generateLeaderSummary = () => {
    const { experiment_id, title, narrative } = experimentData
    const northStar = getNorthStar(experimentData)
    const guardrails = getGuardrails(experimentData)
    const bottleneck = getBottleneck(experimentData)
    
    const vvChange = safePercentChange(northStar.baseline, northStar.treatment)
    const vvChangeFormatted = formatLift(northStar.baseline, northStar.treatment)
    const bottleneckInfo = bottleneck ? `${bottleneck.stage || bottleneck.node}: ${bottleneck.symptom || bottleneck.note}` : '无卡点'
    
    const riskGuardrails = guardrails.filter(g => {
      const name = typeof g?.name === 'string' ? g.name : String(g?.name ?? '')
      // 【修复】添加 null 检查，避免对 null 值进行数值比较
      if (g.baseline == null || g.treatment == null) return false
      if (name.includes('留存')) return g.treatment < g.baseline * 0.95
      if (name.includes('早退') || name.includes('投诉')) return g.treatment > g.baseline * 1.05
      return false
    })
    
    // 【修复】安全地格式化数值，处理 null 值
    const baselineStr = northStar.baseline != null ? northStar.baseline.toLocaleString() : '—'
    const treatmentStr = northStar.treatment != null ? northStar.treatment.toLocaleString() : '—'
    
    return `实验 ${experiment_id}: ${title}

背景：${narrative}

核心结果：
- 北极星指标（${northStar.name}）：${baselineStr} → ${treatmentStr} (${vvChangeFormatted})
- 卡点节点：${bottleneckInfo}
${riskGuardrails.length > 0 ? `- 护栏风险：${riskGuardrails.map(g => g.name).join('、')}` : ''}

关键发现：
${guardrails.slice(0, 3).map(g => {
  const baselineVal = g.baseline != null ? g.baseline.toFixed(2) : '—'
  const treatmentVal = g.treatment != null ? g.treatment.toFixed(2) : '—'
  return `- ${g.name}: ${baselineVal}${g.unit} → ${treatmentVal}${g.unit}`
}).join('\n')}

下一步建议：
${(bottleneck as any)?.suggested_actions?.slice(0, 3).map((action: string, i: number) => `${i + 1}. ${action}`).join('\n') || '1. 优化关键环节性能\n2. 调整策略参数\n3. 监控护栏指标'}`
  }

  const generateLLMPrompt = () => {
    const instruction = `你是一位资深的推荐算法实验分析师。请基于以下实验数据，生成一份结构化的实验复盘报告。

## 复盘报告结构要求

### 1. 背景与问题
- 从 experiment.narrative 和 experiment.title 提取实验背景
- 明确要解决的核心问题
- 说明目标用户群（experiment.primary_segment）
- 实验假设和预期效果

### 2. 目标体系分析
#### 2.1 北极星指标
- 从 kpi_framework.north_star 或 metrics_summary.*.north_star 读取
- Baseline vs Treatment 对比
- 变化幅度（百分比）
- 是否达到预期目标

#### 2.2 护栏指标
- 从 kpi_framework.guardrails 或 metrics_summary.*.guardrails 读取
- 对比分析，判断是否在安全范围内
- 如有异常，说明风险等级

#### 2.3 过程指标
- 从 kpi_framework.process_kpis 读取各阶段指标
- Baseline vs Treatment 的对比
- 各指标的变化趋势和意义

### 3. 关键变化分析
#### 3.1 漏斗变化（pipeline.funnel）
- 各环节数量对比：pool → after_recall → after_coarse → after_fine → final
- 计算各环节的转化率
- 识别流失最大的环节
- 分析转化率提升/下降的原因

#### 3.2 内容分布变化（pipeline.category_dist）
- 各类目占比的 Baseline vs Treatment 对比
- 识别变化最大的类目
- 判断是否符合预期方向

#### 3.3 拍卖与出价（pipeline.auction, pipeline.bid）
- 胜率、底价、超时率、填充率的变化
- 出价策略和预算节奏的影响
- 拍卖拒绝原因分析（pipeline.reasons.auction）

#### 3.4 OCPX 控制（pipeline.ocpx_timeseries）
- 倍率波动情况
- 实际 CPA 与目标 CPA 的偏差
- 预算消耗节奏

### 4. 结论
- 实验是否达到预期目标
- 主要成功点和失败点
- 对北极星指标的影响评估

### 5. 卡点原因树
- 从 pipeline.bottlenecks 读取卡点信息（stage/type/symptom/impact）
- 从 diagnosis_tree 读取诊断分支
- 分析最可能的根本原因
- 引用具体的字段路径作为证据

### 6. 下一步动作（3-5条）
- 按"最快验证优先"排序
- 每条动作包含：具体操作、负责人（算法/工程/运营/商业化）、风险与监控指标
- 从 bottleneck.suggested_actions 或 diagnosis_tree.branches[].actions 提取

## 实验数据（JSON格式）
\`\`\`json
${showJSON ? JSON.stringify(experimentData, null, 2) : '（已折叠，点击"展开原始数据"查看）'}
\`\`\``

    return instruction
  }

  const handleCopySummary = async () => {
    try {
      const summary = generateLeaderSummary()
      await navigator.clipboard.writeText(summary)
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('复制失败，请手动复制')
    }
  }

  const handleCopyJSON = async () => {
    try {
      const prompt = generateLLMPrompt()
      await navigator.clipboard.writeText(prompt)
      setCopiedJSON(true)
      setTimeout(() => setCopiedJSON(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('复制失败，请手动复制')
    }
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        AI 自动复盘
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">AI 自动复盘</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 给 LLM 的指令 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">给 LLM 的指令</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {generateLLMPrompt().split('```json')[0]}
                  </pre>
                </div>
              </div>

              {/* 实验 JSON（可折叠） */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">实验数据（JSON）</h3>
                  <button
                    onClick={() => setShowJSON(!showJSON)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showJSON ? '折叠原始数据' : '展开原始数据'}
                  </button>
                </div>
                {showJSON && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(experimentData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCopySummary}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copiedSummary ? '✓ 已复制' : '复制给 Leader 的摘要'}
                </button>
                <button
                  onClick={handleCopyJSON}
                  className="flex-1 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                >
                  {copiedJSON ? '✓ 已复制' : '复制给 LLM 的 Prompt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
