import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import GlassCard from './GlassCard';

interface AuthProps {
  onLoginSuccess: () => void;
}

const AuthScreen: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      } else {
        // Log In Logic
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess(); // Tell parent app we are in!
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 10px 40px rgba(135, 206, 250, 0.25), inset 0 0 20px rgba(135, 206, 250, 0.15); }
          50% { box-shadow: 0 10px 60px rgba(135, 206, 250, 0.35), inset 0 0 30px rgba(135, 206, 250, 0.25); }
        }
      `}} />
      <GlassCard style={styles.card}>
        <div style={styles.logoBadge}>
          <img 
            src="./logo.png" 
            alt="Visnly" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              // Fallback to text if image not found
              const target = e.currentTarget;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.textContent = 'V';
              }
            }}
          />
        </div>
        <h1 style={styles.title}>Welcome to Visnly</h1>
        <p style={styles.subtitle}>The invisible advantage.</p>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAuth();
              }
            }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAuth();
              }
            }}
          />
        </div>

        <div style={styles.buttonGroup}>
          <button 
            onClick={handleAuth} 
            disabled={loading || !email || !password} 
            style={{
              ...styles.btn,
              ...styles.primaryBtn,
              opacity: (loading || !email || !password) ? 0.5 : 1,
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
          </button>
          
          {!isSignUp && (
            <button
              onClick={() => setIsSignUp(true)}
              style={styles.secondaryBtn}
            >
              Sign Up
            </button>
          )}
        </div>

        <div style={styles.footer}>
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <span onClick={() => setIsSignUp(false)} style={styles.link}>
                Sign In
              </span>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <span onClick={() => setIsSignUp(true)} style={styles.link}>
                Sign Up
              </span>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#050505' 
  },
  card: { 
    width: '100%',
    maxWidth: '500px', 
    padding: '40px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center' 
  },
  logoBadge: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, rgba(135, 206, 250, 0.3) 0%, rgba(135, 206, 250, 0.2) 100%)',
    color: '#fff',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '28px',
    marginBottom: '40px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxShadow: '0 10px 40px rgba(135, 206, 250, 0.25), inset 0 0 20px rgba(135, 206, 250, 0.15)',
    animation: 'logoGlow 3s ease-in-out infinite',
    position: 'relative',
    zIndex: 1
  },
  title: { 
    fontSize: '64px',
    fontWeight: 800,
    marginBottom: '24px',
    letterSpacing: '-2px',
    lineHeight: '1.1',
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(135, 206, 250, 1) 0%, rgba(135, 206, 250, 0.8) 50%, rgba(135, 206, 250, 0.6) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '100%',
    textShadow: '0 0 40px rgba(135, 206, 250, 0.3)'
  },
  subtitle: { 
    fontSize: '20px',
    color: '#aaa',
    lineHeight: '1.6',
    marginBottom: '48px',
    textAlign: 'center',
    fontWeight: 400,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '100%',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  inputGroup: { 
    width: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px', 
    marginBottom: '25px' 
  },
  input: { 
    width: '100%', 
    padding: '12px', 
    background: 'rgba(0,0,0,0.3)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '8px', 
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  buttonGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  btn: { 
    width: '100%', 
    padding: '14px', 
    border: 'none', 
    borderRadius: '8px', 
    color: 'white', 
    fontWeight: 600, 
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.2s',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  primaryBtn: {
    background: 'rgba(135, 206, 250, 0.8)',
    boxShadow: '0 4px 12px rgba(135, 206, 250, 0.3)'
  },
  secondaryBtn: {
    background: 'transparent',
    border: '1px solid rgba(135, 206, 250, 0.3)',
    color: 'rgba(135, 206, 250, 0.9)',
    padding: '12px'
  },
  footer: { 
    marginTop: '20px', 
    fontSize: '12px', 
    color: '#666' 
  },
  link: { 
    color: 'rgba(135, 206, 250, 0.9)', 
    cursor: 'pointer', 
    textDecoration: 'underline' 
  },
  error: { 
    color: '#ff5252', 
    fontSize: '12px', 
    marginBottom: '15px',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    width: '100%',
    textAlign: 'center'
  }
};

export default AuthScreen;


