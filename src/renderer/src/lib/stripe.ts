import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const stripeService = {
  // Get Stripe instance
  getStripe: () => stripePromise,

  // Create checkout session for subscription
  async createSubscriptionCheckout(userId: string, priceId: string) {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, priceId })
    });

    const session = await response.json();
    const stripe = await stripePromise;

    if (stripe) {
      await stripe.redirectToCheckout({ sessionId: session.id });
    }
  },

  // Handle successful payment (called from webhook)
  async handlePaymentSuccess(userId: string, subscriptionId: string) {
    // Update user's subscription status in Supabase
    const { error } = await fetch('/api/update-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscriptionId })
    });

    if (error) throw error;
  },

  // Buy credits (one-time purchase)
  async buyCredits(userId: string, creditAmount: number) {
    const response = await fetch('/api/buy-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, creditAmount })
    });

    const session = await response.json();
    const stripe = await stripePromise;

    if (stripe) {
      await stripe.redirectToCheckout({ sessionId: session.id });
    }
  }
};

export default stripeService;
