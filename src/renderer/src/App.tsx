import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import OnboardingFlow from './OnboardingFlow';
import Dashboard from './Dashboard';
import Overlay from './Overlay';
import LoadingScreen from './components/LoadingScreen';
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

  // Define handleOAuthCallback BEFORE useEffect so it can be used in checkOnboardingStatus
  const handleOAuthCallback = async (callbackUrl: string) => {
    console.log('🔐 Handling OAuth callback:', callbackUrl.substring(0, 100) + '...');
    setLoading(true);
    
    try {
      let code: string | null = null;
      let hashFragment: string | null = null;

      // Extract code or hash from callback URL
      if (callbackUrl.includes('#')) {
        // Hash fragment (e.g., visnly://auth/callback#code=... or #access_token=...)
        const hashMatch = callbackUrl.match(/#(.+)$/);
        if (hashMatch) {
          hashFragment = hashMatch[1];
          const params = new URLSearchParams(hashFragment);
          code = params.get('code');
          
          // If no code but has access_token, this is implicit flow
          if (!code && params.has('access_token')) {
            console.log('🔑 Detected implicit flow (access_token in hash)');
            // Parse tokens from hash
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
              // Set session directly (Supabase will calculate expires_at automatically)
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (error) {
                console.error('❌ Session set error:', error);
                throw error;
              }
              
              console.log('✅ Session set successfully (implicit flow):', data.session?.user?.email);
              
              // CRITICAL: Immediately mark onboarding as complete
              setOnboardingComplete(true);
              localStorage.setItem('onboarding_complete', 'true');
              setLoading(false);
              
              // Notify main process that session is set
              if (window.electron?.ipcRenderer) {
                window.electron.ipcRenderer.send('oauth-session-set');
              }
              
              console.log('✅ Onboarding marked complete - Dashboard should show now');
              return;
            }
          }
        }
      } else if (callbackUrl.includes('visnly://')) {
        // Handle full URL format: visnly://auth/callback?code=...
        try {
          const url = new URL(callbackUrl.replace('visnly://', 'https://'));
          code = url.searchParams.get('code');
        } catch (e) {
          // Fallback: try regex extraction
          const match = callbackUrl.match(/[?&]code=([^&]+)/);
          if (match) {
            code = decodeURIComponent(match[1]);
          }
        }
      } else if (callbackUrl.includes('code=')) {
        // Just the query string
        const match = callbackUrl.match(/[?&]code=([^&]+)/);
        if (match) {
          code = decodeURIComponent(match[1]);
        }
      }

      if (code) {
        console.log('🔑 Extracted code from callback, exchanging for session...');
        // Exchange code for session (PKCE flow)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('❌ Session exchange error:', error);
          throw error;
        }
        console.log('✅ Session exchanged successfully:', data.session?.user?.email);
        
        // CRITICAL: Immediately mark onboarding as complete and force Dashboard to show
        setOnboardingComplete(true);
        localStorage.setItem('onboarding_complete', 'true');
        
        // Force a re-render by updating state
        setLoading(false);
        
        // Notify main process that session is set
        if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.send('oauth-session-set');
        }
        
        console.log('✅ Onboarding marked complete - Dashboard should show now');
      } else {
        console.warn('⚠️ No code or access_token found in OAuth callback. URL:', callbackUrl);
        // Try to check if session was set another way (fallback)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ Session found after callback (fallback)');
          setOnboardingComplete(true);
          localStorage.setItem('onboarding_complete', 'true');
          setLoading(false);
          
          // Notify main process that session is set
          if (window.electron?.ipcRenderer) {
            window.electron.ipcRenderer.send('oauth-session-set');
          }
        } else {
          throw new Error('No authorization code or access token found in callback');
        }
      }
    } catch (error: any) {
      console.error('Error handling OAuth callback:', error);
      alert(`Failed to complete sign-in: ${error?.message || 'Unknown error'}. Please try again.`);
      setLoading(false);
    }
  };

  // Check onboarding status and auth state
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Test environment variables in dev mode
      if (import.meta.env.DEV) {
        testEnvironmentVariables();
      }

      // FIRST: Check for pending OAuth callback in URL query parameters
      // This happens when the website callback page was loaded and we passed it as a query param when reloading
      const urlParams = new URLSearchParams(window.location.search);
      const pendingCallback = urlParams.get('oauth_callback');
      if (pendingCallback) {
        console.log('🔐 Found pending OAuth callback in URL, processing...');
        const decodedCallback = decodeURIComponent(pendingCallback);
        // Remove from URL to avoid reprocessing
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        // Process the callback
        await handleOAuthCallback(decodedCallback);
        // Don't return - continue to check session below
      }

      try {
        // Check for existing session (auto sign-in if already signed in)
        // This will work if user signed in via browser - Supabase sessions are shared
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Session check result:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email,
          error: sessionError 
        });
        
        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          
          // User is signed in - ALWAYS mark onboarding as complete
          // The onboarding is just the sign-in flow, so if they're signed in, they're done
          setOnboardingComplete(true);
          localStorage.setItem('onboarding_complete', 'true');
          
          // Update profile in background (non-blocking)
          (async () => {
            try {
              await supabase
                .from('profiles')
                .update({ onboarding_complete: true })
                .eq('id', session.user.id);
              console.log('✅ Profile updated');
            } catch (e: any) {
              console.log('Profile update (optional):', e);
            }
          })();
        } else {
          // No session - user needs to sign in
          console.log('❌ No session found - user needs to sign in');
          setOnboardingComplete(false);
          localStorage.removeItem('onboarding_complete');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();

    // Only set up IPC listener if electron is available
    let removeListener: (() => void) | null = null;
    if (window.electron?.ipcRenderer) {
      removeListener = window.electron.ipcRenderer.on('oauth-callback', (hash: string) => {
      handleOAuthCallback(hash);
    });
    }

    // Listen for auth changes (including OAuth callbacks and session refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      
      // Handle sign-in events
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        
        // CRITICAL: Mark onboarding complete IMMEDIATELY so Dashboard shows
        console.log('✅ IMMEDIATELY marking onboarding complete - Dashboard should show NOW');
        setOnboardingComplete(true);
        localStorage.setItem('onboarding_complete', 'true');
        setLoading(false);
        
        // Do all the async work in the background (non-blocking)
        (async () => {
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
            const { error: creditsError } = await supabase
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

            // Claim pending credits for this user's email (handle 403 gracefully - RLS might block)
            if (session.user.email) {
              try {
                const { data: pendingCredits, error: pendingError } = await supabase
                  .from('pending_credits')
                  .select('*')
                  .eq('email', session.user.email)
                  .eq('claimed', false);

                // Handle 403/RLS errors gracefully - user might not have permission to read pending_credits
                if (pendingError) {
                  // Check for RLS/permission errors (code 42501 or message contains 403/forbidden)
                  const isPermissionError = pendingError.code === '42501' || 
                    pendingError.message?.toLowerCase().includes('permission') ||
                    pendingError.message?.toLowerCase().includes('forbidden');
                  
                  if (isPermissionError) {
                    // RLS policy blocking access - this is expected for some users, don't log as error
                    console.log('Pending credits check skipped (RLS policy)');
                  } else {
                    console.error('Error checking pending credits:', pendingError);
                  }
                } else if (pendingCredits && pendingCredits.length > 0) {
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
              } catch (e: any) {
                // Only log if it's not an RLS/403 error
                const isPermissionError = e?.code === '42501' || 
                  e?.message?.toLowerCase().includes('permission') ||
                  e?.message?.toLowerCase().includes('forbidden');
                
                if (!isPermissionError) {
                  console.error('Error claiming pending credits:', e);
                }
              }
            }
            } catch (error) {
              console.error('Error during sign-in setup:', error);
            }
          })();
        } else if (event === 'SIGNED_OUT') {
          // User signed out - reset onboarding
          console.log('👋 User signed out');
          localStorage.removeItem('onboarding_complete');
          setOnboardingComplete(false);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Token refreshed');
          setLoading(false);
        }
    });

    return () => {
      subscription.unsubscribe();
      if (removeListener) {
      removeListener();
      }
    };
  }, []);

  // Show loading state while checking session
  if (loading) {
    return <LoadingScreen />;
  }

  // If onboarding is complete, show Dashboard
  // (User must be signed in to complete onboarding)
  if (onboardingComplete) {
    return <Dashboard />;
  }

  // Handle onboarding completion - only allow if user is signed in
  const handleOnboardingComplete = async () => {
    // Verify user is signed in before completing onboarding
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      alert('Please sign in to continue. Sign-in is required to use Visnly.');
      return;
    }

    // Save to localStorage immediately
    localStorage.setItem('onboarding_complete', 'true');
    setOnboardingComplete(true);

    // Also save to Supabase profile
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', session.user.id);
      
      if (error) {
        console.log('Note: onboarding_complete column may not exist yet. Run ADD_ONBOARDING_COLUMN.sql in Supabase.');
      }
    } catch (error) {
      // Column might not exist yet - that's fine, localStorage is enough
      console.log('Onboarding status save:', error);
    }
  };

  // Show Onboarding (which requires sign-in)
  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
};

export default App;

