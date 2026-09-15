'use server'

import { z } from 'zod'
import { GeocodeConfigurationError, suggestAddresses } from '@/lib/geo/geocode'
import { features } from '@/lib/env'

const inputSchema = z.object({ query: z.string().trim().min(3).max(200) })

export type AddressSuggestionsResult =
  | { ok: true; suggestions: string[] }
  | { ok: false; error: 'validation' | 'not_configured' }

export async function getAddressSuggestionsAction(input: unknown): Promise<AddressSuggestionsResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'validation' }
  if (!features.maps) return { ok: false, error: 'not_configured' }

  try {
    return { ok: true, suggestions: await suggestAddresses(parsed.data.query) }
  } catch (error) {
    if (error instanceof GeocodeConfigurationError) return { ok: false, error: 'not_configured' }
    throw error
  }
}