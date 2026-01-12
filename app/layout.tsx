import type { Metadata } from 'next'
import './globals.css'
import dynamic from 'next/dynamic'

// 动态导入 Client Component，避免 SSR 问题
const ContactAuthor = dynamic(() => import('@/components/ContactAuthor'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'AI 推荐广告实验 Dashboard',
  description: '搜广推可视化实验分析平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">
        {children}
        <ContactAuthor />
      </body>
    </html>
  )
}



