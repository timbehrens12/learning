import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Pricing = () => {
  const [loading, setLoading] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is signed in
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleBuy = async (credits: number) => {
    // Check if user is signed in
    if (!user) {
      // Redirect to sign in with Google
      if (supabase) {
        const redirectUrl = import.meta.env.VITE_SITE_URL 
          ? `${import.meta.env.VITE_SITE_URL}/success`
          : `${window.location.origin}/success`;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${redirectUrl}?redirect=pricing`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        });

        if (error) {
          alert('Please sign in to purchase credits.');
          return;
        }

        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        alert('Please sign in to purchase credits.');
      }
      return;
    }

    setLoading(credits);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits,
          userId: user.id,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}#pricing`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback: redirect with session ID
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };
  const creditPackages = [
    {
      name: 'Quick Fix',
      credits: 10,
      price: 2.99,
      pricePerCredit: 0.30,
      badge: null,
      features: ['Perfect for one question', 'Instant access', 'No commitment'],
      cta: 'Buy 10 Credits',
      ctaStyle: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
    },
    {
      name: 'Starter',
      credits: 20,
      price: 4.99,
      pricePerCredit: 0.25,
      badge: null,
      features: ['One assignment covered', 'Quick help when needed', 'Flexible usage'],
      cta: 'Buy 20 Credits',
      ctaStyle: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
    },
    {
      name: 'Student Pack',
      credits: 50,
      price: 9.99,
      pricePerCredit: 0.20,
      badge: null,
      features: ['Week of homework help', 'Regular student needs', 'Best for casual use'],
      cta: 'Buy 50 Credits',
      ctaStyle: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
    },
    {
      name: 'Value Pack',
      credits: 100,
      price: 16.99,
      pricePerCredit: 0.17,
      badge: 'Best Value',
      features: ['Month of study help', 'Regular students', '15% savings'],
      cta: 'Buy 100 Credits',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]',
      popular: true,
    },
    {
      name: 'Power Pack',
      credits: 250,
      price: 34.99,
      pricePerCredit: 0.14,
      badge: 'Most Popular',
      features: ['Semester coverage', 'Serious students', '44% savings'],
      cta: 'Buy 250 Credits',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]',
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Pay only for what you use, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">no subscriptions.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Start with 25 free credits. Buy more when you need them. No monthly fees, no commitment.
          </p>
        </motion.div>

        {/* Free Tier Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-12 max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-r from-indigo-900/30 to-cyan-900/30 border border-indigo-500/20 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xl font-bold text-white">Free to Start</h3>
            </div>
            <p className="text-gray-300">Every new account gets <span className="font-bold text-white">25 free credits</span> to try StudyLayer. No credit card required.</p>
          </div>
        </motion.div>

        {/* Credit Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {creditPackages.map((pkg, index) => (
            <motion.div
              key={pkg.credits}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className={`relative group ${pkg.popular ? 'lg:col-span-1' : ''}`}
            >
              {/* Popular Badge */}
              {pkg.badge && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
                  <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-indigo-500/30 border border-indigo-400">
                    {pkg.badge}
                  </div>
                </div>
              )}

              {/* Glow Effect for Popular */}
              {pkg.popular && (
                <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500 to-indigo-500/20 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
              )}
              
              <div className={`relative h-full p-6 rounded-2xl border backdrop-blur-xl flex flex-col transition-all duration-300 ${
                pkg.popular 
                  ? 'border-indigo-500/30 bg-[#0B0B15] hover:border-indigo-400/50' 
                  : 'border-white/10 bg-black/40 hover:border-white/20'
              }`}>
                {/* Background Gradient for Popular */}
                {pkg.popular && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full pointer-events-none" />
                )}
                
                <div className="mb-6 relative z-10">
                  <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-white">${pkg.price}</span>
                    <span className="text-gray-400 text-sm">one-time</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-indigo-400">{pkg.credits}</span>
                    <span className="text-gray-400 text-sm">credits</span>
                  </div>
                  <p className="text-xs text-gray-400">${pkg.pricePerCredit.toFixed(2)} per credit</p>
                </div>

                <div className="flex-grow mb-6 relative z-10">
                  <ul className="space-y-2">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className={`mt-0.5 shrink-0 ${pkg.popular ? 'text-indigo-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${pkg.popular ? 'text-white' : 'text-gray-300'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => handleBuy(pkg.credits)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all relative z-10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${pkg.ctaStyle}`}
                >
                  {loading === pkg.credits ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    pkg.cta
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
