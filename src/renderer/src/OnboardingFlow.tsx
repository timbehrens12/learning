import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LiquidBackground from './components/LiquidBackground';
import * as Icons from './components/Icons';

// --- TYPES ---
interface OnboardingProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete }) => {
  // --- STATE ---
  const [step, setStep] = useState(0);
  const [educationLevel, setEducationLevel] = useState<string | null>(null);
  const [referralSource, setReferralSource] = useState<string | null>(null);
  const [stealthVisible, setStealthVisible] = useState(true);
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Listen for auth state changes to auto-complete onboarding when signed in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in during onboarding:', session.user.email);
        setAuthLoading(false);
        // Small delay to ensure session is fully set
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onComplete]);

  // --- ACTIONS ---
  const handleNext = useCallback(() => {
    if (step < 5) {
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
      // Use website URL for redirect (Supabase requires HTTP/HTTPS)
      // The app will intercept the redirect and extract the code
      const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.visnly.com';
      const redirectUrl = `${siteUrl}/auth/callback?app=true`;

      // Use PKCE flow - load OAuth URL directly in the app window
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false, // Let Supabase handle the redirect
        }
      });

      if (error) {
        console.error('OAuth error:', error);
        alert('Failed to start sign-in. Please try again.');
        setAuthLoading(false);
        return;
      }

      if (data?.url) {
        // Load OAuth URL directly in the Electron app window
        // This keeps everything within the app - no browser popup
        if (window.electron?.ipcRenderer) {
          // Send message to main process to load the OAuth URL in the app window
          window.electron.ipcRenderer.send('load-oauth-url', data.url);
          console.log('Sent OAuth URL to main process to load in app window');
        } else {
          // Fallback: load in current window
          console.log('Loading OAuth URL in current window');
          window.location.href = data.url;
        }
        // Keep loading state - will be cleared when OAuth callback is received
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      alert('Failed to sign in. Please try again.');
      setAuthLoading(false);
    }
  };

  // Stealth animation for Slide 5
  useEffect(() => {
    if (step === 4) {
      const interval = setInterval(() => {
        setStealthVisible(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // --- SLIDE RENDERERS ---

  // Slide 1: Welcome - "Welcome to Visnly"
  const renderSlide1 = () => (
    <>
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
      <p style={styles.subtitle}>
        The invisible advantage.
      </p>
      <button
        onClick={handleNext}
        className="start-session-button"
        style={{ width: '100%', marginBottom: '24px' }}
      >
        Sign up →
      </button>
      <p style={styles.legalText}>
        By signing up, you agree to our{" "}
        <a href="#" style={styles.legalLink}>Terms of Service</a>
        {" "}and{" "}
        <a href="#" style={styles.legalLink}>Privacy Policy</a>.
      </p>
    </>
  );

  const renderSlide1Visual = () => (
    <div style={styles.animatedVisualContainer}>
      {/* Subtle gradient orbs - minimal and refined */}
      <div style={styles.gradientOrb1}></div>
      <div style={styles.gradientOrb2}></div>
      
      {/* Elegant geometric shapes */}
      <div style={styles.geometricShape1}></div>
      <div style={styles.geometricShape2}></div>
      <div style={styles.geometricShape3}></div>
      
      {/* Minimal light rays */}
      <div style={styles.lightRay1}></div>
      <div style={styles.lightRay2}></div>
    </div>
  );

  // Slide 2: Auth - "Identify Yourself"
  const renderSlide2 = () => (
    <>
      <h2 style={styles.heading}>Identify Yourself</h2>
      <p style={styles.text}>
        Sign in to sync your progress across devices.
      </p>
      <button
        onClick={handleGoogleAuth}
        disabled={authLoading}
        className="start-session-button"
        style={{
          width: '100%',
          maxWidth: '320px',
          marginBottom: '16px',
          opacity: authLoading ? 0.6 : 1,
          cursor: authLoading ? 'not-allowed' : 'pointer',
          background: authLoading ? 'rgba(100, 108, 255, 0.5)' : undefined
        }}
      >
        {authLoading ? (
          <>Signing in...</>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </>
        )}
      </button>
      <button
        onClick={handleNext}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '14px',
          textDecoration: 'underline',
          marginTop: '8px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        Skip for now
      </button>
    </>
  );

  const renderSlide2Visual = () => (
    <div style={styles.profileMock}>
      <div style={styles.profileCard}>
        <div style={styles.profileAvatar}>
          <Icons.UserIcon size={48} color="rgba(135, 206, 250, 0.8)" />
        </div>
        <div style={styles.profileLoader}>
          <Icons.LoaderIcon size={24} color="rgba(135, 206, 250, 0.8)" />
        </div>
        <div style={styles.profileName}>Loading profile...</div>
      </div>
    </div>
  );

  // Slide 3: Education & Referral
  const renderSlide3 = () => (
    <>
      <h2 style={styles.heading}>Tell us more</h2>

      {/* Education Level */}
      <div style={styles.questionSection}>
        <p style={styles.questionText}>What level of education are you pursuing?</p>
        <div style={styles.chipsContainer}>
          {['Highschool', 'Undergraduate', 'Graduate', 'Trade', 'Other'].map((level) => (
            <button
              key={level}
              onClick={() => setEducationLevel(level)}
              onMouseEnter={(e) => {
                if (educationLevel !== level) {
                  e.currentTarget.style.background = 'rgba(135, 206, 250, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(135, 206, 250, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (educationLevel !== level) {
                  e.currentTarget.style.background = 'rgba(135, 206, 250, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(135, 206, 250, 0.2)';
                }
              }}
              style={{
                ...styles.educationChip,
                ...(educationLevel === level ? styles.educationChipActive : {})
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Referral Source */}
      <div style={styles.questionSection}>
        <p style={styles.questionText}>How did you hear about Visnly?</p>
        <div style={styles.referralGrid}>
          {['Google', 'LinkedIn', 'YouTube', 'Email', 'Twitter / X', 'TikTok', 'Instagram', 'Reddit', 'Podcast', 'Word of mouth', 'Other'].map((source) => (
            <button
              key={source}
              onClick={() => setReferralSource(source)}
              onMouseEnter={(e) => {
                if (referralSource !== source) {
                  e.currentTarget.style.background = 'rgba(135, 206, 250, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(135, 206, 250, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (referralSource !== source) {
                  e.currentTarget.style.background = 'rgba(135, 206, 250, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(135, 206, 250, 0.2)';
                }
              }}
              style={{
                ...styles.referralChip,
                ...(referralSource === source ? styles.referralChipActive : {})
              }}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!educationLevel || !referralSource}
        className="start-session-button"
        style={{
          width: '100%',
          maxWidth: '320px',
          marginTop: '40px',
          opacity: (educationLevel && referralSource) ? 1 : 0.5,
          cursor: (educationLevel && referralSource) ? 'pointer' : 'not-allowed'
        }}
      >
        Continue →
      </button>
    </>
  );

  const renderSlide3Visual = () => {
    return (
      <div style={styles.adaptVisual}>
        <div style={styles.timeSaveMessage}>
          <div style={styles.timeSaveText}>
            Students who use Visnly save <strong>10 hours</strong> a week
          </div>
        </div>
      </div>
    );
  };

  // Slide 4: Demo - "We Solve"
  const renderSlide4 = () => (
    <>
      <h2 style={styles.heading}>We Solve</h2>
      <p style={styles.text}>
        Ask any question. Get instant answers.
      </p>
      <button
        onClick={handleNext}
        className="start-session-button"
        style={{ width: '100%', maxWidth: '320px' }}
      >
        Next →
      </button>
    </>
  );

  const renderSlide4Visual = () => (
    <div style={styles.chatBubble}>
      <div style={styles.chatMessage}>
        <div style={styles.chatQuestion}>
          <strong>You:</strong> What is the derivative of x²?
        </div>
        <div style={styles.chatAnswer}>
          <strong>Visnly:</strong> The derivative of x² is 2x. This follows from the power rule: d/dx(xⁿ) = nxⁿ⁻¹.
        </div>
      </div>
    </div>
  );

  // Slide 5: Stealth - "The Magic Keys"
  const renderSlide5 = () => (
    <>
      <h2 style={styles.heading}>The Magic Keys</h2>
      <p style={styles.text}>
        Press <kbd style={styles.kbd}>Ctrl + Shift + Space</kbd> to summon or hide the overlay.
      </p>
      <div style={styles.hotkeyDemo}>
        <div style={styles.hotkeyBox}>
          <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Shift</kbd> + <kbd style={styles.kbd}>Space</kbd>
        </div>
      </div>
      <button
        onClick={handleNext}
        className="start-session-button"
        style={{ width: '100%', maxWidth: '320px' }}
      >
        Got it →
      </button>
    </>
  );

  const renderSlide5Visual = () => (
    <div style={styles.stealthContainer}>
      <div style={{
        ...styles.stealthApp,
        opacity: stealthVisible ? 1 : 0,
        transform: stealthVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 0.5s ease-in-out'
      }}>
        <div style={styles.stealthWindow}>
          <div style={styles.stealthHeader}>Visnly Overlay</div>
          <div style={styles.stealthContent}>
            <Icons.IncognitoIcon size={48} color="rgba(135, 206, 250, 0.8)" />
            <div style={styles.stealthText}>
              {stealthVisible ? 'Visible' : 'Hidden'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Slide 6: Pricing - "Clearance Level"
  const renderSlide6 = () => (
    <>
      <h1 style={styles.pricingTitle}>Unlock all features with Visnly Pro</h1>

      {/* Annual Toggle - Positioned on the right */}
      <div style={styles.pricingHeaderRow}>
        <div style={{ flex: 1 }}></div>
        <div style={styles.annualToggleContainer}>
          <span style={{ ...styles.toggleLabel, opacity: !billingAnnual ? 1 : 0.5 }}>Annual</span>
          <div
            style={{
              ...styles.toggleSwitch,
              background: billingAnnual ? 'rgba(135, 206, 250, 0.3)' : 'rgba(135, 206, 250, 0.2)'
            }}
            onClick={() => setBillingAnnual(!billingAnnual)}
          >
            <div style={{
              ...styles.toggleThumb,
              transform: billingAnnual ? 'translateX(26px)' : 'translateX(2px)',
              background: '#fff'
            }} />
          </div>
        </div>
      </div>

      {/* Two Pricing Cards Side by Side */}
      <div style={styles.pricingCardsGrid}>
        {/* Left Card: Pro Plan */}
        <div style={{
          ...styles.proCard,
          ...styles.proCardLeft,
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
          border: '2px solid #22c55e',
          boxShadow: billingAnnual ? '0 0 30px rgba(34, 197, 94, 0.5)' : '0 0 20px rgba(34, 197, 94, 0.3)',
        }}>
          <div style={styles.proCardHeader}>
            <h3 style={styles.proCardTitle}>Pro plan</h3>
            <span style={{ ...styles.popularBadge, background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>Popular</span>
          </div>
          <div style={styles.proPrice}>
            ${billingAnnual ? '12' : '15'}<span style={styles.perMonth}>/month</span>
          </div>
          <ul style={styles.proFeatures}>
            <li style={styles.proFeatureItem}>
              <span style={{ ...styles.infinityIcon, color: '#22c55e' }}>∞</span>
              <span>Unlimited AI Responses</span>
            </li>
            <li style={styles.proFeatureItem}>
              <span style={{ ...styles.infinityIcon, color: '#22c55e' }}>∞</span>
              <span>Unlimited meetings</span>
            </li>
            <li style={styles.proFeatureItem}>
              <Icons.CheckIcon size={20} color="#22c55e" />
              <span>Access to newest AI models</span>
            </li>
            <li style={styles.proFeatureItem}>
              <Icons.CheckIcon size={20} color="#22c55e" />
              <span>Priority chat support</span>
            </li>
          </ul>
          <button
            onClick={onComplete}
            className="start-session-button"
            style={{ width: '100%', marginTop: 'auto', background: '#22c55e', border: 'none' }}
          >
            Upgrade
          </button>
        </div>

        {/* Right Card: Pro + Undetectability */}
        <div style={{
          ...styles.proCard,
          ...styles.proCardRight,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
          border: '2px solid #ef4444',
        }}>
          <div style={styles.proCardHeader}>
            <h3 style={styles.proCardTitle}>Pro + Undetectability</h3>
          </div>
          <div style={styles.proPrice}>
            ${billingAnnual ? '42' : '45'}<span style={styles.perMonth}>/month</span>
          </div>
          <div style={styles.undetectabilityFeature}>
            <div style={styles.undetectabilityFeatureHeader}>
              <Icons.CheckIcon size={24} color="#ef4444" />
              <span style={styles.undetectabilityFeatureTitle}>Visnly Undetectability</span>
            </div>
            <p style={styles.undetectabilityFeatureDesc}>
              Visnly will be invisible to screen share during meetings
            </p>
            <div style={styles.undetectabilityVisual}>
              <div style={styles.videoCallMockup}>
                <div style={{ ...styles.videoCallScreen, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}></div>
                <div style={styles.crossedEyeIcon}>
                  <Icons.EyeIcon size={32} color="#ef4444" />
                  <div style={{ ...styles.crossedLine, background: '#ef4444' }}></div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onComplete}
            className="start-session-button"
            style={{ width: '100%', marginTop: 'auto', background: '#ef4444', border: 'none' }}
          >
            Upgrade
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div style={styles.trustIndicators}>
        <div style={styles.starsContainer}>
          {'★★★★★'.split('').map((star, i) => (
            <span key={i} style={styles.star}>{star}</span>
          ))}
        </div>
        <p style={styles.trustedByText}>Trusted by 10k users</p>
      </div>

      <button
        onClick={onComplete}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '16px',
          textDecoration: 'underline',
          marginTop: '24px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        Start with free →
      </button>
    </>
  );

  const renderSlide6Visual = () => (
    <div style={styles.pricingVisual}>
      <div style={{
        ...styles.proCardGlow,
        opacity: billingAnnual ? 0.6 : 0.3,
        transform: billingAnnual ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.3s ease'
      }}>
        <div style={styles.glowEffect}></div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  const renderLeftContent = () => {
    switch (step) {
      case 0: return renderSlide1();
      case 1: return renderSlide2();
      case 2: return renderSlide3();
      case 3: return renderSlide4();
      case 4: return renderSlide5();
      case 5: return renderSlide6();
      default: return null;
    }
  };

  const renderRightVisual = () => {
    switch (step) {
      case 0: return renderSlide1Visual();
      case 1: return renderSlide2Visual();
      case 2: return renderSlide3Visual();
      case 3: return renderSlide4Visual();
      case 4: return renderSlide5Visual();
      case 5: return renderSlide6Visual();
      default: return null;
    }
  };

  // Full screen layout for pricing slide
  if (step === 5) {
    return (
      <div style={styles.fullScreenContainer}>
        <LiquidBackground />
        <div style={styles.gridOverlay}></div>
        {step > 0 && (
          <button onClick={handleBack} style={styles.backBtnFullScreen}>
            ← Back
          </button>
        )}
        <div style={styles.fullScreenContent}>
          {renderLeftContent()}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* LEFT PANEL */}
      <div style={styles.leftPanel}>
        {step > 0 && (
          <button onClick={handleBack} style={styles.backBtn}>
            ← Back
          </button>
        )}
        <div style={styles.contentWrapper}>
          {renderLeftContent()}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.rightPanel}>
        <LiquidBackground />
        <div style={styles.gridOverlay}></div>
        <div style={styles.visualContent}>
          {renderRightVisual()}
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    background: '#050505',
    color: '#fff',
    overflow: 'hidden'
  },

  fullScreenContainer: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    background: '#050505',
    color: '#fff',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    boxSizing: 'border-box'
  },

  fullScreenContent: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    position: 'relative',
    flex: 1,
    paddingTop: '60px'
  },

  backBtnFullScreen: {
    position: 'absolute',
    top: '32px',
    left: '32px',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '6px',
    transition: '0.2s',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    zIndex: 20
  },

  leftPanel: {
    width: '50%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    boxSizing: 'border-box',
    borderRight: '1px solid rgba(135, 206, 250, 0.1)',
    background: '#0a0a0a',
    position: 'relative',
    zIndex: 2
  },

  rightPanel: {
    width: '50%',
    height: '100vh',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },

  contentWrapper: {
    maxWidth: '600px',
    width: '100%',
    animation: 'fadeIn 0.4s ease-out',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 0,
    padding: '40px 20px',
    boxSizing: 'border-box'
  },

  backBtn: {
    position: 'absolute',
    top: '32px',
    left: '32px',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: '6px',
    transition: '0.2s',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  // Typography
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

  heading: {
    fontSize: '42px',
    fontWeight: 700,
    marginBottom: '40px',
    lineHeight: '1.2',
    color: '#fff',
    textAlign: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '100%',
    letterSpacing: '-0.5px'
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

  text: {
    fontSize: '18px',
    color: '#999',
    marginBottom: '32px',
    lineHeight: '1.6',
    fontWeight: 400,
    textAlign: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '100%'
  },

  // Visuals
  visualContent: {
    position: 'relative',
    zIndex: 5,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'linear-gradient(rgba(135, 206, 250, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(135, 206, 250, 0.05) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    opacity: 0.5,
    zIndex: 1
  },

  // Slide 1 Visual - Minimal, sophisticated abstract animation
  animatedVisualContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'transparent'
  },

  gradientOrb1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(135, 206, 250, 0.1) 0%, transparent 70%)',
    top: '20%',
    left: '10%',
    filter: 'blur(100px)',
    animation: 'subtleFloat1 20s ease-in-out infinite',
    opacity: 0.6
  },

  gradientOrb2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(135, 206, 250, 0.08) 0%, transparent 70%)',
    bottom: '15%',
    right: '15%',
    filter: 'blur(100px)',
    animation: 'subtleFloat2 25s ease-in-out infinite',
    opacity: 0.5
  },

  geometricShape1: {
    position: 'absolute',
    width: '200px',
    height: '200px',
    top: '25%',
    left: '20%',
    border: '1px solid rgba(135, 206, 250, 0.25)',
    borderRadius: '2px',
    transform: 'rotate(45deg)',
    animation: 'geometricRotate1 30s linear infinite',
    opacity: 0.4
  },

  geometricShape2: {
    position: 'absolute',
    width: '150px',
    height: '150px',
    bottom: '30%',
    right: '25%',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '50%',
    animation: 'geometricRotate2 40s linear infinite reverse',
    opacity: 0.3
  },

  geometricShape3: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(45deg)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    animation: 'geometricRotate3 50s linear infinite',
    opacity: 0.25
  },

  lightRay1: {
    position: 'absolute',
    width: '1px',
    height: '100%',
    left: '30%',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.12), transparent)',
    animation: 'rayPulse1 8s ease-in-out infinite',
    opacity: 0.3
  },

  lightRay2: {
    position: 'absolute',
    width: '1px',
    height: '100%',
    right: '35%',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.1), transparent)',
    animation: 'rayPulse2 10s ease-in-out infinite',
    opacity: 0.25
  },

  // Slide 2 Visual - Profile Mock
  profileMock: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  profileCard: {
    width: '280px',
    padding: '32px',
    background: 'rgba(20,20,20,0.9)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },

  profileAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255,255,255,0.3)'
  },

  profileLoader: {
    animation: 'spin 1s linear infinite'
  },

  profileName: {
    fontSize: '16px',
    color: '#888',
    fontWeight: 500
  },

  // Slide 3 Visual - Persona Adapt
  adaptVisual: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingBottom: '40px',
    position: 'relative'
  },

  timeSaveMessage: {
    position: 'absolute',
    bottom: '60px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
    padding: '0 40px',
    boxSizing: 'border-box'
  },

  timeSaveText: {
    fontSize: '28px',
    fontWeight: 500,
    color: '#fff',
    lineHeight: '1.5',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  // Slide 4 Visual - Chat Bubble
  chatBubble: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '40px'
  },

  chatMessage: {
    width: '100%',
    maxWidth: '400px',
    background: 'rgba(20,20,20,0.9)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },

  chatQuestion: {
    padding: '16px',
    background: 'rgba(135, 206, 250, 0.12)',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#fff'
  },

  chatAnswer: {
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#ccc'
  },

  // Slide 5 Visual - Stealth
  stealthContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },

  stealthApp: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  stealthWindow: {
    width: '320px',
    padding: '32px',
    background: 'rgba(20,20,20,0.95)',
    borderRadius: '16px',
    border: '2px solid rgba(135, 206, 250, 0.4)',
    boxShadow: '0 20px 50px rgba(135, 206, 250, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },

  stealthHeader: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'rgba(135, 206, 250, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },

  stealthContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },

  stealthText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff'
  },

  hotkeyDemo: {
    marginBottom: '32px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },

  hotkeyBox: {
    padding: '20px 32px',
    background: 'rgba(135, 206, 250, 0.12)',
    borderRadius: '12px',
    border: '1px solid rgba(135, 206, 250, 0.3)',
    fontSize: '18px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace"
  },

  kbd: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(135, 206, 250, 0.3)',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace"
  },

  // Slide 6 Visual - Pricing
  pricingVisual: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'relative'
  },

  proCardGlow: {
    width: '300px',
    height: '400px',
    position: 'relative'
  },

  glowEffect: {
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle, rgba(135, 206, 250, 0.2) 0%, transparent 70%)',
    borderRadius: '20px',
    filter: 'blur(40px)'
  },

  // Question Sections
  questionSection: {
    marginBottom: '40px',
    width: '100%'
  },

  questionText: {
    fontSize: '15px',
    color: '#aaa',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: 500,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  // Education Level Chips
  chipsContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },

  educationChip: {
    padding: '12px 24px',
    background: 'rgba(135, 206, 250, 0.12)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ddd',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },

  educationChipActive: {
    background: 'rgba(135, 206, 250, 0.2)',
    border: '1px solid rgba(135, 206, 250, 0.4)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(135, 206, 250, 0.25)',
    transform: 'translateY(-1px)'
  },

  // Referral Source Grid
  referralGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto'
  },

  referralChip: {
    padding: '11px 16px',
    background: 'rgba(135, 206, 250, 0.12)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: '#ddd',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },

  referralChipActive: {
    background: 'rgba(135, 206, 250, 0.2)',
    border: '1px solid rgba(135, 206, 250, 0.4)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(135, 206, 250, 0.25)',
    transform: 'translateY(-1px)'
  },

  // Pricing
  pricingTitle: {
    fontSize: '42px',
    fontWeight: 700,
    marginBottom: '32px',
    lineHeight: '1.2',
    color: '#fff',
    textAlign: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '100%',
    letterSpacing: '-0.5px'
  },


  pricingHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto 32px',
    padding: '0 20px',
    boxSizing: 'border-box'
  },

  annualToggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  toggleLabel: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#fff',
    transition: '0.3s',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  toggleSwitch: {
    width: '48px',
    height: '24px',
    borderRadius: '12px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255,255,255,0.1)'
  },

  toggleThumb: {
    width: '18px',
    height: '18px',
    background: '#fff',
    borderRadius: '50%',
    position: 'absolute',
    top: '2px',
    left: '2px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
  },

  pricingCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto 32px',
    padding: '0 20px',
    boxSizing: 'border-box'
  },

  proCard: {
    padding: '32px',
    background: 'linear-gradient(135deg, rgba(135, 206, 250, 0.18) 0%, rgba(135, 206, 250, 0.1) 100%)',
    borderRadius: '20px',
    border: '2px solid rgba(135, 206, 250, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    transition: 'all 0.3s ease',
    minHeight: '500px'
  },

  proCardLeft: {
    // Left card specific styles
  },

  proCardRight: {
    background: 'linear-gradient(135deg, rgba(135, 206, 250, 0.15) 0%, rgba(135, 206, 250, 0.08) 100%)',
    border: '2px solid rgba(135, 206, 250, 0.3)'
  },

  proCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'flex-start'
  },

  proCardTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  popularBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(135, 206, 250, 0.9)',
    background: 'rgba(255,255,255,0.15)',
    padding: '4px 12px',
    borderRadius: '12px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  proPrice: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#fff',
    marginTop: '10px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  perMonth: {
    fontSize: '18px',
    fontWeight: 400,
    opacity: 0.8,
    marginLeft: '8px'
  },

  proFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    fontSize: '16px',
    color: '#ccc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    flex: 1
  },

  proFeatureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#fff'
  },

  infinityIcon: {
    fontSize: '20px',
    color: 'rgba(135, 206, 250, 0.9)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px'
  },

  undetectabilityFeature: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1
  },

  undetectabilityFeatureHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  undetectabilityFeatureTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  undetectabilityFeatureDesc: {
    fontSize: '14px',
    color: '#999',
    lineHeight: '1.6',
    margin: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

  undetectabilityVisual: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: '200px'
  },

  videoCallMockup: {
    position: 'relative',
    width: '200px',
    height: '150px',
    background: 'rgba(20,20,20,0.6)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  videoCallScreen: {
    width: '80%',
    height: '60%',
    background: 'rgba(135, 206, 250, 0.12)',
    borderRadius: '8px',
    border: '1px solid rgba(135, 206, 250, 0.25)'
  },

  crossedEyeIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  crossedLine: {
    position: 'absolute',
    width: '40px',
    height: '2px',
    background: 'rgba(135, 206, 250, 0.4)',
    transform: 'rotate(45deg)',
    top: '50%',
    left: '50%',
    marginLeft: '-20px',
    marginTop: '-1px'
  },

  trustIndicators: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginTop: '32px',
    marginBottom: '24px'
  },

  starsContainer: {
    display: 'flex',
    gap: '4px',
    fontSize: '20px',
    color: '#ffa500'
  },

  star: {
    fontSize: '20px',
    color: '#ffa500'
  },

  trustedByText: {
    fontSize: '16px',
    color: '#999',
    margin: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },


  // Welcome page specific styles
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


  legalText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
    marginTop: '24px',
    marginBottom: '48px',
    textAlign: 'center',
    fontWeight: 400,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '100%'
  },

  legalLink: {
    color: 'rgba(135, 206, 250, 0.9)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },

};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -30px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-40px, 40px) scale(1.15); }
  }
  @keyframes orbPulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
  }
  @keyframes subtleFloat1 {
    0%, 100% { 
      transform: translate(0, 0) scale(1);
      opacity: 0.6;
    }
    50% { 
      transform: translate(40px, -30px) scale(1.1);
      opacity: 0.4;
    }
  }
  @keyframes subtleFloat2 {
    0%, 100% { 
      transform: translate(0, 0) scale(1);
      opacity: 0.5;
    }
    50% { 
      transform: translate(-30px, 40px) scale(0.9);
      opacity: 0.3;
    }
  }
  @keyframes geometricRotate1 {
    from { transform: rotate(45deg); }
    to { transform: rotate(405deg); }
  }
  @keyframes geometricRotate2 {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes geometricRotate3 {
    from { transform: translate(-50%, -50%) rotate(45deg); }
    to { transform: translate(-50%, -50%) rotate(405deg); }
  }
  @keyframes rayPulse1 {
    0%, 100% { 
      opacity: 0.2;
    }
    50% { 
      opacity: 0.4;
    }
  }
  @keyframes rayPulse2 {
    0%, 100% { 
      opacity: 0.15;
    }
    50% { 
      opacity: 0.35;
    }
  }
  @keyframes logoGlow {
    0%, 100% { box-shadow: 0 10px 40px rgba(135, 206, 250, 0.25), inset 0 0 20px rgba(135, 206, 250, 0.15); }
    50% { box-shadow: 0 10px 60px rgba(135, 206, 250, 0.35), inset 0 0 30px rgba(135, 206, 250, 0.25); }
  }
`;
document.head.appendChild(styleSheet);

export default OnboardingFlow;

