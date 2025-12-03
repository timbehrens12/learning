import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import OnboardingFlow from './OnboardingFlow';
import Dashboard from './Dashboard';
import Overlay from './Overlay';
import './i18n/config'; // Initialize i18n
import { testEnvironmentVariables } from './test-env';

function App(): JSX.Element {
  // We wrap everything in Router so we can detect the window type
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainFlow />} />
        <Route path="/overlay" element={<Overlay />} />
      </Routes>
    </HashRouter>
  );
}

// Logic for the Main Window (Auth -> Onboarding -> Dashboard)
const MainFlow = () => {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check onboarding status from localStorage and Supabase
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Test environment variables in dev mode
      if (import.meta.env.DEV) {
        testEnvironmentVariables();
      }

      // First check localStorage (fast)
      const localOnboardingComplete = localStorage.getItem('onboarding_complete') === 'true';
      
      if (localOnboardingComplete) {
        setOnboardingComplete(true);
        setLoading(false);
        return;
      }

      // Then check Supabase profile if user is logged in
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();

          // If column doesn't exist yet, error will be thrown - that's okay, we'll use localStorage
          if (!error && profile?.onboarding_complete) {
            setOnboardingComplete(true);
            localStorage.setItem('onboarding_complete', 'true');
          }
        }
      } catch (error) {
        // Column might not exist yet - that's fine, we'll use localStorage only
        console.log('Onboarding status check:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();

    // Listen for custom protocol OAuth callbacks
    const handleOAuthCallback = async (hashOrParams: string) => {
      console.log('Received OAuth callback:', hashOrParams);
      try {
        // The hashOrParams might be "access_token=...&..." or a full URL string
        // If it comes from visnly://auth/callback?code=... it might be passed as just the query part or part of URL
        
        // Handle PKCE code flow
        let code: string | null = null;
        
        if (hashOrParams.includes('code=')) {
          const params = new URLSearchParams(hashOrParams.replace(/^.*\?/, ''));
          code = params.get('code');
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          console.log('Session exchanged successfully');
        } else {
          // Fallback to implicit flow (fragments) if used, though PKCE is default now
          // Just calling getSession might work if the cookie was somehow set, but unlikely across apps
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
      }
    };

    const removeListener = window.electron.ipcRenderer.on('oauth-callback', (hash: string) => {
      handleOAuthCallback(hash);
    });

    // Listen for auth changes (including OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // ... profile creation logic ...
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
             const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                onboarding_complete: false
              });
             if (insertError) console.error('Error creating profile:', insertError);
          }

          // Initialize user_credits if it doesn't exist (trigger should handle this, but ensure it exists)
          const { data: existingCredits, error: creditsError } = await supabase
            .from('user_credits')
            .select('credits_remaining')
            .eq('user_id', session.user.id)
            .single();

          if (creditsError && creditsError.code === 'PGRST116') {
            // No record exists, create it (trigger should handle this, but backup)
            await supabase
              .from('user_credits')
              .upsert({
                user_id: session.user.id,
                credits_remaining: 25, // Free starter credits
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });
          }

          // Claim pending credits for this user's email
          if (session.user.email) {
            try {
              const { data: pendingCredits, error: pendingError } = await supabase
                .from('pending_credits')
                .select('*')
                .eq('email', session.user.email)
                .eq('claimed', false);

              if (!pendingError && pendingCredits && pendingCredits.length > 0) {
                let totalCredits = 0;
                for (const pending of pendingCredits) {
                  totalCredits += pending.credits_amount;
                }

                // Get current credits
                const { data: userCredits } = await supabase
                  .from('user_credits')
                  .select('credits_remaining, stripe_customer_id')
                  .eq('user_id', session.user.id)
                  .single();

                const currentCredits = userCredits?.credits_remaining || 25;
                const stripeCustomerId = userCredits?.stripe_customer_id || pendingCredits[0]?.stripe_customer_id;

                // Update credits
                const { error: updateError } = await supabase
                  .from('user_credits')
                  .upsert({
                    user_id: session.user.id,
                    credits_remaining: currentCredits + totalCredits,
                    subscription_plan: 'free',
                    stripe_customer_id: stripeCustomerId || null
                  }, { onConflict: 'user_id' });

                if (!updateError) {
                  // Mark pending credits as claimed
                  for (const pending of pendingCredits) {
                    await supabase
                      .from('pending_credits')
                      .update({
                        claimed: true,
                        claimed_by_user_id: session.user.id,
                        claimed_at: new Date().toISOString()
                      })
                      .eq('id', pending.id);
                  }
                  console.log(`Claimed ${totalCredits} pending credits for ${session.user.email}`);
                }
              }
            } catch (e) {
              console.error('Error claiming pending credits:', e);
            }
          }
        } catch (e) { console.error(e); }
      }
      
      // Check onboarding status
      const localOnboardingComplete = localStorage.getItem('onboarding_complete') === 'true';
      if (!localOnboardingComplete && session?.user) {
        try {
           const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();
           if (profile?.onboarding_complete) {
             setOnboardingComplete(true);
             localStorage.setItem('onboarding_complete', 'true');
           }
        } catch (e) { console.error(e); }
      }
    });

    return () => {
      subscription.unsubscribe();
      removeListener();
    };
  }, []);

  // Show loading state while checking session
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#050505',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  // If onboarding is complete, show Dashboard (allows free users to skip auth)
  if (onboardingComplete) {
    return <Dashboard />;
  }

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    // Save to localStorage immediately
    localStorage.setItem('onboarding_complete', 'true');
    setOnboardingComplete(true);

    // Also save to Supabase profile if user is logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', session.user.id);
        
        if (error) {
          console.log('Note: onboarding_complete column may not exist yet. Run ADD_ONBOARDING_COLUMN.sql in Supabase.');
        }
      }
    } catch (error) {
      // Column might not exist yet - that's fine, localStorage is enough
      console.log('Onboarding status save:', error);
    }
  };

  // Otherwise, show Onboarding (which handles auth)
  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
};

export default App;

