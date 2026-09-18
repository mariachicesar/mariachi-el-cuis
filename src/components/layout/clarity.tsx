'use client'

import { useEffect } from 'react'

// Loads Microsoft Clarity only when a project id is configured. Dynamic import
// keeps the browser-only clarity-js bundle out of the SSR module graph.
export function ClarityScript({ projectId }: { projectId?: string }) {
  useEffect(() => {
    if (!projectId) return
    void import('@microsoft/clarity').then(({ default: Clarity }) => {
      Clarity.init(projectId)
    })
  }, [projectId])
  return null
}
