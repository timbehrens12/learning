import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LiquidBackground from './components/LiquidBackground';
import { UserIcon, CheckIcon } from './components/Icons';

// --- TYPES ---
interface OnboardingProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete }) => {
  // --- STATE ---
  const [step, setStep] = useState(0);
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // --- ACTIONS ---
  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  }, [step]);

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'visnly://auth/callback',
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
      if (data?.url) {
        await window.electron.openExternal(data.url);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthLoading(false);
    }
  };

  // --- SLIDE RENDERERS ---

  // Slide 1: Welcome
  const renderSlide1 = () => (
    <div style={styles.centerContent}>
      <div style={styles.logoBadge}>S</div>
      <h1 style={styles.title}>StudyLayer</h1>
      <p style={styles.subtitle}>The invisible AI layer for your studies.</p>
      <button onClick={handleNext} style={styles.primaryBtn}>
        Get Started
      </button>
      <div style={styles.legalRow}>
        <span style={styles.legalText}>By continuing, you agree to our Terms & Privacy Policy.</span>
      </div>
    </div>
  );

  // Slide 2: Education
  const renderSlide2 = () => (
    <div style={styles.centerContent}>
      <h2 style={styles.heading}>What are you studying?</h2>
      <div style={styles.chipGrid}>
        {['High School', 'University', 'Bootcamp', 'Self-Taught', 'Masters/PhD'].map((level) => (
          <button
            key={level}
            onClick={() => setEducationLevel(level)}
            style={{
              ...styles.chip,
              ...(educationLevel === level ? styles.chipActive : {})
            }}
          >
            {level}
          </button>
        ))}
      </div>
      <button 
        onClick={handleNext} 
        disabled={!educationLevel}
        style={{...styles.primaryBtn, marginTop: '40px', opacity: educationLevel ? 1 : 0.5}}
      >
        Continue
      </button>
    </div>
  );

  // Slide 3: Auth
  const renderSlide3 = () => (
    <div style={styles.centerContent}>
      <h2 style={styles.heading}>Save your progress</h2>
      <p style={styles.text}>Create an account to sync your sessions and history.</p>
      
      <button onClick={handleGoogleAuth} disabled={authLoading} style={styles.googleBtn}>
        {authLoading ? "Connecting..." : "Continue with Google"}
      </button>
      
      <button onClick={handleNext} style={styles.skipBtn}>
        Skip for now
      </button>
    </div>
  );

  // Slide 4: Pro / Complete
  const renderSlide4 = () => (
    <div style={styles.centerContent}>
      <div style={styles.proBadge}>PRO</div>
      <h2 style={styles.heading}>Unlock Full Power</h2>
      <div style={styles.featureList}>
        <div style={styles.featureItem}><CheckIcon color="#4caf50" size={18}/> Unlimited AI Requests</div>
        <div style={styles.featureItem}><CheckIcon color="#4caf50" size={18}/> Advanced "Solve" Mode</div>
        <div style={styles.featureItem}><CheckIcon color="#4caf50" size={18}/> Invisible Overlay</div>
      </div>
      
      <div style={styles.pricingCard}>
        <div style={styles.price}>$9.99<span style={styles.month}>/mo</span></div>
        <button onClick={onComplete} style={styles.upgradeBtn}>Upgrade to Pro</button>
      </div>

      <button onClick={onComplete} style={styles.skipBtn}>
        Start with Free Plan
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <LiquidBackground />
      <div style={styles.contentWrapper}>
        {step > 0 && (
          <button onClick={handleBack} style={styles.backBtn}>← Back</button>
        )}
        
        {step === 0 && renderSlide1()}
        {step === 1 && renderSlide2()}
        {step === 2 && renderSlide3()}
        {step === 3 && renderSlide4()}
        
        <div style={styles.progressDots}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              ...styles.dot,
              backgroundColor: i === step ? '#fff' : 'rgba(255,255,255,0.2)'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw', height: '100vh', backgroundColor: '#050505', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif',
    overflow: 'hidden', position: 'relative'
  },
  contentWrapper: {
    zIndex: 10, width: '100%', maxWidth: '500px', padding: '40px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '400px'
  },
  centerContent: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', textAlign: 'center',
    animation: 'fadeIn 0.5s ease-out'
  },
  backBtn: {
    position: 'absolute', top: '40px', left: '40px', background: 'none', border: 'none',
    color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: 500
  },
  
  logoBadge: {
    width: '64px', height: '64px', borderRadius: '20px', background: '#646cff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800,
    marginBottom: '24px', boxShadow: '0 10px 40px rgba(100,108,255,0.4)'
  },
  title: { fontSize: '42px', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-1px' },
  subtitle: { fontSize: '18px', color: '#888', margin: '0 0 40px 0', fontWeight: 400 },
  heading: { fontSize: '32px', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.5px' },
  text: { fontSize: '16px', color: '#888', marginBottom: '32px', lineHeight: '1.5' },
  
  primaryBtn: {
    padding: '14px 48px', fontSize: '16px', fontWeight: 600, background: '#fff', color: '#000',
    border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s',
    boxShadow: '0 4px 20px rgba(255,255,255,0.15)'
  },
  
  legalRow: { marginTop: '24px' },
  legalText: { fontSize: '12px', color: '#444' },
  
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' },
  chip: {
    padding: '10px 20px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', cursor: 'pointer',
    fontSize: '14px', transition: '0.2s'
  },
  chipActive: {
    background: 'rgba(100,108,255,0.2)', border: '1px solid #646cff', color: '#fff'
  },
  
  googleBtn: {
    padding: '12px 32px', background: '#fff', color: '#000', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '16px'
  },
  skipBtn: {
    background: 'none', border: 'none', color: '#666', fontSize: '14px', cursor: 'pointer', marginTop: '16px',
    textDecoration: 'underline'
  },
  
  proBadge: {
    fontSize: '12px', fontWeight: 800, color: '#646cff', background: 'rgba(100,108,255,0.1)',
    padding: '4px 10px', borderRadius: '6px', marginBottom: '16px', letterSpacing: '1px'
  },
  featureList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', alignItems: 'flex-start' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#eee' },
  
  pricingCard: {
    padding: '24px', background: 'linear-gradient(135deg, rgba(100,108,255,0.15), rgba(100,108,255,0.05))',
    borderRadius: '16px', border: '1px solid rgba(100,108,255,0.3)', width: '100%', marginBottom: '16px'
  },
  price: { fontSize: '32px', fontWeight: 700, marginBottom: '16px' },
  month: { fontSize: '14px', fontWeight: 400, color: '#888', marginLeft: '4px' },
  upgradeBtn: {
    width: '100%', padding: '12px', background: '#646cff', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer'
  },
  
  progressDots: {
    position: 'absolute', bottom: '40px', display: 'flex', gap: '8px'
  },
  dot: { width: '8px', height: '8px', borderRadius: '50%', transition: '0.3s' }
};

export default OnboardingFlow;