export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return h * 60 + m
}

export function formatMinutes(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
