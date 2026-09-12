import { expect, test, vi } from 'vitest'

const sessionsCreate = vi.fn()
const webhooksConstructEvent = vi.fn()

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      checkout: { sessions: { create: sessionsCreate } },
      webhooks: { constructEvent: webhooksConstructEvent },
    }
  }),
}))

vi.mock('@/lib/env', () => ({
  env: { STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' },
}))

test('createDepositCheckoutSession sends the deposit in cents and returns the session url', async () => {
  const { createDepositCheckoutSession } = await import('./stripe')
  sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session-1' })

  const result = await createDepositCheckoutSession({
    depositUsd: 150,
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    customerEmail: 'a@b.com',
    metadata: { foo: 'bar' },
  })

  expect(result).toEqual({ url: 'https://checkout.stripe.com/session-1' })
  const args = sessionsCreate.mock.calls[0]![0]
  expect(args.line_items[0].price_data.unit_amount).toBe(15000)
  expect(args.metadata).toEqual({ foo: 'bar' })
})

test('createDepositCheckoutSession throws if Stripe returns no url', async () => {
  const { createDepositCheckoutSession } = await import('./stripe')
  sessionsCreate.mockResolvedValue({ url: null })
  await expect(
    createDepositCheckoutSession({
      depositUsd: 50,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: 'a@b.com',
      metadata: {},
    }),
  ).rejects.toThrow('Stripe did not return a checkout URL')
})

test('verifyStripeWebhook delegates to the Stripe SDK', async () => {
  const { verifyStripeWebhook } = await import('./stripe')
  webhooksConstructEvent.mockReturnValue({ type: 'checkout.session.completed' })
  const event = verifyStripeWebhook('{}', 'sig')
  expect(event).toEqual({ type: 'checkout.session.completed' })
  expect(webhooksConstructEvent).toHaveBeenCalledWith('{}', 'sig', 'whsec_x')
})
