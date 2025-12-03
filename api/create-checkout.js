// Vercel serverless function to create Stripe checkout sessions
const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map credit amounts to price IDs
const PRICE_ID_MAP = {
  10: process.env.STRIPE_PRICE_10_CREDITS,
  20: process.env.STRIPE_PRICE_20_CREDITS,
  50: process.env.STRIPE_PRICE_50_CREDITS,
  100: process.env.STRIPE_PRICE_100_CREDITS,
  250: process.env.STRIPE_PRICE_250_CREDITS,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credits, successUrl, cancelUrl } = req.body;

    if (!credits || !PRICE_ID_MAP[credits]) {
      return res.status(400).json({ error: 'Invalid credit amount' });
    }

    const priceId = PRICE_ID_MAP[credits];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing`,
      metadata: {
        credits: credits.toString(),
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}

