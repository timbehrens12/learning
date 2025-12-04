import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Auth callback page for Electron app
 * Detects app=true parameter and redirects to custom protocol
 */
export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const isApp = searchParams.get('app') === 'true';
  const code = searchParams.get('code');

  useEffect(() => {
    const handleCallback = async () => {
      if (isApp && code) {
        // This is an Electron app callback
        console.log('Electron app callback detected, code:', code);
        
        // First, exchange the code for a session in the browser context
        // This ensures the session is set before redirecting
        if (!supabase) {
          console.error('Supabase not available');
          return;
        }
        
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Failed to exchange code:', error);
            document.body.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; text-align: center; padding: 20px;">
                <div>
                  <h2>Sign-in failed</h2>
                  <p>Please try again in the app.</p>
                </div>
              </div>
            `;
            return;
          }
          
          console.log('Session created, redirecting to app...');
          
          // Now redirect to custom protocol with the code
          // The app will also exchange the code, but the session is already set
          const params = new URLSearchParams(window.location.search);
          const appUrl = `visnly://auth/callback?${params.toString()}`;
          
          // Redirect to custom protocol
          window.location.href = appUrl;
          
          // Show message
          document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; text-align: center; padding: 20px; background: #050505; color: white;">
              <div>
                <h2>✅ Signed in successfully!</h2>
                <p>Redirecting to Visnly app...</p>
                <p style="color: #888; font-size: 14px; margin-top: 20px;">
                  If the app doesn't open automatically, please return to the app.<br/>
                  You can close this window.
                </p>
              </div>
            </div>
          `;
        } catch (error) {
          console.error('Error handling callback:', error);
        }
      } else if (code) {
        // Regular web callback - exchange code and redirect
        if (!supabase) {
          window.location.href = '/signin?error=no_supabase';
          return;
        }
        
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Failed to exchange code:', error);
            window.location.href = '/signin?error=callback_failed';
            return;
          }
          // Redirect to account page
          window.location.href = '/account';
        } catch (error) {
          console.error('Error handling web callback:', error);
          window.location.href = '/signin?error=callback_failed';
        }
      }
    };

    handleCallback();
  }, [isApp, code]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui',
      textAlign: 'center',
      background: '#050505',
      color: 'white'
    }}>
      <div>
        <h2>Completing sign-in...</h2>
        <p>Please wait...</p>
      </div>
    </div>
  );
};

