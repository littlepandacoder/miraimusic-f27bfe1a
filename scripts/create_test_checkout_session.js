#!/usr/bin/env node
// Quick test script to create a Stripe Checkout session using the server .env.local STRIPE_SECRET_KEY
import('dotenv/config');
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}
const stripe = (await import('stripe')).default(stripeKey);

async function run() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Miraimusic Portal Access' },
            unit_amount: 2900,
            recurring: { interval: 'month' }
          },
          quantity: 1
        }
      ],
      success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/cancel'
    });
    console.log('SESSION_URL:', session.url);
  } catch (err) {
    console.error('Failed to create checkout session:', err.message || err);
    process.exit(1);
  }
}

run();
