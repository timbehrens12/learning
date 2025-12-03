const express = require('express');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side operations
);

// Middleware
app.use(express.json());
app.use(cors());

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful checkout (one-time credit purchases or initial subscriptions)
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  const creditAmount = parseInt(session.metadata?.creditAmount) || 0;

  if (!userId) return;

  if (creditAmount > 0) {
    // Credit purchase
    await supabase.from('credit_purchases').insert({
      user_id: userId,
      stripe_payment_id: session.payment_intent,
      credits_purchased: creditAmount,
      amount_paid: session.amount_total / 100, // Convert from cents
      currency: session.currency
    });

    // Update user credits
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    await supabase
      .from('user_credits')
      .update({
        credits_remaining: (currentCredits?.credits_remaining || 0) + creditAmount,
        stripe_customer_id: session.customer,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

  } else {
    // Subscription checkout completed
    await supabase
      .from('user_credits')
      .update({
        subscription_plan: 'unlimited',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }
}

// Handle successful subscription renewal
async function handleInvoicePaymentSucceeded(invoice) {
  const customerId = invoice.customer;

  // Find user by Stripe customer ID
  const { data: userCredit } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userCredit) {
    // Ensure they still have unlimited plan
    await supabase
      .from('user_credits')
      .update({
        subscription_plan: 'unlimited',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userCredit.user_id);
  }
}

// Handle failed subscription payment
async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { data: userCredit } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userCredit) {
    // Could implement grace period logic here
    // For now, we'll keep unlimited access but log the failure
    console.log(`Payment failed for user ${userCredit.user_id}`);
  }
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const { data: userCredit } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (userCredit) {
    await supabase
      .from('user_credits')
      .update({
        subscription_plan: 'free',
        credits_remaining: 25, // Reset to free tier
        credits_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userCredit.user_id);
  }
}

// Create checkout session for credit purchases
app.post('/api/buy-credits', async (req, res) => {
  const { userId, creditAmount } = req.body;

  try {
    // Get credit pricing (you'd typically store this in a database)
    const creditPricing = {
      50: { price: 499, priceId: process.env.STRIPE_PRICE_50_CREDITS },
      100: { price: 899, priceId: process.env.STRIPE_PRICE_100_CREDITS },
      250: { price: 1999, priceId: process.env.STRIPE_PRICE_250_CREDITS }
    };

    const pricing = creditPricing[creditAmount];
    if (!pricing) {
      return res.status(400).json({ error: 'Invalid credit amount' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: pricing.priceId,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
      metadata: {
        userId,
        creditAmount: creditAmount.toString()
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session for subscriptions
app.post('/api/create-checkout-session', async (req, res) => {
  const { userId, priceId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
      metadata: {
        userId
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Stripe webhook server running on port ${port}`);
});
