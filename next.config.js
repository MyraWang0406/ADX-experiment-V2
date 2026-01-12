/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // 将 /mock/* 映射到 /_mock/*，保持向后兼容
      {
        source: '/mock/:path*',
        destination: '/_mock/:path*',
      },
    ]
  },
}

module.exports = nextConfig


