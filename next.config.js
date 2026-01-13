/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // ✅ 关键：next build 才会产出 /out
  images: { unoptimized: true },
  trailingSlash: true,       // ✅ 静态站建议开，路由更稳
}

module.exports = nextConfig
