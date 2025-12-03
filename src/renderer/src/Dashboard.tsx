import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from './components/GlassCard';
import LiquidBackground from './components/LiquidBackground';
import SettingsModal from './components/SettingsModal';
import { supabase, userCredits } from './lib/supabase';
import { stripeService } from './lib/stripe';
import { UserIcon, UserPlusIcon, CreditCardIcon, HelpCircleIcon, SettingsIcon, InstagramIcon, XLogoIcon, DiscordIcon, BoltIcon, CheckIcon, DotIcon } from './components/Icons';

// --- Types ---
interface Session {
  id: number;
  title: string;
  mode: string;
  duration: string;
  time: string;
}

const INITIAL_SESSIONS: Session[] = [
  { id: 1, title: "Calculus II Assignment", mode: "Solve", duration: "18m", time: "3:11 PM" },
  { id: 2, title: "Biology Lecture Notes", mode: "Explain", duration: "42m", time: "1:05 PM" },
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDetectable, setIsDetectable] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<{ credits: number; plan: string } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('user_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });
  
  const FREE_SESSION_LIMIT = 5;

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleStartSession = () => {
    if (!isProUser && sessions.length >= FREE_SESSION_LIMIT) {
      alert("Free limit reached! Upgrade to Pro for unlimited sessions."); // Placeholder for upgrade modal
      return;
    }
    setIsSessionActive(true);
    setSessionStartTime(new Date());
    setElapsedSeconds(0);
    (window as any).electron.ipcRenderer.send('open-overlay'); 
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    if (sessionStartTime) {
      // Logic to derive title from session context
      const context = localStorage.getItem('last_session_context') || '';
      const title = context.slice(0, 30).split('\n')[0] || `Session ${sessions.length + 1}`;

      const newSession: Session = {
        id: Date.now(),
        title: title.trim() || "Untitled Session",
        mode: "Explain", // Default
        duration: formatDuration(elapsedSeconds),
        time: sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const updated = [newSession, ...sessions];
      setSessions(updated);
        localStorage.setItem('user_sessions', JSON.stringify(updated));
    }
  };

  // Load user data and credits
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");

        // Load user profile
        const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
        setUserName(profile?.display_name || user.email?.split('@')[0] || "Student");

        // Load user credits
        try {
          const credits = await userCredits.getCredits(user.id);
          setUserCredits(credits);
          console.log('Loaded credits:', credits);
        } catch (error) {
          console.error('Failed to load credits:', error);
          // Set default credits for new users
          setUserCredits({ credits: 25, plan: 'free' });
        }
      }
    };
    loadUserData();
  }, []);

  const formatDuration = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const formatTimerDisplay = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleDetectability = () => {
    const newState = !isDetectable;
    setIsDetectable(newState);
    (window as any).electron?.ipcRenderer?.send('set-detectable', newState);
  };

  return (
    <div style={styles.container}>
      <LiquidBackground />
      <div style={styles.content}>

        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.brand}>StudyLayer</div>
          <div style={styles.headerRight}>
            {/* Credit Display */}
            {userCredits && (
              <div style={styles.creditBadge}>
                {userCredits.plan === 'unlimited' ? 'PRO' : `${userCredits.credits} credits`}
            </div>
            )}

            <button onClick={toggleDetectability} style={styles.stealthBtn} title={isDetectable ? "Visible" : "Stealth Mode Active"}>
              <div style={{...styles.stealthDot, background: isDetectable ? '#4caf50' : '#ef4444'}}></div>
              {isDetectable ? "Visible" : "Stealth"}
            </button>

            <div style={{position: 'relative'}} ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} style={styles.profileBtn}>
                <div style={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
            </button>

            {isProfileOpen && (
                <GlassCard style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <div style={styles.ddName}>{userName}</div>
                    <div style={styles.ddEmail}>{userEmail}</div>
                </div>
                  <div style={styles.dropdownDivider}></div>
                  <button onClick={() => setShowSettingsModal(true)} style={styles.dropdownItem}>
                    <SettingsIcon size={14} /> Settings
                  </button>
                  <button onClick={() => {}} style={styles.dropdownItem}>
                    <HelpCircleIcon size={14} /> Help & Support
                  </button>
              </GlassCard>
            )}
          </div>
        </div>
      </header>

        {/* MAIN DASHBOARD CONTENT */}
        <div style={styles.mainGrid}>
          
          {/* Left Column: Hero Action */}
          <div style={styles.heroColumn}>
            <GlassCard style={styles.heroCard}>
          {!isSessionActive ? (
                <div style={styles.heroContent}>
                  <div style={styles.heroIconWrapper}>
                    <BoltIcon size={32} color="#fff" />
                  </div>
                  <h1 style={styles.heroTitle}>Ready to learn?</h1>
                  <p style={styles.heroText}>Your AI study companion is ready.</p>
                  <button onClick={handleStartSession} style={styles.primaryBtn}>
                    Start Session
                  </button>
                  <div style={styles.limitInfo}>
                    {!isProUser && `${sessions.length} / ${FREE_SESSION_LIMIT} free sessions used`}
                  </div>

                  {/* Credit Warning */}
                  {userCredits && userCredits.credits <= 5 && userCredits.plan !== 'unlimited' && (
                    <div style={styles.creditWarning}>
                      <div style={styles.warningIcon}>⚠️</div>
                      <div style={styles.warningText}>
                        <div style={styles.warningTitle}>Running low on credits!</div>
                        <div style={styles.warningSub}>You have {userCredits.credits} credits left</div>
                      </div>
                      <button onClick={() => stripeService.buyCredits(userId!, 50)} style={styles.quickBuyBtn}>
                        Buy 50 ($4.99)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.heroContent}>
                  <div style={styles.timerRing}>
                    <div style={styles.timerValue}>{formatTimerDisplay(elapsedSeconds)}</div>
                    <div style={styles.timerLabel}>Session Active</div>
                  </div>
                  <button onClick={handleEndSession} style={styles.dangerBtn}>
                    End Session
                    </button>
                </div>
              )}
            </GlassCard>
            
            {/* Quick Stats / Info */}
            <div style={styles.statsRow}>
              <GlassCard style={styles.statCard}>
                <div style={styles.statValue}>{sessions.length}</div>
                <div style={styles.statLabel}>Total Sessions</div>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <div style={styles.statValue}>12h</div>
                <div style={styles.statLabel}>Study Time</div>
              </GlassCard>
              </div>
        </div>

          {/* Right Column: History */}
          <div style={styles.historyColumn}>
            <div style={styles.sectionTitle}>Recent Activity</div>
            <div style={styles.historyList}>
              {sessions.length === 0 ? (
                <div style={styles.emptyHistory}>No recent sessions.</div>
              ) : (
                sessions.map(session => (
                  <div key={session.id} style={styles.historyItem}>
                    <div style={styles.historyIcon}>
                      <CheckIcon size={14} color="#646cff" />
                    </div>
                    <div style={styles.historyInfo}>
                      <div style={styles.historyTitle}>{session.title}</div>
                      <div style={styles.historyMeta}>
                        {session.mode} • {session.time}
              </div>
                    </div>
                    <div style={styles.historyDuration}>{session.duration}</div>
                  </div>
                ))
              )}
              </div>
          </div>
        </div>
      </div>

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} onLogout={() => window.location.reload()} />
      )}
    </div>
  );
};

// --- MODERN MINIMALIST STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: { 
    height: '100vh', width: '100vw', backgroundColor: '#050505', color: '#fff',
    fontFamily: '"Inter", sans-serif', overflow: 'hidden', position: 'relative'
  },
  content: {
    position: 'relative', zIndex: 10, padding: '32px', height: '100%', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'
  },
  brand: {
    fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px'
  },
  headerRight: {
    display: 'flex', gap: '16px', alignItems: 'center'
  },
  creditBadge: {
    background: userCredits?.plan === 'unlimited' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)',
    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
    color: userCredits?.plan === 'unlimited' ? '#fff' : '#fff'
  },
  stealthBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    padding: '6px 12px', borderRadius: '999px', color: '#ccc', fontSize: '12px',
    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
  },
  stealthDot: { width: '6px', height: '6px', borderRadius: '50%' },
  profileBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 0
  },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%', background: '#646cff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px'
  },
  dropdown: {
    position: 'absolute', top: '40px', right: 0, width: '200px', padding: '8px', zIndex: 100,
    backgroundColor: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)'
  },
  dropdownHeader: { padding: '8px 12px' },
  ddName: { fontSize: '14px', fontWeight: 600, color: '#fff' },
  ddEmail: { fontSize: '11px', color: '#888', marginTop: '2px' },
  dropdownDivider: { height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' },
  dropdownItem: {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px',
    background: 'none', border: 'none', color: '#ccc', fontSize: '13px', cursor: 'pointer',
    textAlign: 'left', borderRadius: '6px', transition: '0.2s'
  },
  
  mainGrid: {
    display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', flex: 1, overflow: 'hidden'
  },
  heroColumn: {
    display: 'flex', flexDirection: 'column', gap: '20px'
  },
  heroCard: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(100,108,255,0.1), rgba(100,108,255,0.02))'
  },
  heroContent: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
  },
  heroIconWrapper: {
    width: '64px', height: '64px', borderRadius: '20px', background: '#646cff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
    boxShadow: '0 10px 30px rgba(100,108,255,0.3)'
  },
  heroTitle: { fontSize: '32px', fontWeight: 700, margin: 0, letterSpacing: '-1px' },
  heroText: { fontSize: '16px', color: '#888', margin: 0 },
  primaryBtn: {
    marginTop: '16px', padding: '12px 32px', fontSize: '16px', fontWeight: 600,
    background: '#fff', color: '#000', border: 'none', borderRadius: '12px', cursor: 'pointer',
    transition: 'transform 0.2s', boxShadow: '0 4px 20px rgba(255,255,255,0.2)'
  },
  dangerBtn: {
    marginTop: '16px', padding: '12px 32px', fontSize: '16px', fontWeight: 600,
    background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '12px', cursor: 'pointer'
  },
  limitInfo: { marginTop: '12px', fontSize: '12px', color: '#666' },
  
  timerRing: {
    width: '160px', height: '160px', borderRadius: '50%', border: '4px solid rgba(100,108,255,0.3)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    marginBottom: '16px'
  },
  timerValue: { fontSize: '32px', fontWeight: 700, fontFamily: 'monospace' },
  timerLabel: { fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' },
  
  statsRow: { display: 'flex', gap: '20px', height: '100px' },
  statCard: {
    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    padding: '16px', background: 'rgba(255,255,255,0.03)'
  },
  statValue: { fontSize: '24px', fontWeight: 700, color: '#fff' },
  statLabel: { fontSize: '12px', color: '#666', marginTop: '4px' },
  
  historyColumn: {
    display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden'
  },
  sectionTitle: { fontSize: '14px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' },
  historyList: {
    display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '8px'
  },
  historyItem: {
    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
    transition: '0.2s', cursor: 'pointer'
  },
  historyIcon: {
    width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(100,108,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: '14px', fontWeight: 600, color: '#eee' },
  historyMeta: { fontSize: '12px', color: '#666', marginTop: '2px' },
  historyDuration: { fontSize: '13px', fontWeight: 500, color: '#888' },
  emptyHistory: { color: '#555', fontStyle: 'italic', fontSize: '14px' },
  creditWarning: {
    marginTop: '20px', padding: '16px', background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)',
    borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px'
  },
  warningIcon: { fontSize: '20px' },
  warningText: { flex: 1 },
  warningTitle: { fontSize: '14px', fontWeight: 600, color: '#ffc107' },
  warningSub: { fontSize: '12px', color: '#ccc', marginTop: '2px' },
  quickBuyBtn: {
    background: '#ffc107', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer'
  }
};

export default Dashboard;