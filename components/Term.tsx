'use client'

import { useState } from 'react'
import { getMetricTerm, getReasonCodeTerm, getFieldLabelTerm, getPipelineStageTerm } from '@/lib/dictionaries/terminology'

interface TermProps {
  labelKey: string
  type?: 'metric' | 'reason' | 'field' | 'pipeline'
  children?: React.ReactNode
}

export default function Term({ labelKey, type = 'reason', children }: TermProps) {
  const [showPopover, setShowPopover] = useState(false)
  
  let term: any = null
  let displayText = labelKey
  
  if (type === 'metric') {
    term = getMetricTerm(labelKey)
    if (term) displayText = `${term.zh}（${term.en}）`
  } else if (type === 'reason') {
    term = getReasonCodeTerm(labelKey)
    if (term) displayText = `${term.zh}（${labelKey}）`
  } else if (type === 'field') {
    term = getFieldLabelTerm(labelKey)
    if (term) displayText = term.zh
  } else if (type === 'pipeline') {
    term = getPipelineStageTerm(labelKey)
    if (term) displayText = term.zh
  }
  
  if (!term) {
    return <span>{children || labelKey}</span>
  }

  return (
    <span className="relative inline-block">
      <span
        className="text-blue-600 cursor-help underline decoration-dotted underline-offset-2 hover:text-blue-700"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        onClick={() => setShowPopover(!showPopover)}
      >
        {children || displayText}
      </span>
      
      {showPopover && (
        <div className="absolute z-50 w-72 sm:w-80 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2 max-h-96 overflow-y-auto">
          <div className="text-sm font-semibold text-gray-900 mb-2">{term.zh}</div>
          
          {term.desc && (
            <div className="text-xs text-gray-600 mb-2">
              <div className="font-medium mb-1">说明：</div>
              <div>{term.desc}</div>
            </div>
          )}
          
          {term.why_it_matters && (
            <div className="text-xs text-gray-600 mb-2">
              <div className="font-medium mb-1">重要性：</div>
              <div>{term.why_it_matters}</div>
            </div>
          )}
          
          {term.impact && (
            <div className="text-xs text-orange-600 mb-2">
              <div className="font-medium mb-1">影响：</div>
              <div>{term.impact}</div>
            </div>
          )}
          
          {term.suggestions && term.suggestions.length > 0 && (
            <div className="text-xs text-blue-600">
              <div className="font-medium mb-1">建议动作：</div>
              <ul className="list-disc list-inside space-y-0.5">
                {term.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 关闭按钮 */}
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation()
              setShowPopover(false)
            }}
          >
            ×
          </button>
        </div>
      )}
    </span>
  )
}

