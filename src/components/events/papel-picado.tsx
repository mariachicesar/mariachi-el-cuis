// Decorative papel picado banner, pure SVG (no image requests). Flags hang
// from a string; each has a zigzag hem and a cut-out diamond or circle that
// shows the page background through it.
const FLAG_COLORS = ['#E0457B', '#E8B84E', '#1FA59A', '#F0812F', '#8E4FC8']
const FLAG_COUNT = 9
const FLAG_W = 88
const GAP = 12
const TOP = 6
const BODY_H = 62
const TEETH = 6

function flagPath(x: number) {
  const tooth = FLAG_W / TEETH
  let d = `M${x} ${TOP}H${x + FLAG_W}V${TOP + BODY_H}`
  for (let i = TEETH; i > 0; i--) {
    d += `L${x + tooth * (i - 0.5)} ${TOP + BODY_H + 10}L${x + tooth * (i - 1)} ${TOP + BODY_H}`
  }
  return `${d}Z`
}

export function PapelPicado({ background }: { background: string }) {
  const width = FLAG_COUNT * FLAG_W + (FLAG_COUNT + 1) * GAP

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} 84`}
      preserveAspectRatio="xMidYMin meet"
      className="block h-auto w-full"
    >
      <line x1="0" y1="5" x2={width} y2="5" stroke="#6b5a45" strokeWidth="2" />
      {Array.from({ length: FLAG_COUNT }, (_, i) => {
        const x = GAP + i * (FLAG_W + GAP)
        const cx = x + FLAG_W / 2
        const cy = TOP + BODY_H / 2 + 2
        return (
          <g key={i}>
            <path d={flagPath(x)} fill={FLAG_COLORS[i % FLAG_COLORS.length]} />
            {i % 2 === 0 ? (
              <path d={`M${cx} ${cy - 13}L${cx + 13} ${cy}L${cx} ${cy + 13}L${cx - 13} ${cy}Z`} fill={background} />
            ) : (
              <circle cx={cx} cy={cy} r="11" fill={background} />
            )}
          </g>
        )
      })}
    </svg>
  )
}
