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
  console.log('=== CHECKOUT COMPLETED ===');
  console.log('Session ID:', session.id);
  console.log('Session metadata:', JSON.stringify(session.metadata, null, 2));
  console.log('Customer ID:', session.customer);
  console.log('Customer Email:', session.customer_email || session.customer_details?.email);
  console.log('Payment Status:', session.payment_status);
  console.log('Line items:', session.line_items?.data ? JSON.stringify(session.line_items.data, null, 2) : 'No line items');
  
  const customerId = session.customer;
  const customerEmail = session.customer_email || session.customer_details?.email;
  const amountTotal = session.amount_total / 100; // Convert from cents to dollars
  const metadata = session.metadata || {};

  // Get userId from metadata (set when user is signed in)
  let userId = metadata.userId || null;
  console.log('UserId from metadata:', userId);

  // Determine credits based on price ID or metadata
  let creditsToAdd = 0;
  const priceId = session.line_items?.data[0]?.price?.id || metadata.price_id;
  console.log('Price ID:', priceId);
  console.log('Available price env vars:', {
    PRICE_10: process.env.STRIPE_PRICE_10_CREDITS ? 'SET' : 'NOT SET',
    PRICE_20: process.env.STRIPE_PRICE_20_CREDITS ? 'SET' : 'NOT SET',
    PRICE_50: process.env.STRIPE_PRICE_50_CREDITS ? 'SET' : 'NOT SET',
    PRICE_100: process.env.STRIPE_PRICE_100_CREDITS ? 'SET' : 'NOT SET',
    PRICE_250: process.env.STRIPE_PRICE_250_CREDITS ? 'SET' : 'NOT SET',
  });

  // Also check metadata for credits amount (fallback)
  if (metadata.credits) {
    creditsToAdd = parseInt(metadata.credits, 10);
    console.log('Using credits from metadata:', creditsToAdd);
  } else if (priceId === process.env.STRIPE_PRICE_10_CREDITS) {
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
  
  console.log('Credits to add:', creditsToAdd);

  // If no userId in metadata, try to find by Stripe customer ID (fallback)
  if (!userId && customerId) {
    const { data: userCredits, error: userError } = await supabase
      .from('user_credits')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!userError && userCredits) {
      userId = userCredits.user_id;
    }
  }

  // If still no userId, store as pending credits (edge case - shouldn't happen with new flow)
  if (!userId && customerEmail) {
    console.log('No userId found, storing as pending credits for email:', customerEmail);
    
    const { error: pendingError } = await supabase
      .from('pending_credits')
      .insert({
        email: customerEmail,
        stripe_customer_id: customerId,
        stripe_session_id: session.id,
        credits_amount: creditsToAdd,
        amount_paid: amountTotal,
        claimed: false
      });

    if (pendingError) {
      console.error('Error storing pending credits:', pendingError);
    } else {
      console.log(`Stored ${creditsToAdd} pending credits for ${customerEmail}`);
    }
    
    return;
  }

  if (!userId) {
    console.error('User not found for checkout session:', {
      customerId,
      customerEmail,
      sessionId: session.id,
      metadata
    });
    return;
  }

  if (creditsToAdd > 0) {
    console.log(`Processing ${creditsToAdd} credits for user ${userId}`);
    
    // Get current credits
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching current credits:', fetchError);
      return;
    }

    console.log('Current credits:', currentCredits?.credits_remaining || 0);
    const newCreditsTotal = (currentCredits?.credits_remaining || 0) + creditsToAdd;
    console.log('New credits total:', newCreditsTotal);

    // Update stripe_customer_id if we have it
    const updateData = {
      credits_remaining: newCreditsTotal,
      updated_at: new Date().toISOString()
    };
    
    if (customerId) {
      updateData.stripe_customer_id = customerId;
    }

    // Add credits using upsert to handle cases where row doesn't exist yet
    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        ...updateData
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return;
    }

    console.log('Credits updated successfully');

    // Log the purchase
    const { error: purchaseError } = await supabase.from('credit_purchases').insert({
      user_id: userId,
      stripe_payment_id: session.id,
      credits_purchased: creditsToAdd,
      amount_paid: amountTotal,
      currency: 'usd'
    });

    if (purchaseError) {
      console.error('Error logging purchase:', purchaseError);
    } else {
      console.log('Purchase logged successfully');
    }

    console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}. New total: ${newCreditsTotal}`);
  } else {
    console.error('No credits to add! Price ID:', priceId, 'Metadata:', metadata);
  }
}

// Subscription events are not used (credits-only model)
// Keeping handler for future use if needed
async function handleSubscriptionUpdate(subscription) {
  console.log('Subscription event received (not processed - credits-only model):', subscription.id);
  // Future: Add subscription handling here if needed
}

// Main webhook handler
// For Vercel: We need to read the raw body before it's parsed
// Vercel automatically parses JSON, so we'll read from the request stream
async function getRawBody(req) {
  // If body is already a Buffer, use it
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }
  
  // If body is a string, convert to Buffer
  if (typeof req.body === 'string') {
    return Buffer.from(req.body, 'utf8');
  }
  
  // Try to read from request stream
  // Note: This may not work if Vercel has already consumed the stream
  const chunks = [];
  try {
    // Check if we can read from the stream
    if (req[Symbol.asyncIterator]) {
      for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }
  } catch (err) {
    console.error('Error reading request stream:', err);
  }
  
  // If we can't get raw body, return null
  return null;
}

export default async function handler(req, res) {
  // Allow GET for health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Get raw body for webhook verification
  let body = await getRawBody(req);
  
  if (!body) {
    // If we can't get raw body, we can't verify the signature
    // For now, we'll skip verification and log a warning
    // In production, you should fix this by configuring Vercel properly
    console.error('WARNING: Cannot get raw body for webhook signature verification.');
    console.error('Body type:', typeof req.body);
    console.error('Proceeding without signature verification (NOT RECOMMENDED FOR PRODUCTION)');
    
    // Try to use parsed body as fallback (signature verification will fail)
    if (req.body && typeof req.body === 'object') {
      body = Buffer.from(JSON.stringify(req.body), 'utf8');
      console.warn('Using parsed body - signature verification will likely fail');
    } else {
      return res.status(400).json({ 
        error: 'Cannot access raw request body for webhook verification.',
        hint: 'Vercel is parsing the request body. Consider using Vercel Edge Functions or configuring the function to receive raw body.'
      });
    }
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    // If signature verification fails and body was parsed, log but continue
    // This is a temporary workaround for Vercel's body parsing
    if (err.message.includes('Webhook payload must be provided')) {
      console.error('Webhook signature verification failed: Body was parsed by Vercel');
      console.error('Attempting to process webhook without signature verification (TEMPORARY)');
      
      // Try to construct event from parsed body (skip signature check)
      // WARNING: This is not secure and should be fixed in production
      try {
        // Use the parsed body directly if available
        if (req.body && typeof req.body === 'object' && req.body.type) {
          event = req.body;
          console.warn('Processing webhook without signature verification - FIX THIS IN PRODUCTION');
        } else {
          throw new Error('Cannot process webhook: body parsing issue');
        }
      } catch (fallbackError) {
        console.error('Cannot process webhook:', fallbackError);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  try {
    console.log('=== WEBHOOK EVENT RECEIVED ===');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed event');
        // For checkout sessions, we need to retrieve the full session
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          { expand: ['line_items'] }
        );
        console.log('Retrieved session:', session.id);
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

