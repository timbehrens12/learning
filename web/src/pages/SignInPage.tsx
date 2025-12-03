import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Navbar } from '../components/Navbar';
import { LiquidBackground } from '../components/LiquidBackground';
import { Loader2 } from 'lucide-react';

export const SignInPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || 'account';

  useEffect(() => {
    // Check if already signed in
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate(redirectTo === 'pricing' ? '/pricing' : '/account');
        }
      });
    }
  }, [navigate, redirectTo]);

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      alert('Authentication not available');
      return;
    }

    setLoading(true);
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    // Redirect to root with query param - App.tsx will handle the OAuth callback
    const redirectUrl = redirectTo === 'pricing' 
      ? `${siteUrl}/?redirect=pricing`
      : `${siteUrl}/account`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('Auth error:', error);
      alert('Failed to sign in. Please try again.');
      setLoading(false);
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
      <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
      <LiquidBackground />
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <Logo size={48} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome to Visnly
          </h1>
          <p className="text-gray-400 mb-8">
            Sign in to access your account and purchase credits
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-base bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
        </motion.div>
      </div>
    </div>
  );
};

