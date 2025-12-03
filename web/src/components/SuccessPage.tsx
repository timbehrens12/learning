import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const SuccessPage = () => {
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectToPricing, setRedirectToPricing] = useState(false);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    // Check if this is an auth callback (has hash with tokens)
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthHash = window.location.hash.includes('access_token') || window.location.hash.includes('error');
    
    // Check if user was redirected here after sign-in to buy credits
    const shouldRedirectToPricing = urlParams.get('redirect') === 'pricing';
    setRedirectToPricing(shouldRedirectToPricing);
    const isAuthCallback = urlParams.get('auth') === 'success' || hasAuthHash;

    if (isAuthCallback && supabase) {
      setIsAuthSuccess(true);
      
      // Process OAuth callback - Supabase will automatically parse the hash
      const handleAuth = async () => {
        try {
          setIsLoading(true);
          
          // Wait a bit for Supabase to process the hash
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Get session (this will parse the hash if present)
          if (!supabase) {
            setError('Supabase not configured');
            setIsLoading(false);
            return;
          }
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Auth error:', sessionError);
            setError('Failed to sign in. Please try again.');
            setIsLoading(false);
            return;
          }

          if (session) {
            console.log('User signed in:', session.user.email);
            
            // Clean up the URL hash after processing
            if (window.location.hash) {
              const newUrl = window.location.pathname + (window.location.search || '');
              window.history.replaceState(null, '', newUrl);
            }
            
            setIsLoading(false);
            
            // If user was trying to buy credits, redirect to pricing page
            if (shouldRedirectToPricing) {
              setTimeout(() => {
                window.location.href = '/#pricing';
              }, 500);
              return;
            }
          } else {
            // Check if there's an error in the hash
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const errorDescription = hashParams.get('error_description');
            
            if (errorDescription) {
              setError(errorDescription);
              setIsLoading(false);
            } else {
              // Try one more time after a delay
              setTimeout(async () => {
                if (!supabase) {
                  setError('Supabase not configured');
                  setIsLoading(false);
                  return;
                }
                
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                if (retrySession) {
                  console.log('User signed in (retry):', retrySession.user.email);
                  setIsLoading(false);
                  
                  // If user was trying to buy credits, redirect to pricing page
                  if (shouldRedirectToPricing) {
                    setTimeout(() => {
                      window.location.href = '/#pricing';
                    }, 500);
                    return;
                  }
                } else {
                  setError('Session not found. Please try signing in again.');
                  setIsLoading(false);
                }
              }, 1000);
            }
          }
        } catch (err) {
          console.error('Error processing auth callback:', err);
          setError('An error occurred. Please try again.');
          setIsLoading(false);
        }
      };

      handleAuth();
    } else {
      setIsLoading(false);
    }
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

          {isLoading ? (
            <>
              <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Signing you in...
              </h1>
              <p className="text-gray-400 mb-8 text-lg">
                Please wait while we complete your sign-in.
              </p>
            </>
          ) : error ? (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Sign-in Failed
              </h1>
              <p className="text-gray-400 mb-8 text-lg">
                {error}
              </p>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
              >
                Return to Home
                <ArrowRight className="w-4 h-4" />
              </a>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {isAuthSuccess ? 'Account Created!' : 'Payment Successful!'}
              </h1>
              
              <p className="text-gray-400 mb-8 text-lg">
                {isAuthSuccess 
                  ? 'Your account has been created successfully. Download the app to get started with 25 free credits!'
                  : 'Your credits have been added to your account. You can now use them in the StudyLayer app.'}
              </p>
            </>
          )}

          {!isLoading && !error && (
          <div className="space-y-4">
            {isAuthSuccess ? (
              redirectToPricing ? (
                <a
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  Continue to Pricing
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/';
                  }}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  Download App
                  <ArrowRight className="w-4 h-4" />
                </a>
              )
            ) : (
              <a
                href="/#pricing"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
              >
                Back to Pricing
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            
            <a
              href="/"
              className="inline-block text-gray-400 hover:text-white transition-colors text-sm"
            >
              Return to Home
            </a>
          </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

