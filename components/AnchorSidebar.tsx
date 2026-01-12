'use client'

import { useState, useEffect } from 'react'

const sections = [
  { id: 'leader-summary', label: '总览' },
  { id: 'funnel', label: '漏斗' },
  { id: 'category', label: '画风' },
  { id: 'topn', label: 'TopN' },
  { id: 'auction', label: '拍卖' },
  { id: 'ocpx', label: 'OCPX' },
  { id: 'diagnosis', label: '原因诊断' },
]

export default function AnchorSidebar() {
  const [activeSection, setActiveSection] = useState('leader-summary')
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowBackToTop(scrollY > 500)

      // 找到当前可见的章节
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i].id)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 200) {
            setActiveSection(sections[i].id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {/* 左侧锚点目录 - 只在桌面端显示 */}
      <div className="hidden lg:block fixed left-4 top-1/2 transform -translate-y-1/2 z-30">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右下角回到顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-8 z-30 bg-blue-600 text-white rounded-full p-2 sm:p-3 shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="回到顶部"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </>
  )
}
