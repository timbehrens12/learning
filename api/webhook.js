// Vercel serverless function for Stripe webhooks
// This file should be in: /api/webhook.js (Vercel automatically routes /api/* to serverless functions)

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to handle checkout completion
async function handleCheckoutCompleted(session) {
  const customerId = session.customer;
  const amountTotal = session.amount_total / 100; // Convert from cents to dollars
  const metadata = session.metadata || {};

  // Find user by Stripe customer ID
  const { data: users, error: userError } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !users) {
    console.error('User not found for Stripe customer:', customerId, userError);
    return;
  }

  const userId = users.user_id;

  // Determine credits based on price ID
  let creditsToAdd = 0;
  const priceId = session.line_items?.data[0]?.price?.id || metadata.price_id;

  if (priceId === process.env.STRIPE_PRICE_10_CREDITS) {
    creditsToAdd = 10;
  } else if (priceId === process.env.STRIPE_PRICE_20_CREDITS) {
    creditsToAdd = 20;
  } else if (priceId === process.env.STRIPE_PRICE_50_CREDITS) {
    creditsToAdd = 50;
  } else if (priceId === process.env.STRIPE_PRICE_100_CREDITS) {
    creditsToAdd = 100;
  } else if (priceId === process.env.STRIPE_PRICE_250_CREDITS) {
    creditsToAdd = 250;
  }

  if (creditsToAdd > 0) {
    // Get current credits
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current credits:', fetchError);
      return;
    }

    // Add credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits_remaining: (currentCredits.credits_remaining || 0) + creditsToAdd,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return;
    }

    // Log the purchase
    await supabase.from('credit_purchases').insert({
      user_id: userId,
      stripe_payment_id: session.id,
      credits_purchased: creditsToAdd,
      amount_paid: amountTotal,
      currency: 'usd'
    });

    console.log(`Added ${creditsToAdd} credits to user ${userId}`);
  }
}

// Helper function to handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;

  // Find user by Stripe customer ID
  const { data: users, error: userError } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userError || !users) {
    console.error('User not found for Stripe customer:', customerId, userError);
    return;
  }

  const userId = users.user_id;

  // Update subscription status
  if (priceId === process.env.STRIPE_PRICE_PRO_SUBSCRIPTION) {
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        subscription_plan: status === 'active' ? 'unlimited' : 'free',
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
    }
  }
}

// Main webhook handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Get raw body for webhook verification
  // Vercel provides req.body as a Buffer for webhooks
  const body = req.body;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // For checkout sessions, we need to retrieve the full session
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          { expand: ['line_items'] }
        );
        await handleCheckoutCompleted(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          await handleSubscriptionUpdate(subscription);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
          await handleSubscriptionUpdate(subscription);
        }
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionUpdate(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

