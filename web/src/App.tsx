import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { LandingPage } from './components/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { AccountPage } from './pages/AccountPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { FAQPage } from './pages/FAQPage';
import { SuccessPage } from './components/SuccessPage';
import { Pricing } from './components/Pricing';
import { LiquidBackground } from './components/LiquidBackground';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token') && supabase) {
      console.log('=== OAuth callback detected in App.tsx ===');
      
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (session) {
          console.log('User signed in via OAuth:', session.user.email);
          
          // Clean up the hash
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', newUrl);
          
          // Check if user was trying to buy credits (redirect=pricing in URL)
          const urlParams = new URLSearchParams(window.location.search);
          const redirectToPricing = urlParams.get('redirect') === 'pricing';
          
          if (redirectToPricing) {
            console.log('Redirecting to pricing after OAuth...');
            navigate('/pricing');
          } else {
            console.log('Redirecting to account after OAuth...');
            navigate('/account');
          }
        } else if (error) {
          console.error('Session error:', error);
          navigate('/signin');
        }
      });
    }
  }, [navigate]);

  // Check if we're on the success page
  const isSuccessPage = location.pathname === '/success' || 
    location.search.includes('success=true');

  if (isSuccessPage) {
    return (
      <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
        <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
        <LiquidBackground />
        <SuccessPage />
                    </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/success" element={
        <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
          <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
          <LiquidBackground />
          <SuccessPage />
        </div>
      } />
    </Routes>
  );
}

export default App;
