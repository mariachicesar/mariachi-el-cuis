import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: { formats: ['image/avif', 'image/webp'] },
}

const withMDX = createMDX({})
export default withMDX(nextConfig)
