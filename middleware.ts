import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 不处理静态资源、Next.js 内部路由和 API 路由
  const pathname = request.nextUrl.pathname
  
  // 【防御性】确保 pathname 是字符串
  if (!pathname || typeof pathname !== 'string') {
    return NextResponse.next()
  }
  
  // 【优先级最高】排除静态资源和 Next.js 内部路由
  // 注意：这些路径必须完全跳过 middleware 处理，直接返回
  // 特别处理：/_mock 和 /mock 路径必须完全排除，确保静态文件可访问
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_mock') ||  // 注意：不包含尾部斜杠，匹配 /_mock 和 /_mock/ 及所有子路径
    pathname.startsWith('/mock/') ||  // 兼容旧路径 /mock/*，会被 rewrites 映射到 /_mock/*
    pathname.startsWith('/static/') ||
    pathname.includes('.') // 排除文件请求（如 .js, .css, .png 等）
  ) {
    return NextResponse.next()
  }
  
  // 其他路由正常处理
  return NextResponse.next()
}

// matcher 配置：只匹配页面路由，排除静态资源和 API
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _mock (mock data files) - 完全排除，包括所有子路径
     * - favicon.ico (favicon file)
     * - 静态文件扩展名 (.js, .css, .png, .jpg, etc.)
     * 
     * 注意：使用负向前瞻断言排除这些路径
     */
    '/((?!api|_next|_mock|mock|favicon\\.ico|.*\\..*).*)',
  ],
}


