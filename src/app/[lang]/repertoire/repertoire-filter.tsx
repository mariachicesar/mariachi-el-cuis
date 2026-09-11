'use client'

import { useMemo, useState } from 'react'

type Song = { title: string; genre: string; composer?: string }

export function RepertoireFilter({
  songs,
  labels,
}: {
  songs: Song[]
  labels: { search: string; results: string }
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return songs
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(n) ||
        s.genre.toLowerCase().includes(n) ||
        s.composer?.toLowerCase().includes(n),
    )
  }, [q, songs])

  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-sm text-on-surface-variant">{labels.search}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-md rounded border border-charcoal-border bg-charcoal-elevated px-4 py-2 text-crema-white focus:border-burnished-gold focus:outline-none"
        />
      </label>
      <p className="mt-2 text-sm text-muted-silver" aria-live="polite">
        {filtered.length} {labels.results}
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <li key={s.title} className="rounded border border-charcoal-border bg-surface-container p-4">
            <span className="block font-semibold text-crema-white">{s.title}</span>
            <span className="block text-sm text-muted-silver">
              {s.genre}
              {s.composer ? ` · ${s.composer}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
