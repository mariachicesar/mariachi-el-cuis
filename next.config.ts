import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "img-src 'self' data: https://i.ytimg.com https://mariachiassets.s3.us-west-1.amazonaws.com",
      "media-src 'self' https://mariachiassets.s3.us-west-1.amazonaws.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      // news.google.com: Google's preferred-sources publisher library + its dialog.
      "script-src 'self' 'unsafe-inline' https://news.google.com" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
      "connect-src 'self' https://news.google.com https://www.google.com",
      "frame-src https://www.youtube-nocookie.com https://news.google.com",
      "object-src 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

const withMDX = createMDX({})
export default withMDX(nextConfig)
