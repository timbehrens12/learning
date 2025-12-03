import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap } from 'lucide-react';

export const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = {
    starter: {
      name: 'Starter',
      monthly: { price: 0, period: 'Forever' },
      annual: { price: 0, period: 'Forever' },
      features: [
        'Basic Transcription',
        '5 Questions / Day',
        'Community Support',
      ],
      cta: 'Get Started',
      ctaStyle: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
      icon: null,
    },
    pro: {
      name: 'Pro Scholar',
      monthly: { price: 9, period: '/mo' },
      annual: { price: 90, period: '/year', savings: 'Save 17%' },
      features: [
        'Unlimited Transcription',
        'Unlimited Auto-Solve',
        'Ghost Mode Enabled',
        'Priority Support',
      ],
      cta: 'Upgrade to Pro',
      ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]',
      popular: true,
      icon: <Sparkles className="w-5 h-5" />,
    },
  };

  return (
    <section id="pricing" className="py-24 md:py-32 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Simple pricing, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">unlimited potential.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Start for free, upgrade when you're ready to dominate your exams.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-16"
        >
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-full p-1.5 inline-flex relative">
            <div
                className={`absolute top-1.5 bottom-1.5 rounded-full bg-indigo-600 transition-all duration-300 ease-out shadow-lg ${
                    billingCycle === 'monthly' ? 'left-1.5 w-[110px]' : 'left-[120px] w-[110px]'
                }`} 
            />
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors z-10 w-[115px] ${
                billingCycle === 'monthly' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors z-10 w-[115px] flex items-center justify-center gap-2 ${
                billingCycle === 'annual' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual
            </button>
            
             {/* Savings Badge - positioned specifically */}
             <div className="absolute -right-24 top-1/2 -translate-y-1/2 hidden sm:block">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-full">
                    Save 17%
                </span>
             </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl -z-10" />
            <div className="h-full p-8 sm:p-10 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl hover:border-white/20 transition-all duration-300 flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plans.starter.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${plans.starter[billingCycle].price}</span>
                  <span className="text-gray-500">/forever</span>
                </div>
                <p className="text-sm text-gray-400 mt-4">Perfect for trying out Visnly without any commitment.</p>
              </div>

              <div className="flex-grow">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Features</div>
                <ul className="space-y-4 mb-8">
                    {plans.starter.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <Check size={18} className="text-gray-500 mt-0.5 shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                    ))}
                </ul>
              </div>

              <button className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${plans.starter.ctaStyle}`}>
                {plans.starter.cta}
              </button>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-indigo-500/30 border border-indigo-400">
                    Most Popular
                </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-b from-indigo-500 to-indigo-500/20 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
            
            <div className="relative h-full p-8 sm:p-10 rounded-3xl border border-indigo-500/30 bg-[#0B0B15] backdrop-blur-xl flex flex-col overflow-hidden">
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="mb-8 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {plans.pro.name}
                        <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                    </h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${plans.pro[billingCycle].price}</span>
                  <span className="text-gray-400">{plans.pro[billingCycle].period}</span>
                </div>
                <p className="text-sm text-indigo-200/70 mt-4">Unlock the full power of the AI. Undetectable & unlimited.</p>
              </div>

              <div className="flex-grow relative z-10">
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">Everything in Starter, plus:</div>
                <ul className="space-y-4 mb-8">
                    {plans.pro.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-indigo-500/20 p-0.5">
                            <Check size={14} className="text-indigo-400 shrink-0" />
                        </div>
                        <span className="text-white text-sm font-medium">{feature}</span>
                    </li>
                    ))}
                </ul>
              </div>

              <button className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all relative z-10 hover:scale-[1.02] active:scale-[0.98] ${plans.pro.ctaStyle}`}>
                {plans.pro.cta}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
