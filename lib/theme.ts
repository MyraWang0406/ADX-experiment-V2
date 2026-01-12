// 颜色主题配置 - 统一蓝色系（禁止绿色状态点）

export const theme = {
  colors: {
    // 主色 - 蓝色系
    primary: {
      main: '#2563eb',      // blue-600
      light: '#3b82f6',     // blue-500
      dark: '#1e40af',      // blue-800
      bg: '#dbeafe',        // blue-100
      border: '#93c5fd',   // blue-300
    },
    // 基线 - 浅蓝
    baseline: {
      primary: '#60a5fa',  // blue-400
      dark: '#3b82f6',     // blue-500
      light: '#93c5fd',    // blue-300
      bg: '#dbeafe',       // blue-100
      border: '#93c5fd',   // blue-300
    },
    // 实验组 - 深蓝
    treatment: {
      primary: '#1e40af',  // blue-800
      dark: '#1e3a8a',     // blue-900
      light: '#3b82f6',    // blue-500
      bg: '#dbeafe',       // blue-100
      border: '#3b82f6',   // blue-500
    },
    // 对比视图 - 使用不同深浅的蓝
    compare: {
      baseline: '#60a5fa',  // blue-400
      treatment: '#1e40af', // blue-800
    },
    // 状态颜色（禁止绿色）
    status: {
      success: '#2563eb',   // blue-600 (用蓝色代替绿色)
      warning: '#f97316',   // orange-500
      error: '#ef4444',     // red-500
      info: '#3b82f6',      // blue-500
      normal: '#6b7280',    // gray-500
    },
    // 告警颜色
    alert: {
      red: '#ef4444',       // red-500
      orange: '#f97316',   // orange-500
      yellow: '#eab308',   // yellow-500
      // 不使用 green
    },
    // 中性色
    neutral: {
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray400: '#9ca3af',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray800: '#1f2937',
      gray900: '#111827',
    }
  },
  // 间距
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  // 圆角
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
  },
  // 阴影
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  }
}

