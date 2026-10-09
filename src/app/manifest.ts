import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'El Cuis',
    description: `Traditional mariachi band serving ${siteConfig.serviceCountyLabel.en}.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#131315',
    theme_color: '#EFB049',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
