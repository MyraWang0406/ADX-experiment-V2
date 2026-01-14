'use client'

import { useEffect, useMemo, useState } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    // 避免循环：这里只在 error 对象变化时记录一次
    console.error('[error boundary caught]', error)
  }, [error])

  const isDev = useMemo(() => process.env.NODE_ENV === 'development', [])

  const handleReset = () => {
    try {
      reset()
    } catch (e) {
      console.error('[reset failed] reloading page:', e)
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-red-600 mb-4">出错了</h2>

        <div className="text-sm text-gray-700 mb-4">
          <p className="font-medium mb-2">错误信息：</p>
          <p className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs break-all">
            {error?.message || '未知错误'}
          </p>

          {error?.digest && (
            <p className="mt-2 text-xs text-gray-500">错误 ID: {error.digest}</p>
          )}

          {isDev && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetail((v) => !v)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showDetail ? '收起详情' : '展开详情（开发态）'}
              </button>

              {showDetail && (
                <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 border border-gray-200 rounded p-3 text-gray-700">
                  {error?.stack || '(no stack)'}
                </pre>
              )}
            </div>
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
