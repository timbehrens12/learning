import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2, Star, Crown, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from './Navbar';
import { LiquidBackground } from './LiquidBackground';
import { SEO } from './SEO';

export const Pricing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setLoading(null);
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null);
        setLoading(null);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        setLoading(null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleBuy = async (credits: number) => {
    if (!user) {
      setLoading(null);
      navigate('/signin?redirect=pricing');
      return;
    }
    setLoading(credits);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits,
          userId: user.id,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else if (data.sessionId) window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      else throw new Error('No checkout URL received');
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  const mainPackages = [
    {
      name: 'Student Pack',
      credits: 50,
      price: 9.99,
      pricePerCredit: 0.20,
      icon: <Star className="w-6 h-6 text-indigo-400" strokeWidth={1.5} fill="currentColor" />,
      features: ['Week of homework help', 'Perfect for midterms', 'Casual usage'],
      cta: 'Get 50 Credits',
      popular: false,
      badge: 'Best Seller'
    },
    {
      name: 'Power Pack',
      credits: 250,
      price: 34.99,
      pricePerCredit: 0.14,
      icon: <Crown className="w-6 h-6 text-yellow-400" strokeWidth={1.5} fill="currentColor" />,
      features: ['Full semester coverage', 'Best price per credit', 'Priority support'],
      cta: 'Get 250 Credits',
      popular: true,
      badge: 'Best Value'
    },
    {
      name: 'Value Pack',
      credits: 100,
      price: 16.99,
      pricePerCredit: 0.17,
      icon: <BookOpen className="w-6 h-6 text-purple-400" strokeWidth={1.5} fill="currentColor" />,
      features: ['Month of study help', 'Finals week ready', 'Serious study sessions'],
      cta: 'Get 100 Credits',
      popular: false,
    },
  ];

  const microPackages = [
    { credits: 20, price: 4.99, label: "Starter" },
    { credits: 10, price: 2.99, label: "Quick Fix" }
  ];

  return (
    <div className="relative min-h-screen text-white font-sans bg-[#050505] selection:bg-indigo-500/30">
      <SEO
        title="Pricing - Visnly | Simple Credit Packs"
        description="Flexible credit-based pricing for students. Start with 25 free credits. No subscriptions, just pay for what you use."
        keywords="visnly pricing, study credits, pay as you go"
      />
      <LiquidBackground />
      <Navbar />
      
      <section className="pt-32 pb-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">No Subscriptions</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight"
            >
              Pay as you <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">learn.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 max-w-xl mx-auto font-light"
            >
              Credits never expire. Top up when you need them. <br/>
              <span className="text-white font-medium">New accounts get 25 credits free.</span>
            </motion.p>
          </div>

          {/* Main Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 items-start">
            {mainPackages.map((pkg, i) => (
              <motion.div
                key={pkg.credits}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative group ${pkg.popular ? 'md:-mt-4' : ''}`}
              >
                {/* Popular Glow */}
                {pkg.popular && (
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity blur-xl" />
                )}

                <div className={`relative h-full p-8 rounded-3xl border backdrop-blur-xl flex flex-col transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-[#0A0A0A] border-indigo-500/30'
                    : 'bg-black/20 border-white/10 hover:border-white/20'
                }`}>
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      {pkg.badge}
                    </div>
                  )}

                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-300 mb-1">{pkg.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">${pkg.price}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">${pkg.pricePerCredit.toFixed(2)} / credit</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${pkg.popular ? 'bg-indigo-500/10' : 'bg-white/5'}`}>
                      {pkg.icon}
                    </div>
                  </div>

                  <div className="flex-grow space-y-4 mb-8">
                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                      {pkg.credits} <span className="text-sm font-normal text-gray-500">credits</span>
                    </div>
                    <div className="space-y-3">
                      {pkg.features.map((feat, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm text-gray-400">
                          <Check className={`w-4 h-4 ${pkg.popular ? 'text-indigo-400' : 'text-gray-600'}`} strokeWidth={2} />
                          {feat}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(pkg.credits)}
                    disabled={loading !== null}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      pkg.popular
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {loading === pkg.credits ? <Loader2 className="w-4 h-4 animate-spin" /> : pkg.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Micro Packages */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-center text-sm font-medium text-gray-500 mb-6 uppercase tracking-wider">Micro Packs</h3>
            <div className="grid grid-cols-2 gap-4">
              {microPackages.map((pkg) => (
                <button
                  key={pkg.credits}
                  onClick={() => handleBuy(pkg.credits)}
                  disabled={loading !== null}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                >
                  <div className="text-left">
                    <div className="font-medium text-white">{pkg.label}</div>
                    <div className="text-sm text-gray-500">{pkg.credits} credits</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">${pkg.price}</div>
                    <div className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">Buy &rarr;</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
