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
      <GlassCard style={styles.card}>
        <h2 style={styles.title}>Welcome to Visnly</h2>
        <p style={styles.sub}>The invisible advantage.</p>

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

        <button 
          onClick={handleAuth} 
          disabled={loading || !email || !password} 
          style={{
            ...styles.btn,
            opacity: (loading || !email || !password) ? 0.5 : 1,
            cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Loading..." : (isSignUp ? "Create Account" : "Log In")}
        </button>

        <div style={styles.footer}>
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <span onClick={() => setIsSignUp(!isSignUp)} style={styles.link}>
            {isSignUp ? "Log In" : "Sign Up"}
          </span>
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
    width: '400px', 
    padding: '40px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: '24px', 
    fontWeight: 700, 
    marginBottom: '10px',
    color: '#fff'
  },
  sub: { 
    fontSize: '14px', 
    color: '#888', 
    marginBottom: '30px' 
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
  btn: { 
    width: '100%', 
    padding: '12px', 
    background: '#646cff', 
    border: 'none', 
    borderRadius: '8px', 
    color: 'white', 
    fontWeight: 600, 
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'opacity 0.2s, transform 0.1s'
  },
  footer: { 
    marginTop: '20px', 
    fontSize: '12px', 
    color: '#666' 
  },
  link: { 
    color: '#646cff', 
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


