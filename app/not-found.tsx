import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">404 - 页面未找到</h2>
        <p className="text-gray-600 mb-6">
          抱歉，您访问的页面不存在。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}







