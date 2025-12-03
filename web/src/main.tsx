import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './lib/supabase'

// Check for OAuth callback immediately on page load (before React)
if (window.location.hash && window.location.hash.includes('access_token')) {
  console.log('=== OAuth callback detected in main.tsx ===');
  console.log('Hash:', window.location.hash.substring(0, 100) + '...');
  
  if (supabase) {
    // Process OAuth callback immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Session found, redirecting to pricing');
        // Clean hash and redirect
        const newUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', newUrl);
        window.location.href = '/#pricing';
      }
    });
  }
}

// Ensure root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// Set background immediately
document.body.style.backgroundColor = '#050505'
document.body.style.margin = '0'
document.body.style.padding = '0'

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
