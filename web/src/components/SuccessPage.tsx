import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export const SuccessPage = () => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-400 mb-8 text-lg">
            Your credits have been added to your account. You can now use them in the StudyLayer app.
          </p>

          <div className="space-y-4">
            <a
              href="/#pricing"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              Back to Pricing
              <ArrowRight className="w-4 h-4" />
            </a>
            
            <a
              href="/"
              className="inline-block text-gray-400 hover:text-white transition-colors text-sm"
            >
              Return to Home
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

