// Builds the business-card QR codes that point at the /links page:
//   print/qr/links-qr-black.svg   — vector, black on white (send this to the printer)
//   print/qr/links-qr-black.png   — 1500px PNG, black on white
//   print/qr/links-qr-gold.svg    — vector, brand gold on dark (for dark card designs)
//   print/qr/links-qr-gold.png    — 1500px PNG, brand gold on dark
// The code encodes our own URL, so the buttons on /links can change any time
// without reprinting cards. Re-run with: node scripts/build-links-qr.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

// `src=card` lets analytics tell business-card scans apart from other visits.
const URL = 'https://mariachielcuis.com/links?src=card'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'print/qr')

const VARIANTS = {
  black: { dark: '#000000', light: '#FFFFFF' },
  // Inverted (light modules on dark): most phone cameras read it, but the
  // black one is the safe default for print.
  gold: { dark: '#E8B84E', light: '#15100D' },
}

const base = {
  // "Q" (~25% recovery) survives scuffed card stock and small print sizes.
  errorCorrectionLevel: 'Q',
  // The 4-module quiet zone scanners need around the code.
  margin: 4,
}

await mkdir(outDir, { recursive: true })
for (const [name, color] of Object.entries(VARIANTS)) {
  const opts = { ...base, color }
  await writeFile(join(outDir, `links-qr-${name}.svg`), await QRCode.toString(URL, { ...opts, type: 'svg' }))
  await QRCode.toFile(join(outDir, `links-qr-${name}.png`), URL, { ...opts, type: 'png', width: 1500 })
}
console.log(`QR codes for ${URL} written to ${outDir}`)
