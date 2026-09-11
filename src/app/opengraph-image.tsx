import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/config/site'

export const alt = siteConfig.name
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#131315',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#EFB049',
            letterSpacing: -1,
          }}
        >
          Mariachi El Cuis
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: '#D5C4B0',
          }}
        >
          {siteConfig.serviceCountyLabel}
        </div>
      </div>
    ),
    { ...size },
  )
}
