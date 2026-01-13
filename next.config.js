/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1'

const nextConfig = {
  reactStrictMode: true,
  output: isExport ? 'export' : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
}

module.exports = nextConfig
