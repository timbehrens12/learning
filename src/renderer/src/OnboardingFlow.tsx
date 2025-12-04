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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

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

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
        setIsSignUp(false);
        setAuthLoading(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state change listener will handle completion
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      setAuthLoading(false);
    }
  };

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
    <div style={styles.sceneContainer}>
      {/* Inject Keyframes specific to this animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: -20%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateZ(60px) translateY(-20px); }
          50% { transform: translateZ(60px) translateY(-30px); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes typing {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 100%; }
        }
        @keyframes floatParticle {
          0% { transform: translateZ(40px) translate(0, 0) rotate(0deg); }
          50% { transform: translateZ(40px) translate(15px, -15px) rotate(5deg); }
          100% { transform: translateZ(40px) translate(0, 0) rotate(0deg); }
        }
      `}} />

      {/* 3D Container for perspective */}
      <div style={styles.perspectiveWrapper}>
        
        {/* Layer 1: The "Assignment/Task" Background */}
        <div style={styles.docLayer}>
          <div style={styles.docHeader}>
            {/* Windows Style: Simple generic title bar line */}
            <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}></div>
          </div>
          <div style={styles.docContent}>
            <div style={{...styles.docLine, width: '80%'}}></div>
            <div style={{...styles.docLine, width: '90%'}}></div>
            <div style={{...styles.docLine, width: '60%'}}></div>
            <div style={{...styles.docLine, width: '85%', marginTop: '16px'}}></div>
            <div style={{...styles.docLine, width: '70%'}}></div>
          </div>
          {/* Scanning Beam Effect */}
          <div style={styles.scanBeam}></div>
        </div>

        {/* Layer 2: The Visnly "Popup" Helper */}
        <div style={styles.popupLayer}>
          <div style={styles.popupHeader}>
            <div style={styles.popupLogo}>
              <img src="./logo.png" alt="Visnly" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
            </div>
            <span style={styles.popupTitle}>Visnly AI</span>
          </div>
          <div style={styles.popupBody}>
            <div style={styles.popupThinking}>
              <div style={styles.thinkingDot}></div>
              <div style={{...styles.thinkingDot, animationDelay: '0.2s'}}></div>
              <div style={{...styles.thinkingDot, animationDelay: '0.4s'}}></div>
            </div>
            <div style={styles.popupAnswerBlock}>
              <div style={styles.typingLine1}></div>
              <div style={styles.typingLine2}></div>
              <div style={styles.typingLine3}></div>
            </div>
          </div>
          <div style={styles.popupGlow}></div>
        </div>

        {/* Floating Particles (Math/Code symbols) */}
        <div style={styles.floatingSymbol1}>∫</div>
        <div style={styles.floatingSymbol2}>{`{}`}</div>
        <div style={styles.floatingSymbol3}>∑</div>
        <div style={styles.floatingSymbol4}>?</div>
        
        {/* Extra School/Study Particles */}
        <div style={styles.floatingSymbol5}>π</div>
        <div style={styles.floatingSymbol6}>x²</div>
        <div style={styles.floatingSymbol7}>dy/dx</div>
        <div style={styles.floatingSymbol8}>A+</div>
        <div style={styles.floatingSymbol9}>α</div>
      
      </div>
    </div>
  );

  // Slide 2: Auth - "Identify Yourself"
  const renderSlide2 = () => (
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
      <h1 style={styles.title}>Identify Yourself</h1>
      <p style={styles.subtitle}>
        {isSignUp ? "Create an account" : "Sign in to sync your progress across devices."}
      </p>

      {authError && (
        <div style={styles.authError}>
          {authError}
        </div>
      )}

      {/* Email/Password Form */}
      <div style={styles.authForm}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
          style={styles.authInput}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
          style={styles.authInput}
        />
        <button
          onClick={handleEmailAuth}
          disabled={authLoading || !email || !password}
          className="start-session-button"
          style={{
            width: '100%',
            maxWidth: '320px',
            marginBottom: '16px',
            opacity: (authLoading || !email || !password) ? 0.5 : 1,
            cursor: (authLoading || !email || !password) ? 'not-allowed' : 'pointer'
          }}
        >
          {authLoading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create Account" : "Sign In")}
        </button>
      </div>

      <div style={styles.authDivider}>
        <div style={styles.authDividerLine}></div>
        <span style={styles.authDividerText}>Or continue with</span>
        <div style={styles.authDividerLine}></div>
      </div>

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

      <div style={styles.authToggle}>
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <span onClick={() => setIsSignUp(false)} style={styles.authLink}>
              Sign In
            </span>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <span onClick={() => setIsSignUp(true)} style={styles.authLink}>
              Sign Up
            </span>
          </>
        )}
      </div>
    </>
  );

  const renderSlide2Visual = () => (
    <div style={styles.profileMock}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes circleBorder {
          0% { 
            transform: rotate(0deg) translateY(-50px) rotate(0deg);
          }
          100% { 
            transform: rotate(360deg) translateY(-50px) rotate(-360deg);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}} />
      
      {/* ID Card Container */}
      <div style={styles.idCardContainer}>
        {/* ID Card */}
        <div style={styles.idCard}>
          {/* ID Card Header */}
          <div style={styles.idCardHeader}>
            <div style={styles.idCardHeaderLine}></div>
            <div style={styles.idCardHeaderLine}></div>
          </div>
          
          {/* ID Card Content */}
          <div style={styles.idCardContent}>
            {/* Photo Area with Person Icon */}
            <div style={styles.idCardPhoto}>
              {/* Border with Circling Color Spot */}
              <div style={styles.idCardPhotoBorder}>
                <div style={styles.idCardPhotoBorderSpot}></div>
              </div>
              <div style={styles.idCardPhotoIcon}>
                <Icons.UserIcon size={48} color="rgba(135, 206, 250, 0.7)" />
              </div>
            </div>
            
            {/* Details Section */}
            <div style={styles.idCardDetails}>
              {/* Name Line */}
              <div style={styles.idCardDetailLine}>
                <div style={styles.idCardLabel}>NAME</div>
                <div style={{...styles.idCardValue, animationDelay: '0s'}}></div>
              </div>
              
              {/* Email Line */}
              <div style={styles.idCardDetailLine}>
                <div style={styles.idCardLabel}>EMAIL</div>
                <div style={{...styles.idCardValue, animationDelay: '0.2s'}}></div>
              </div>
              
              {/* ID Line */}
              <div style={styles.idCardDetailLine}>
                <div style={styles.idCardLabel}>ID</div>
                <div style={{...styles.idCardValue, animationDelay: '0.4s'}}></div>
              </div>
              
              {/* Status Line */}
              <div style={styles.idCardDetailLine}>
                <div style={styles.idCardLabel}>STATUS</div>
                <div style={{...styles.idCardValue, animationDelay: '0.6s'}}></div>
              </div>
            </div>
          </div>
          
          {/* ID Card Footer */}
          <div style={styles.idCardFooter}>
            <div style={styles.idCardFooterLine}></div>
            <div style={styles.idCardFooterLine}></div>
          </div>
        </div>
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
    marginBottom: '32px',
    textAlign: 'center',
    fontWeight: 400,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    width: '100%',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  authForm: {
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  authInput: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  authError: {
    width: '100%',
    maxWidth: '320px',
    padding: '10px 12px',
    marginBottom: '16px',
    background: 'rgba(255, 82, 82, 0.1)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    borderRadius: '8px',
    color: '#ff5252',
    fontSize: '13px',
    textAlign: 'center'
  },
  authDivider: {
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    marginTop: '8px'
  },
  authDividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)'
  },
  authDividerText: {
    fontSize: '12px',
    color: '#666',
    whiteSpace: 'nowrap'
  },
  authToggle: {
    marginTop: '16px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center'
  },
  authLink: {
    color: 'rgba(135, 206, 250, 0.9)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 500
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

  // Slide 1 Visual - Visnly Hero Animation
  sceneContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    perspective: '1200px'
  },

  perspectiveWrapper: {
    width: '500px',
    height: '500px',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transform: 'rotateX(15deg) rotateY(-15deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Layer 1: Background Document
  docLayer: {
    position: 'absolute',
    width: '400px',
    height: '500px',
    background: 'rgba(20, 20, 25, 0.6)',
    backdropFilter: 'blur(5px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transform: 'translateZ(0px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  docHeader: {
    height: '40px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '8px'
  },

  docContent: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },

  docLine: {
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px'
  },

  scanBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.3), transparent)',
    animation: 'scan 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
    pointerEvents: 'none'
  },

  // Layer 2: Popup Overlay
  popupLayer: {
    position: 'absolute',
    width: '320px',
    height: '180px',
    background: 'rgba(15, 15, 20, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(135, 206, 250, 0.5)',
    transform: 'translateZ(60px) translateY(-20px)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(135, 206, 250, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'float 6s ease-in-out infinite'
  },

  popupHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  popupLogo: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'rgba(135, 206, 250, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },

  popupTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    fontFamily: "'Inter', sans-serif"
  },

  popupBody: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },

  popupThinking: {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px'
  },

  thinkingDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'rgba(135, 206, 250, 0.9)',
    animation: 'bounce 1.4s infinite ease-in-out both'
  },

  popupAnswerBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  typingLine1: {
    height: '6px',
    background: 'linear-gradient(90deg, rgba(135, 206, 250, 0.9), rgba(135, 206, 250, 0.6))',
    borderRadius: '3px',
    width: '0%',
    animation: 'typing 3s steps(20, end) infinite'
  },

  typingLine2: {
    height: '6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '3px',
    width: '0%',
    animation: 'typing 3s steps(20, end) 0.5s infinite'
  },

  typingLine3: {
    height: '6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '3px',
    width: '0%',
    animation: 'typing 3s steps(20, end) 1s infinite'
  },

  popupGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(135, 206, 250, 0.4), transparent 60%)',
    zIndex: -1,
    opacity: 0.5,
    filter: 'blur(10px)'
  },

  // Floating Particles
  floatingSymbol1: {
    position: 'absolute',
    color: 'rgba(135, 206, 250, 0.5)',
    fontSize: '32px',
    fontWeight: 'bold',
    top: '-20px',
    right: '-40px',
    transform: 'translateZ(40px)',
    animation: 'floatParticle 8s ease-in-out infinite',
    fontFamily: 'serif'
  },
  
  floatingSymbol2: {
    position: 'absolute',
    color: 'rgba(135, 206, 250, 0.4)',
    fontSize: '24px',
    fontFamily: 'monospace',
    bottom: '-30px',
    left: '-20px',
    transform: 'translateZ(80px)',
    animation: 'floatParticle 10s ease-in-out infinite reverse'
  },
  
  floatingSymbol3: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.1)',
    fontSize: '40px',
    top: '40%',
    left: '-60px',
    transform: 'translateZ(20px)',
    animation: 'floatParticle 12s ease-in-out infinite 2s'
  },

  floatingSymbol4: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.2)',
    fontSize: '28px',
    top: '10%',
    right: '20%',
    transform: 'translateZ(30px)',
    animation: 'floatParticle 7s ease-in-out infinite 1s'
  },

  floatingSymbol5: {
    position: 'absolute',
    color: 'rgba(135, 206, 250, 0.4)',
    fontSize: '36px',
    top: '-40px',
    left: '20%',
    transform: 'translateZ(50px)',
    animation: 'floatParticle 9s ease-in-out infinite 0.5s',
    fontFamily: 'serif'
  },
  
  floatingSymbol6: {
    position: 'absolute',
    color: 'rgba(135, 206, 250, 0.3)',
    fontSize: '24px',
    bottom: '10%',
    right: '-50px',
    transform: 'translateZ(20px)',
    animation: 'floatParticle 11s ease-in-out infinite 1.5s',
    fontWeight: 'bold'
  },

  floatingSymbol7: {
    position: 'absolute',
    color: 'rgba(135, 206, 250, 0.35)',
    fontSize: '20px',
    top: '60%',
    right: '-70px',
    transform: 'translateZ(60px)',
    animation: 'floatParticle 13s ease-in-out infinite 2.5s',
    fontFamily: 'monospace'
  },

  floatingSymbol8: {
    position: 'absolute',
    color: 'rgba(34, 197, 94, 0.4)', // Greenish for A+
    fontSize: '48px',
    fontWeight: '900',
    top: '-80px',
    right: '20%',
    transform: 'translateZ(80px)',
    animation: 'floatParticle 14s ease-in-out infinite 1s',
    textShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
  },

  floatingSymbol9: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.15)',
    fontSize: '22px',
    bottom: '-50px',
    left: '40%',
    transform: 'translateZ(30px)',
    animation: 'floatParticle 10s ease-in-out infinite 3.5s'
  },

  // Slide 2 Visual - Profile Mock
  profileMock: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },

  idCardContainer: {
    position: 'relative',
    width: '380px',
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  idCard: {
    position: 'relative',
    width: '380px',
    height: '240px',
    background: 'rgba(20, 20, 20, 0.95)',
    borderRadius: '16px',
    border: '2px solid rgba(135, 206, 250, 0.2)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(135, 206, 250, 0.1)',
    overflow: 'hidden'
  },

  idCardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },

  idCardHeaderLine: {
    height: '8px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '4px',
    animation: 'pulse 2s ease-in-out infinite'
  },

  idCardContent: {
    display: 'flex',
    gap: '20px',
    flex: 1
  },

  idCardPhoto: {
    width: '100px',
    height: '100px',
    background: 'rgba(135, 206, 250, 0.08)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    overflow: 'visible',
    marginBottom: '10px'
  },

  idCardPhotoBorder: {
    position: 'absolute',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '2px solid rgba(135, 206, 250, 0.2)',
    top: 0,
    left: 0,
    zIndex: 0
  },

  idCardPhotoBorderSpot: {
    position: 'absolute',
    width: '24px',
    height: '4px',
    background: 'rgba(135, 206, 250, 0.9)',
    borderRadius: '2px',
    boxShadow: '0 0 12px rgba(135, 206, 250, 0.8)',
    animation: 'circleBorder 3s linear infinite',
    zIndex: 1,
    top: '50%',
    left: '50%',
    transformOrigin: '0 0'
  },

  idCardPhotoIcon: {
    position: 'relative',
    zIndex: 1
  },

  idCardDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    justifyContent: 'center'
  },

  idCardDetailLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  idCardLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    minWidth: '50px',
    fontFamily: 'monospace'
  },

  idCardValue: {
    flex: 1,
    height: '12px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    animation: 'pulse 2s ease-in-out infinite',
    animationDelay: '0.3s'
  },

  idCardFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },

  idCardFooterLine: {
    height: '6px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    animation: 'pulse 2s ease-in-out infinite',
    animationDelay: '0.6s'
  },

  // Data Stream Particles
  dataStream1: {
    position: 'absolute',
    width: '2px',
    height: '60px',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.8), transparent)',
    left: '20%',
    top: '-60px',
    animation: 'dataStream 3s ease-in-out infinite',
    boxShadow: '0 0 10px rgba(135, 206, 250, 0.5)'
  },
  dataStream2: {
    position: 'absolute',
    width: '2px',
    height: '60px',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.6), transparent)',
    left: '35%',
    top: '-60px',
    animation: 'dataStream 3s ease-in-out infinite 0.5s',
    boxShadow: '0 0 10px rgba(135, 206, 250, 0.4)'
  },
  dataStream3: {
    position: 'absolute',
    width: '2px',
    height: '60px',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.7), transparent)',
    left: '50%',
    top: '-60px',
    animation: 'dataStream 3s ease-in-out infinite 1s',
    boxShadow: '0 0 10px rgba(135, 206, 250, 0.45)'
  },
  dataStream4: {
    position: 'absolute',
    width: '2px',
    height: '60px',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.5), transparent)',
    left: '65%',
    top: '-60px',
    animation: 'dataStream 3s ease-in-out infinite 1.5s',
    boxShadow: '0 0 10px rgba(135, 206, 250, 0.35)'
  },
  dataStream5: {
    position: 'absolute',
    width: '2px',
    height: '60px',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.6), transparent)',
    left: '80%',
    top: '-60px',
    animation: 'dataStream 3s ease-in-out infinite 2s',
    boxShadow: '0 0 10px rgba(135, 206, 250, 0.4)'
  },

  // Floating Data Particles
  dataParticle1: {
    position: 'absolute',
    fontSize: '24px',
    left: '15%',
    top: '20%',
    animation: 'particleFloat 4s ease-in-out infinite',
    opacity: 0.6
  },
  dataParticle2: {
    position: 'absolute',
    fontSize: '20px',
    left: '75%',
    top: '30%',
    animation: 'particleFloat 4s ease-in-out infinite 1s',
    opacity: 0.5
  },
  dataParticle3: {
    position: 'absolute',
    fontSize: '22px',
    left: '25%',
    top: '70%',
    animation: 'particleFloat 4s ease-in-out infinite 2s',
    opacity: 0.6
  },
  dataParticle4: {
    position: 'absolute',
    fontSize: '18px',
    left: '80%',
    top: '75%',
    animation: 'particleFloat 4s ease-in-out infinite 3s',
    opacity: 0.5
  },

  profileCard: {
    width: '320px',
    padding: '40px',
    background: 'rgba(20,20,20,0.95)',
    borderRadius: '20px',
    border: '1px solid rgba(135, 206, 250, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    position: 'relative',
    overflow: 'hidden',
    animation: 'cardGlow 2s ease-in-out infinite',
    boxShadow: '0 0 30px rgba(135, 206, 250, 0.3), 0 0 60px rgba(135, 206, 250, 0.2)'
  },

  hologramShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, transparent 0%, rgba(135, 206, 250, 0.1) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
    animation: 'hologramShimmer 3s ease-in-out infinite',
    pointerEvents: 'none',
    borderRadius: '20px'
  },

  profileScanBeam: {
    position: 'absolute',
    top: '-10%',
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(to bottom, transparent, rgba(135, 206, 250, 0.8), transparent)',
    animation: 'profileScan 2s ease-in-out infinite',
    boxShadow: '0 0 20px rgba(135, 206, 250, 0.6)',
    borderRadius: '2px'
  },

  profileAvatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'rgba(135, 206, 250, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(135, 206, 250, 0.4)',
    position: 'relative',
    animation: 'profilePulse 2s ease-in-out infinite',
    boxShadow: '0 0 30px rgba(135, 206, 250, 0.3), inset 0 0 20px rgba(135, 206, 250, 0.1)'
  },

  avatarInner: {
    position: 'relative',
    zIndex: 2
  },

  avatarRing: {
    position: 'absolute',
    top: '-4px',
    left: '-4px',
    right: '-4px',
    bottom: '-4px',
    borderRadius: '50%',
    border: '2px solid rgba(135, 206, 250, 0.3)',
    borderTopColor: 'rgba(135, 206, 250, 0.8)',
    animation: 'spin 2s linear infinite',
    zIndex: 1
  },

  profileLoaderContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center'
  },

  loaderDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(135, 206, 250, 0.8)',
    animation: 'bounce 1.4s ease-in-out infinite',
    boxShadow: '0 0 10px rgba(135, 206, 250, 0.5)'
  },

  profileNameContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },

  profileName: {
    fontSize: '18px',
    color: '#fff',
    fontWeight: 600,
    letterSpacing: '0.5px'
  },

  profileSubtext: {
    fontSize: '14px',
    color: 'rgba(135, 206, 250, 0.7)',
    fontWeight: 400
  },

  profileProgressBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
    position: 'relative'
  },

  profileProgressFill: {
    height: '100%',
    width: '60%',
    background: 'linear-gradient(90deg, rgba(135, 206, 250, 0.6), rgba(135, 206, 250, 0.9))',
    borderRadius: '2px',
    animation: 'profilePulse 2s ease-in-out infinite',
    boxShadow: '0 0 10px rgba(135, 206, 250, 0.6)'
  },

  profileGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(135, 206, 250, 0.1) 0%, transparent 70%)',
    animation: 'profilePulse 3s ease-in-out infinite',
    pointerEvents: 'none',
    zIndex: 0
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

