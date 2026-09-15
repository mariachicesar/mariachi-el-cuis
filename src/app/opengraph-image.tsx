import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/config/site'

export const alt = siteConfig.name
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Asset doesn't depend on request data — read once at module scope.
const logoData = await readFile(join(process.cwd(), 'src/lib/assets/logo-mark.png'), 'base64')
const logoSrc = `data:image/png;base64,${logoData}`

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
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og requires a raw <img>, not next/image */}
        <img src={logoSrc} width={220} height={220} alt="" />
        <div
          style={{
            marginTop: 16,
            fontSize: 32,
            color: '#D5C4B0',
          }}
        >
          {siteConfig.serviceCountyLabel.en}
        </div>
      </div>
    ),
    { ...size },
  )
}
