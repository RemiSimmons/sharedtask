import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18',
  typescript: true,
})

// Price ID mappings from environment variables
export const PRICE_IDS = {
  basic: {
    monthly: process.env.BASIC_PRICE_ID_MONTHLY,
    yearly: process.env.BASIC_PRICE_ID_YEARLY,
  },
  pro: {
    monthly: process.env.PRO_PRICE_ID_MONTHLY,
    yearly: process.env.PRO_PRICE_ID_YEARLY,
  },
  team: {
    monthly: process.env.TEAM_PRICE_ID_MONTHLY,
    yearly: process.env.TEAM_PRICE_ID_YEARLY,
  },
} as const

export function getPriceId(plan: string, billing: string): string | undefined {
  const planPrices = PRICE_IDS[plan as keyof typeof PRICE_IDS]
  if (!planPrices) return undefined
  
  return planPrices[billing as keyof typeof planPrices]
}

