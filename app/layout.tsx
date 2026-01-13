import './globals.css'
import type { Metadata } from 'next'
import ContactAuthor from '@/components/ContactAuthor'

export const metadata: Metadata = {
  title: '搜索广告实验可视化',
  description: 'ADX Experiment Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ✅ 生产环境展示联系作者；开发环境默认不展示（避免你本地一直看到）
  const showContactAuthor =
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_SHOW_CONTACT_AUTHOR === '1'

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white">
        {children}

        {showContactAuthor ? <ContactAuthor /> : null}
      </body>
    </html>
  )
}
