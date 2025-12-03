// Vercel serverless function to create Stripe checkout sessions
const Stripe = require('stripe');

// Initialize Stripe inside the handler to ensure env vars are loaded
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is missing. Available env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
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

  try {
    const stripe = getStripe();
    if (!stripe) {
      console.error('Stripe initialization failed. STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET (but may be invalid)' : 'NOT SET');
      return res.status(500).json({ 
        error: 'Payment service not configured. Please contact support.',
        debug: process.env.NODE_ENV === 'development' ? 'STRIPE_SECRET_KEY not found in environment' : undefined
      });
    }

    const { credits, userId, successUrl, cancelUrl } = req.body;

    if (!credits) {
      return res.status(400).json({ error: 'Credits amount is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User must be signed in to purchase credits' });
    }

    const priceId = PRICE_ID_MAP[credits];
    
    if (!priceId) {
      console.error(`No price ID found for ${credits} credits. Available env vars:`, Object.keys(process.env).filter(k => k.startsWith('STRIPE_PRICE')));
      return res.status(400).json({ 
        error: `Invalid credit amount: ${credits}. Available: 10, 20, 50, 100, 250` 
      });
    }

    const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://your-site.vercel.app');

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
        userId: userId,
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

