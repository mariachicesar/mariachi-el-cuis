import { expect, test } from 'vitest'
import { PRICING } from '@/lib/data/pricing'

test('deposit constants replace the old flat deposit', () => {
  expect(PRICING.depositPerHour).toBe(50)
  expect(PRICING.rushFlatDeposit).toBe(150)
  expect((PRICING as { deposit?: number }).deposit).toBeUndefined()
})
