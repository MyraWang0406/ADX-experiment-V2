/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Cloudflare Pages 静态站点：用 next export 模式产出 out/
  output: 'export',
  trailingSlash: true,

  // 静态导出不支持 Next Image 的在线优化
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
