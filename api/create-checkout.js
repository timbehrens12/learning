// Vercel serverless function to create Stripe checkout sessions
let Stripe;
let stripe;

try {
  Stripe = require('stripe');
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} catch (err) {
  console.error('Failed to initialize Stripe:', err);
}

// Map credit amounts to price IDs
const PRICE_ID_MAP = {
  10: process.env.STRIPE_PRICE_10_CREDITS,
  20: process.env.STRIPE_PRICE_20_CREDITS,
  50: process.env.STRIPE_PRICE_50_CREDITS,
  100: process.env.STRIPE_PRICE_100_CREDITS,
  250: process.env.STRIPE_PRICE_250_CREDITS,
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Stripe is initialized
  if (!stripe) {
    console.error('Stripe not initialized. Check STRIPE_SECRET_KEY environment variable.');
    return res.status(500).json({ 
      error: 'Payment service not configured. Please contact support.' 
    });
  }

  try {
    const { credits, successUrl, cancelUrl } = req.body;

    if (!credits) {
      return res.status(400).json({ error: 'Credits amount is required' });
    }

    const priceId = PRICE_ID_MAP[credits];
    
    if (!priceId) {
      console.error(`No price ID found for ${credits} credits. Available:`, Object.keys(PRICE_ID_MAP));
      return res.status(400).json({ 
        error: `Invalid credit amount: ${credits}. Available: 10, 20, 50, 100, 250` 
      });
    }

    const origin = req.headers.origin || req.headers.host ? `https://${req.headers.host}` : 'https://your-site.vercel.app';

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
      success_url: successUrl || `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/#pricing`,
      metadata: {
        credits: credits.toString(),
      },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

