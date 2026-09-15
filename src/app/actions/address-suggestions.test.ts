import { afterEach, expect, test, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ features: { maps: true } }))
vi.mock('@/lib/geo/geocode', () => ({ suggestAddresses: vi.fn() }))

afterEach(() => vi.resetAllMocks())

test('returns suggestions for a valid partial address', async () => {
  const { suggestAddresses } = await import('@/lib/geo/geocode')
  vi.mocked(suggestAddresses).mockResolvedValue(['123 Main St, Los Angeles, CA, USA'])
  const { getAddressSuggestionsAction } = await import('./address-suggestions')

  await expect(getAddressSuggestionsAction({ query: '123 Main' })).resolves.toEqual({
    ok: true,
    suggestions: ['123 Main St, Los Angeles, CA, USA'],
  })
})

test('does not query Maps for an incomplete address', async () => {
  const { suggestAddresses } = await import('@/lib/geo/geocode')
  const { getAddressSuggestionsAction } = await import('./address-suggestions')

  await expect(getAddressSuggestionsAction({ query: '12' })).resolves.toEqual({
    ok: false,
    error: 'validation',
  })
  expect(suggestAddresses).not.toHaveBeenCalled()
})