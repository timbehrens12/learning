import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal = ({ isOpen, onClose }: SubscriptionModalProps) => {
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
      ctaStyle: 'border border-white/10 hover:bg-white/5 hover:border-white/20',
    },
    pro: {
      name: 'Pro plan',
      monthly: { price: 12, period: '/month' },
      annual: { price: 12, period: '/month', savings: 'Save 17%' },
      features: [
        'Unlimited AI Responses',
        'Unlimited meetings',
        'Access to newest AI models',
        'Priority chat support',
      ],
      cta: 'Upgrade',
      ctaStyle: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-[0_0_30px_rgba(34,197,94,0.4)]',
      popular: true,
    },
    proPlus: {
      name: 'Pro + Undetectability',
      monthly: { price: 42, period: '/month' },
      annual: { price: 42, period: '/month' },
      features: [
        'Everything in Pro',
        'Visnly Undetectability',
        'Invisible to screen share',
      ],
      cta: 'Upgrade',
      ctaStyle: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-[0_0_30px_rgba(239,68,68,0.4)]',
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl my-4 sm:my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6 md:p-10 border-white/10 relative">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                </button>

                {/* Header */}
                <div className="text-center mb-8 md:mb-12">
                  <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
                    Choose Your Plan
                  </h2>
                  <p className="text-sm md:text-base text-gray-400">
                    Start free, upgrade anytime
                  </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-8 md:mb-12">
                  <div className="glass-panel rounded-full p-1.5 inline-flex gap-1.5">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-4 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 ${
                        billingCycle === 'monthly'
                          ? 'bg-white text-black shadow-lg'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      className={`px-4 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 relative ${
                        billingCycle === 'annual'
                          ? 'bg-white text-black shadow-lg'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Annual
                      {billingCycle !== 'annual' && (
                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                          Save 17%
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
                  {/* Starter Plan */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <GlassCard className="p-6 md:p-8 h-full flex flex-col border-white/5 hover:border-white/10 transition-all duration-300 bg-black/40">
                      <div className="mb-4 md:mb-6">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{plans.starter.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400">Perfect for trying out Visnly</p>
                      </div>
                      
                      <div className="mb-4 md:mb-6">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                            ${plans.starter[billingCycle].price}
                          </span>
                          <span className="text-lg md:text-xl text-gray-500 font-normal">
                            {plans.starter[billingCycle].period}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow">
                        {plans.starter.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Check size={12} className="text-green-400 md:w-3 md:h-3" />
                              </div>
                            </div>
                            <span className="text-gray-300 text-xs md:text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button className={`w-full py-3 md:py-4 rounded-xl transition-all duration-300 font-semibold text-xs md:text-sm ${plans.starter.ctaStyle}`}>
                        {plans.starter.cta}
                      </button>
                    </GlassCard>
                  </motion.div>

                  {/* Pro Plan */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    {plans.pro.popular && (
                      <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-2">
                          <Sparkles size={10} className="md:w-3 md:h-3" />
                          Popular
                        </div>
                      </div>
                    )}
                    
                    <GlassCard className="p-6 md:p-8 h-full flex flex-col border-green-500/40 hover:border-green-500/60 transition-all duration-300 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent relative overflow-hidden">
                      <div className="mb-4 md:mb-6 relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl md:text-2xl font-bold text-white">{plans.pro.name}</h3>
                        </div>
                        <p className="text-xs md:text-sm text-gray-400">For serious students</p>
                      </div>
                      
                      <div className="mb-4 md:mb-6 relative z-10">
                        <div className="flex items-baseline gap-2 md:gap-3 mb-2">
                          <span className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                            ${plans.pro[billingCycle].price}
                          </span>
                          <span className="text-lg md:text-xl text-gray-400 font-normal">
                            {plans.pro[billingCycle].period}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow relative z-10">
                        {plans.pro.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-500/30 flex items-center justify-center border border-green-500/50">
                                <Check size={12} className="text-green-400 md:w-3 md:h-3" />
                              </div>
                            </div>
                            <span className="text-white text-xs md:text-sm leading-relaxed font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button className={`w-full py-3 md:py-4 rounded-xl transition-all duration-300 font-semibold text-xs md:text-sm text-white relative z-10 ${plans.pro.ctaStyle}`}>
                        {plans.pro.cta}
                      </button>
                    </GlassCard>
                  </motion.div>

                  {/* Pro + Undetectability */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <GlassCard className="p-6 md:p-8 h-full flex flex-col border-red-500/40 hover:border-red-500/60 transition-all duration-300 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent relative overflow-hidden">
                      <div className="mb-4 md:mb-6 relative z-10">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{plans.proPlus.name}</h3>
                        <p className="text-xs md:text-sm text-gray-400">Maximum stealth</p>
                      </div>
                      
                      <div className="mb-4 md:mb-6 relative z-10">
                        <div className="flex items-baseline gap-2 md:gap-3 mb-2">
                          <span className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                            ${plans.proPlus[billingCycle].price}
                          </span>
                          <span className="text-lg md:text-xl text-gray-400 font-normal">
                            {plans.proPlus[billingCycle].period}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow relative z-10">
                        {plans.proPlus.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-500/30 flex items-center justify-center border border-red-500/50">
                                <Check size={12} className="text-red-400 md:w-3 md:h-3" />
                              </div>
                            </div>
                            <span className="text-white text-xs md:text-sm leading-relaxed font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button className={`w-full py-3 md:py-4 rounded-xl transition-all duration-300 font-semibold text-xs md:text-sm text-white relative z-10 ${plans.proPlus.ctaStyle}`}>
                        {plans.proPlus.cta}
                      </button>
                    </GlassCard>
                  </motion.div>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-col items-center gap-2 md:gap-3 mt-8 md:mt-12">
                  <div className="flex gap-1 text-base md:text-xl text-orange-500">
                    {'★★★★★'.split('').map((star, i) => (
                      <span key={i}>{star}</span>
                    ))}
                  </div>
                  <p className="text-xs md:text-sm text-gray-400">Trusted by 10k users</p>
                </div>

                <div className="text-center mt-6 md:mt-8">
                  <button
                    onClick={onClose}
                    className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
                  >
                    Start with free →
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

