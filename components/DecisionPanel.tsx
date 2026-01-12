'use client'

import { useState } from 'react'
import type { ExperimentData } from '@/lib/data-loader'
import { getBottleneck } from '@/lib/data-loader'
import { nodeNames } from '@/lib/translations'
import { filterActionsByView } from '@/lib/types/adx'
import { useExperimentDetail } from '@/components/exp/ExperimentDetailContext'

interface DecisionPanelProps {
  experiment: ExperimentData
}

export default function DecisionPanel({ experiment }: DecisionPanelProps) {
  const bottleneck = getBottleneck(experiment)
  const { view } = useExperimentDetail()
  
  // viewFilter 用于过滤（需要大写格式）
  const viewFilter: 'All' | 'DSP' | 'SSP' | 'ADX' = 
    view === 'all' ? 'All' :
    view === 'dsp' ? 'DSP' :
    view === 'ssp' ? 'SSP' : 'ADX'
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set())
  
  // 【新增】优先使用 ADX v1 格式的 actions
  const adxActions = (experiment as any)?._adx_v1?.actions
  if (adxActions && Array.isArray(adxActions)) {
    const filteredActions = viewFilter ? filterActionsByView(adxActions, viewFilter) : adxActions
    const actions = filteredActions.map((item: any) => ({
      action: item.title || '',
      owner: item.owner || '未知',
      validation: item.validation || '待定',
    }))
    
    // 如果过滤后没有动作，显示提示
    if (actions.length === 0 && viewFilter && viewFilter !== 'All') {
      return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 sticky top-20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">下一步动作</h2>
          <div className="text-sm text-gray-400 text-center py-4">
            当前视角（{viewFilter}）暂无动作项
          </div>
        </div>
      )
    }
    
    // 使用过滤后的 actions
    const handleCopyAction = async (action: string, index: number) => {
      const text = `${index + 1}. ${action}\n负责人: ${actions[index].owner}\n验证方式: ${actions[index].validation}`
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板')
    }
    
    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 sticky top-20">
        <h2 className="text-xl font-bold text-gray-900 mb-4">下一步动作</h2>
        <div className="space-y-3">
          {actions.map((item, index) => {
            const isChecked = checkedActions.has(index)
            return (
              <div 
                key={index} 
                className={`border rounded-lg p-3 transition-colors ${
                  isChecked 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const newChecked = new Set(checkedActions)
                      if (isChecked) {
                        newChecked.delete(index)
                      } else {
                        newChecked.add(index)
                      }
                      setCheckedActions(newChecked)
                    }}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{index + 1}.</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyAction(item.action, index)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        复制
                      </button>
                    </div>
                    <div className={`text-sm mb-2 ${isChecked ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                      {item.action}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-600">负责人: <span className="font-medium text-blue-700">{item.owner}</span></span>
                      <span className="text-gray-600">验证: <span className="font-medium text-purple-700">{item.validation}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  
  // 生成下一步动作（3-5条，按最快验证优先）- 旧格式 fallback
  const generateActions = (): Array<{ action: string; owner: string; validation: string }> => {
    const actions: Array<{ action: string; owner: string; validation: string }> = []
    
    if (bottleneck) {
      const suggestedActions = (bottleneck as any).suggested_actions
      if (suggestedActions && Array.isArray(suggestedActions)) {
        suggestedActions.slice(0, 5).forEach((action, i) => {
          actions.push({
            action,
            owner: i < 2 ? '算法' : i < 4 ? '工程' : '运营',
            validation: i < 2 ? '离线模拟' : i < 4 ? '小流量验证' : 'A-A测试'
          })
        })
      } else {
        // 根据 stage 生成动作
        const stage = bottleneck.stage || bottleneck.node || ''
        if (stage === 'recall') {
          actions.push(
            { action: '优化召回源权重，提升优质内容覆盖率', owner: '算法', validation: '离线模拟' },
            { action: '增加向量召回精度，减少噪声', owner: '工程', validation: '小流量验证' },
            { action: '调整召回多样性策略', owner: '算法', validation: '离线模拟' }
          )
        } else if (stage === 'fine') {
          actions.push(
            { action: '优化精排模型特征，提升相关性', owner: '算法', validation: '离线模拟' },
            { action: '调整精排目标权重，平衡时长与完播', owner: '算法', validation: '小流量验证' },
            { action: '优化精排延迟，提升吞吐', owner: '工程', validation: '回放测试' }
          )
        } else if (stage === 'auction') {
          actions.push(
            { action: '调整底价策略，平衡广告填充率与收入', owner: '商业化', validation: '小流量验证' },
            { action: '优化 OCPX 倍率控制，稳定 CPA', owner: '算法', validation: '离线模拟' },
            { action: '提升拍卖响应速度，降低超时率', owner: '工程', validation: '回放测试' }
          )
        } else {
          actions.push(
            { action: '优化该环节性能，降低延迟', owner: '工程', validation: '回放测试' },
            { action: '调整该环节策略参数', owner: '算法', validation: '离线模拟' },
            { action: '监控该环节指标变化', owner: '运营', validation: 'A-A测试' }
          )
        }
      }
    }
    
    // 从 diagnosis_tree 获取 actions
    if (experiment.diagnosis_tree?.branches?.[0]?.actions) {
      experiment.diagnosis_tree.branches[0].actions.slice(0, 2).forEach((action, i) => {
        actions.push({
          action,
          owner: i === 0 ? '算法' : '工程',
          validation: i === 0 ? '离线模拟' : '小流量验证'
        })
      })
    }
    
    return actions.slice(0, 5)
  }
  
  const actions = generateActions()

  const handleCopyAction = async (action: string, index: number) => {
    const text = `${index + 1}. ${action}\n负责人: ${actions[index].owner}\n验证方式: ${actions[index].validation}`
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 sticky top-20">
      <h2 className="text-xl font-bold text-gray-900 mb-4">下一步动作</h2>
      
      {actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map((item, index) => {
            const isChecked = checkedActions.has(index)
            return (
              <div 
                key={index} 
                className={`border rounded-lg p-3 transition-colors ${
                  isChecked 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const newChecked = new Set(checkedActions)
                      if (isChecked) {
                        newChecked.delete(index)
                      } else {
                        newChecked.add(index)
                      }
                      setCheckedActions(newChecked)
                    }}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{index + 1}.</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyAction(item.action, index)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        复制
                      </button>
                    </div>
                    <div className={`text-sm mb-2 ${isChecked ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                      {item.action}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-600">负责人: <span className="font-medium text-blue-700">{item.owner}</span></span>
                      <span className="text-gray-600">验证: <span className="font-medium text-purple-700">{item.validation}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-400 text-center py-4">暂无动作项</div>
      )}
    </div>
  )
}

