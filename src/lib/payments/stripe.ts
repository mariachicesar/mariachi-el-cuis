import 'server-only'
import Stripe from 'stripe'
import { env } from '@/lib/env'

function client(): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY!)
}

export type DepositCheckoutInput = {
  depositUsd: number
  successUrl: string
  cancelUrl: string
  customerEmail: string
  metadata: Record<string, string>
}

export async function createDepositCheckoutSession(
  input: DepositCheckoutInput,
): Promise<{ url: string }> {
  const stripe = client()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    metadata: input.metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(input.depositUsd * 100),
          product_data: { name: 'Mariachi El Cuis — booking deposit' },
        },
      },
    ],
  })
  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return { url: session.url }
}

export function verifyStripeWebhook(payload: string, signature: string): Stripe.Event {
  const stripe = client()
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET!)
}
