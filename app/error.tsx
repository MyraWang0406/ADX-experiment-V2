'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 记录错误到控制台（只记录一次，避免循环）
    console.error('Error boundary caught:', error.message, error.stack)
  }, [error])

  const handleReset = () => {
    try {
      reset()
    } catch (e) {
      // 如果 reset 失败，直接刷新页面
      console.error('Reset failed, reloading page:', e)
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-red-600 mb-4">出错了</h2>
        <div className="text-sm text-gray-700 mb-4">
          <p className="font-medium mb-2">错误信息：</p>
          <p className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs break-all">
            {error?.message || '未知错误'}
          </p>
          {error?.digest && (
            <p className="mt-2 text-xs text-gray-500">
              错误 ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            重试
          </button>
          <button
            onClick={() => {
              window.location.href = '/'
            }}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}


