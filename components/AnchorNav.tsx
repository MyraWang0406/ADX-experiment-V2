'use client'

import { useState, useEffect } from 'react'

const sections = [
  { id: 'decision-summary', label: '决策摘要' },
  { id: 'query-intent', label: '搜索词&意图' },
  { id: 'landing-conversion', label: '落地页&转化' },
  { id: 'bidding-budget', label: '出价&预算' },
  { id: 'traffic-coverage', label: '流量覆盖' },
  { id: 'ranking-strategy', label: '排序策略' },
  { id: 'diagnosis', label: '原因诊断' },
]

export default function AnchorNav() {
  const [activeSection, setActiveSection] = useState('decision-summary')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [sectionProgress, setSectionProgress] = useState({ current: 1, total: sections.length })

  useEffect(() => {
    let observer: IntersectionObserver | null = null

    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowBackToTop(scrollY > 500)

      // 使用 IntersectionObserver 高亮当前章节
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
              const id = entry.target.id
              setActiveSection(id)
              // 更新进度
              const currentIndex = sections.findIndex(s => s.id === id)
              if (currentIndex >= 0) {
                setSectionProgress({ current: currentIndex + 1, total: sections.length })
              }
            }
          })
        },
        {
          rootMargin: '-100px 0px -50% 0px',
          threshold: [0, 0.3, 0.5],
        }
      )

      sections.forEach((section) => {
        const element = document.getElementById(section.id)
        if (element && observer) {
          observer.observe(element)
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始检查
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (observer) {
        sections.forEach((section) => {
          const element = document.getElementById(section.id)
          if (element && observer) {
            observer.unobserve(element)
          }
        })
      }
    }
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 120
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
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          {/* 进度显示 */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="text-xs text-gray-500 mb-1">阅读进度</div>
            <div className="text-sm font-semibold text-blue-600">
              {sectionProgress.current} / {sectionProgress.total}
            </div>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(sectionProgress.current / sectionProgress.total) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors relative ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                  <span>{section.label}</span>
                </span>
                {activeSection === section.id && (
                  <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r" />
                )}
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
