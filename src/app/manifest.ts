import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'El Cuis',
    description: `Traditional mariachi band serving ${siteConfig.serviceCountyLabel}.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#131315',
    theme_color: '#EFB049',
    icons: [{ src: '/icon', sizes: '32x32', type: 'image/png' }],
  }
}
