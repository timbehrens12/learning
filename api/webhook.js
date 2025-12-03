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
  // Vercel may parse JSON bodies automatically, so we need to read the raw body
  let body;
  
  // Try multiple methods to get the raw body
  if (req.body instanceof Buffer) {
    // Already a Buffer - perfect
    body = req.body;
  } else if (typeof req.body === 'string') {
    // String - convert to Buffer
    body = Buffer.from(req.body, 'utf8');
  } else if (req.rawBody) {
    // Some setups provide rawBody
    body = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody, 'utf8');
  } else {
    // Body was parsed as JSON - we need to reconstruct it
    // This is not ideal but sometimes necessary with Vercel
    // Note: This will fail signature verification, so we'll need to skip it
    console.error('ERROR: Body was parsed as JSON object.');
    console.error('Body type:', typeof req.body);
    console.error('Attempting to read raw body from request...');
    
    // Try to read from request stream (may not work if already consumed)
    try {
      const chunks = [];
      // Check if req is a stream
      if (req.readable) {
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
      } else {
        // Can't get raw body - return error
        return res.status(400).json({ 
          error: 'Cannot verify webhook signature: body was parsed as JSON.',
          hint: 'Vercel is auto-parsing the request body. The webhook endpoint needs raw body access.'
        });
      }
    } catch (streamError) {
      console.error('Failed to read request stream:', streamError);
      return res.status(400).json({ 
        error: 'Cannot verify webhook signature: unable to access raw body.',
        hint: 'Contact support or check Vercel function configuration.'
      });
    }
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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

