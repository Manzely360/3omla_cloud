/** @type {import('next').NextConfig} */
// Use a server-side proxy target for rewrites only. Do NOT expose to the browser.
const PROXY_TARGET = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Do not inject NEXT_PUBLIC_API_URL automatically. Client will call relative
  // paths (e.g. "/api/..."), and Next.js will proxy on the server.
  env: {
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? 'true',
  },
  async rewrites() {
    // Proxy all /api/* calls to the backend target
    return [
      {
        source: '/api/:path*',
        destination: `${PROXY_TARGET}/api/:path*`,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
}

module.exports = nextConfig
