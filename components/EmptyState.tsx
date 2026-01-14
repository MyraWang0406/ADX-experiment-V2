'use client'

interface EmptyStateProps {
  title?: string
  message?: string
  className?: string
}

export default function EmptyState({ 
  title = '暂无数据', 
  message = '数据格式不符合预期或字段缺失',
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  )
}








