// Builds the 1200x630 social preview (Open Graph / Twitter) for the
// Oktober-Fiesta event page: public/events/oktober-fiesta-2026-og.jpg.
// Re-run after replacing src/assets/events/oktober-fiesta-2026/{logo,group}.png:
//   node scripts/build-oktober-fiesta-og.mjs
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// sharp ships with Next (it isn't a direct dependency), so resolve it from there.
const require = createRequire(import.meta.url)
const sharp = createRequire(require.resolve('next/package.json'))('sharp')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const assets = join(root, 'src/assets/events/oktober-fiesta-2026')
const out = join(root, 'public/events/oktober-fiesta-2026-og.jpg')

const W = 1200
const H = 630
const BG = '#15100D'
const FLAGS = ['#E0457B', '#E8B84E', '#1FA59A', '#F0812F', '#8E4FC8']

function papelPicado() {
  const n = 11
  const gap = 12
  const fw = (W - gap * (n + 1)) / n
  let s = `<line x1="0" y1="6" x2="${W}" y2="6" stroke="#6b5a45" stroke-width="2"/>`
  for (let i = 0; i < n; i++) {
    const x = gap + i * (fw + gap)
    const teeth = 6
    const tw = fw / teeth
    let d = `M${x} 8H${x + fw}V62`
    for (let k = teeth; k > 0; k--) d += `L${x + tw * (k - 0.5)} 72L${x + tw * (k - 1)} 62`
    s += `<path d="${d}Z" fill="${FLAGS[i % FLAGS.length]}"/>`
    const cx = x + fw / 2
    s +=
      i % 2 === 0
        ? `<path d="M${cx} 22L${cx + 12} 35L${cx} 48L${cx - 12} 35Z" fill="${BG}"/>`
        : `<circle cx="${cx}" cy="35" r="10" fill="${BG}"/>`
  }
  return s
}

const text = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${papelPicado()}
  <text x="60" y="318" font-family="Impact, Arial Black, Arial" font-size="26" letter-spacing="4" fill="#E8B84E">SÁBADO · SATURDAY · OCT 17</text>
  <text x="60" y="366" font-family="Segoe UI, Arial" font-weight="700" font-size="32" fill="#F6EFE3">Opening the show at</text>
  <text x="56" y="450" font-family="Impact, Arial Black, Arial" font-size="80" fill="#E0457B">OKTOBER-FIESTA</text>
  <text x="60" y="525" font-family="Impact, Arial Black, Arial" font-size="58" fill="#E8B84E">3:15 – 3:45 PM</text>
  <rect x="408" y="482" width="196" height="50" rx="25" fill="#1FA59A"/>
  <text x="506" y="516" text-anchor="middle" font-family="Impact, Arial Black, Arial" font-size="24" letter-spacing="2" fill="${BG}">FREE · GRATIS</text>
  <text x="60" y="590" font-family="Segoe UI, Arial" font-size="24" fill="#F6EFE3" fill-opacity="0.8">Metro Station Square Park · South Pasadena</text>
</svg>`

const logo = await sharp(join(assets, 'logo.png')).resize(190, 190, { fit: 'contain', background: BG }).toBuffer()
const group = await sharp(join(assets, 'group.png'))
  .resize(600, 520, { fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()

await mkdir(dirname(out), { recursive: true })
await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
  .composite([
    { input: group, left: W - 600 - 10, top: H - 520 },
    { input: logo, left: 56, top: 92 },
    { input: Buffer.from(text), left: 0, top: 0 },
  ])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(out)

console.log(`wrote ${out}`)
