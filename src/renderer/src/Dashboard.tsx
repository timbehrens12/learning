import React, { useState, useEffect, useRef } from 'react';
import LiquidBackground from './components/LiquidBackground';
import SettingsModal from './components/SettingsModal';
import { supabase, userCredits as userCreditsService } from './lib/supabase';
import { UserIcon, UserPlusIcon, CreditCardIcon, SettingsIcon, InstagramIcon, XLogoIcon, DiscordIcon } from './components/Icons';

// --- Types ---

interface Session {
  id: number;
  title: string;
  mode: string;
  duration: string;
  time: string;
}

const INITIAL_SESSIONS: Session[] = [
  { id: 1, title: "Calc 2 Homework", mode: "Solve", duration: "18m", time: "3:11 PM" },
  { id: 2, title: "Biology Lecture", mode: "Study", duration: "42m", time: "1:05 PM" },
  { id: 99, title: "OSPF Lab Quiz", mode: "Cheat", duration: "5m", time: "10:30 AM" },
];

const Dashboard: React.FC = () => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMode] = useState("Study");
  const [isDetectable, setIsDetectable] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<{ credits: number; plan: string } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem('user_sessions');
    const isPro = userCredits?.plan === 'pro' || userCredits?.plan === 'unlimited';
    if (saved) {
      return JSON.parse(saved);
    }
    return isPro ? INITIAL_SESSIONS : [];
  });
  
  const hasCredits = userCredits && (userCredits.plan === 'unlimited' || userCredits.credits > 0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Load Cheat mode visibility setting
  const [showCheatMode, setShowCheatMode] = useState(() => {
    const saved = localStorage.getItem('show_cheat_mode');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('show_cheat_mode');
      const newValue = saved !== null ? saved === 'true' : true;
      setShowCheatMode(newValue);
    };

    const handleCustomEvent = (e: CustomEvent) => {
      const newValue = e.detail;
      setShowCheatMode(newValue);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cheatModeSettingChanged', handleCustomEvent as EventListener);

    const saved = localStorage.getItem('show_cheat_mode');
    const newValue = saved !== null ? saved === 'true' : true;
    if (showCheatMode !== newValue) {
      setShowCheatMode(newValue);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cheatModeSettingChanged', handleCustomEvent as EventListener);
    };
  }, [showCheatMode]);

  // Mode Colors Helper

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleStartSession = () => {
    if (!hasCredits) return;
    setIsSessionActive(true);
    setSessionStartTime(new Date());
    setElapsedSeconds(0);
    
    if ((window as any).electron?.ipcRenderer) {
       (window as any).electron.ipcRenderer.send('open-overlay');
    }
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    if (sessionStartTime) {
      const deriveSessionTitle = (): string => {
        try {
          const raw = (localStorage.getItem('last_session_context') || '').trim();
          if (!raw) {
            const modeLabels: Record<string, string> = {
              'Study': 'Study Session',
              'Solve': 'Problem Solving Session',
              'Cheat': 'Quick Answer Session'
            };
            return modeLabels[selectedMode] || 'Session';
          }
          const lines = raw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          let title = '';
          for (const line of lines) {
            if (line.length < 10 || line.startsWith('http') || line.includes('Error:') || line.match(/^[^a-zA-Z]*$/)) {
              continue;
            }
            title = line;
            break;
          }
          if (!title && lines.length > 0) title = lines[0];
          title = title.replace(/\s+/g, ' ').replace(/[^\w\s\-.,:()]/g, '').trim();
          if (title.length > 60) title = title.slice(0, 57) + '...';
          if (!title || title.length < 3) {
             const modeLabels: Record<string, string> = {
              'Study': 'Study Session',
              'Solve': 'Problem Solving Session',
              'Cheat': 'Quick Answer Session'
            };
            return modeLabels[selectedMode] || 'Session';
          }
          return title;
        } catch {
          return 'Session';
        }
      };

      const newSession: Session = {
        id: Date.now(),
        title: deriveSessionTitle(),
        mode: selectedMode,
        duration: formatDuration(elapsedSeconds),
        time: sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions(prev => {
        const updated = [newSession, ...prev];
        localStorage.setItem('user_sessions', JSON.stringify(updated));
        return updated;
      });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('user_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error('Failed to load sessions from localStorage', e);
      }
    }
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      try {
        const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
        setUserName(profile?.display_name || user.email?.split('@')[0] || "");
      } catch (error) {
        setUserName(user.email?.split('@')[0] || "");
      }
      try {
        const credits = await userCreditsService.getCredits(user.id);
        setUserCredits(credits);
      } catch (error) {
        setUserCredits({ credits: 25, plan: 'free' });
      }
    }
  };

  useEffect(() => {
    loadUserData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserData();
    });
    const creditsInterval = setInterval(() => {
      if (userId) {
        userCreditsService.getCredits(userId).then(credits => {
          setUserCredits(credits);
        }).catch(err => console.error('Failed to refresh credits:', err));
      }
    }, 5000);
    return () => {
      subscription.unsubscribe();
      clearInterval(creditsInterval);
    };
  }, [userId]);

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
    if ((window as any).electron?.ipcRenderer) {
      (window as any).electron.ipcRenderer.send('set-detectable', newState);
    }
  };

  return (
    <div style={styles.container}>
      <LiquidBackground />

      {/* --- Sidebar Navigation --- */}
      <aside style={styles.sidebar}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.brandLogo}>
            <img src="./logo.png" alt="Visnly" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          </div>
          <span style={styles.brandText}>Visnly</span>
        </div>

        {/* Navigation Items */}
        <nav style={styles.nav}>
          <button style={styles.navButtonActive}>
            <div style={styles.navIconActive}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </div>
            <span style={styles.navText}>Dashboard</span>
          </button>

          <button style={styles.navButton}>
            <div style={styles.navIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <span style={styles.navText}>Activity</span>
          </button>

          <button 
            onClick={() => setShowSettingsModal(true)}
            style={styles.navButton}
          >
            <div style={styles.navIcon}>
              <SettingsIcon size={20} />
            </div>
            <span style={styles.navText}>Settings</span>
          </button>
        </nav>

        {/* User Mini Profile (Bottom Sidebar) */}
        <div style={styles.sidebarFooter}>
          <div 
            ref={profileRef}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={styles.profileButton}
          >
            <div style={styles.profileAvatar}>
              <UserIcon size={18} color="#fff" />
            </div>
            <div style={styles.profileInfo}>
              <div style={styles.profileName}>{userName || "Student"}</div>
              <div style={styles.profilePlan}>{userCredits?.plan === 'unlimited' ? 'Pro Plan' : 'Free Plan'}</div>
            </div>
            
            {/* Popover Menu */}
            {isProfileOpen && (
              <div style={styles.profileMenu}>
                <button style={styles.profileMenuItem}>
                  <UserPlusIcon size={16} color="rgba(255,255,255,0.6)" /> Invite Friends
                </button>
                <button style={styles.profileMenuItem}>
                  <CreditCardIcon size={16} color="rgba(255,255,255,0.6)" /> Billing
                </button>
                <div style={styles.profileDivider} />
                <button 
                  onClick={() => {
                    window.location.reload(); 
                  }}
                  style={styles.profileMenuItemLogout}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* --- Main Dashboard Content --- */}
      <main style={styles.main}>
        
        {/* Header Bar */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.headerTitle}>Overview</h1>
            <span style={styles.headerVersion}>v2.4.0-stable</span>
          </div>

          <div style={styles.headerRight}>
            {/* Credits Widget */}
            {userCredits && (
              <div style={styles.creditsWidget}>
                <div style={{
                  ...styles.creditsDot,
                  backgroundColor: userCredits.credits > 0 ? '#10b981' : '#ef4444',
                  boxShadow: userCredits.credits > 0 ? '0 0 8px rgba(16,185,129,0.5)' : 'none'
                }}></div>
                <span style={styles.creditsText}>
                  <span style={styles.creditsAmount}>{userCredits.plan === 'unlimited' ? '∞' : userCredits.credits}</span> CR
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Grid */}
        <div style={styles.dashboardGrid}>
          
          {/* Left Column: Stats & History */}
          <div style={styles.leftColumn}>
            
            {/* Status / Stealth Card */}
            <div style={styles.statusCard}>
              <div style={styles.statusHeader}>
                <span style={styles.statusLabel}>System Status</span>
                <div style={{
                  ...styles.statusIndicatorDot,
                  backgroundColor: isDetectable ? '#ef4444' : '#10b981'
                }} />
              </div>
              
              <div style={styles.statusContent}>
                <div style={styles.statusRow}>
                  <span style={styles.statusText}>Stealth Protocol</span>
                  <button
                    onClick={toggleDetectability}
                    style={{
                      ...styles.toggleButton,
                      backgroundColor: isDetectable ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.2)',
                      borderColor: isDetectable ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.5)'
                    }}
                  >
                    <div style={{
                      ...styles.toggleSwitch,
                      transform: isDetectable ? 'translateX(0)' : 'translateX(24px)',
                      backgroundColor: isDetectable ? '#9ca3af' : '#4ade80',
                      boxShadow: isDetectable ? 'none' : '0 0 10px rgba(74,222,128,0.6)'
                    }} />
                  </button>
                </div>
                <p style={styles.statusDescription}>
                  {isDetectable ? "Application is currently visible to detection scripts." : "Stealth mode active. Overlay is hidden from screen capture APIs."}
                </p>
              </div>
            </div>

            {/* History Feed */}
            <div style={styles.historyCard}>
              <div style={styles.historyHeader}>
                <h3 style={styles.historyTitle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(135, 206, 250, 0.9)' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  Recent Sessions
                </h3>
                <button style={styles.historyViewAll}>View All</button>
              </div>
              
              <div style={styles.historyList}>
                {sessions.length === 0 ? (
                  <div style={styles.emptyHistory}>
                    <div style={styles.emptyHistoryIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <p style={styles.emptyHistoryText}>No recent activity found.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} style={styles.historyItem}>
                      <div style={styles.historyItemLeft}>
                        <span style={styles.historyItemTitle}>{session.title}</span>
                        <div style={styles.historyItemMeta}>
                          <span>{session.time}</span>
                          <span style={styles.historyItemDot}>•</span>
                          <span style={session.mode === 'Cheat' ? { color: '#f87171' } : { color: 'rgba(255,255,255,0.5)' }}>{session.mode}</span>
                        </div>
                      </div>
                      <span style={styles.historyItemDuration}>{session.duration}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Main Interaction Area */}
          <div style={styles.rightColumn}>
            <div style={styles.mainCard}>
              {/* Background Gradients */}
              <div style={styles.cardGradient1} />
              <div style={styles.cardGradient2} />
              
              {/* Decorative Grid */}
              <div style={styles.cardGrid} />

              <div style={styles.mainCardContent}>
                
                {!isSessionActive ? (
                  <div style={styles.startSection}>
                    <div style={styles.startText}>
                      <h2 style={styles.startTitle}>
                        Ready to <span style={styles.startTitleAccent}>Focus?</span>
                      </h2>
                      <p style={styles.startSubtitle}>
                        Initialize your workspace. The AI overlay is currently in standby mode.
                      </p>
                    </div>
                    
                    <div style={styles.startButtonWrapper}>
                      <div style={styles.startButtonGlow} />
                      <button
                        onClick={handleStartSession}
                        disabled={!hasCredits}
                        style={{
                          ...styles.startButton,
                          opacity: !hasCredits ? 0.5 : 1,
                          cursor: !hasCredits ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <div style={styles.startButtonIcon}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </div>
                        <div style={styles.startButtonText}>
                          <span style={styles.startButtonLabel}>Command</span>
                          <span style={styles.startButtonAction}>START SESSION</span>
                        </div>
                      </button>
                    </div>

                    <div style={styles.hotkeyHint}>
                      <span>Hotkey:</span>
                      <kbd style={styles.kbd}>Ctrl</kbd>
                      <span>+</span>
                      <kbd style={styles.kbd}>Shift</kbd>
                      <span>+</span>
                      <kbd style={styles.kbd}>Space</kbd>
                    </div>
                  </div>
                ) : (
                  <div style={styles.activeSection}>
                    {/* Active Pulse Animation */}
                    <div style={styles.activePulse}>
                      <div style={styles.activePulseGlow} />
                      <div style={styles.activeContent}>
                        <div style={styles.activeLabel}>Session Active</div>
                        <div style={styles.activeTimer}>{formatTimerDisplay(elapsedSeconds)}</div>
                      </div>
                    </div>

                    <div style={styles.activeProgress}>
                      <div style={styles.activeProgressBar} />
                    </div>

                    <button
                      onClick={handleEndSession}
                      style={styles.endButton}
                    >
                      Terminate
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Info inside card */}
              <div style={styles.cardFooter}>
                <div style={styles.footerLeft}>
                  <div style={{
                    ...styles.footerDot,
                    backgroundColor: userCredits?.plan === 'unlimited' ? '#fbbf24' : '#6b7280'
                  }}></div>
                  <span>{userCredits?.plan === 'unlimited' ? 'Premium Connection' : 'Standard Connection'}</span>
                </div>
                <div style={styles.footerRight}>
                  LATENCY: 12ms
                </div>
              </div>
            </div>

            {/* Socials Row */}
            <div style={styles.socialsRow}>
              {[
                { icon: InstagramIcon, href: '#', label: 'Instagram' },
                { icon: XLogoIcon, href: '#', label: 'X' },
                { icon: DiscordIcon, href: '#', label: 'Discord' }
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.socialButton}
                >
                  <social.icon size={16} color="rgba(255,255,255,0.5)" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onLogout={() => {
            setShowSettingsModal(false);
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
};

// --- Styles ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    backgroundColor: '#050509',
    color: '#e5e7eb',
    overflow: 'hidden',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },

  // Sidebar
  sidebar: {
    position: 'relative',
    zIndex: 20,
    width: '64px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)'
  },
  brand: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  brandLogo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(135, 206, 250, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    boxShadow: '0 0 20px rgba(135, 206, 250, 0.2)'
  },
  brandText: {
    display: 'none',
    marginLeft: '12px',
    fontWeight: 'bold',
    fontSize: '18px',
    letterSpacing: '-0.5px',
    color: '#fff'
  },
  nav: {
    flex: 1,
    padding: '24px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: 500
  },
  navButtonActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  navIcon: {
    padding: '6px',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.5)',
    transition: 'color 0.2s'
  },
  navIconActive: {
    padding: '6px',
    borderRadius: '8px',
    backgroundColor: 'rgba(135, 206, 250, 0.2)',
    color: 'rgba(135, 206, 250, 0.9)',
    transition: 'all 0.2s'
  },
  navText: {
    display: 'none',
    fontSize: '14px',
    fontWeight: 500
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.05)'
  },
  profileButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  profileAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4b5563, #374151)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
  },
  profileInfo: {
    display: 'none',
    overflow: 'hidden'
  },
  profileName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },
  profilePlan: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },
  profileMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: '8px',
    width: '224px',
    padding: '6px',
    borderRadius: '12px',
    backgroundColor: '#111115',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
    zIndex: 1000
  },
  profileMenuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left' as const
  },
  profileMenuItemLogout: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#f87171',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left' as const
  },
  profileDivider: {
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: '4px 0'
  },

  // Main Content
  main: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden'
  },
  header: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    margin: 0
  },
  headerVersion: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'monospace'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  creditsWidget: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 16px',
    borderRadius: '999px',
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  creditsDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  creditsText: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.3)'
  },
  creditsAmount: {
    color: '#fff',
    fontWeight: 'bold'
  },
  dashboardGrid: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: '100%'
  },
  statusCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: '#0a0a0f',
    padding: '20px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  statusLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  },
  statusIndicatorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  statusContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  statusText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.3)'
  },
  toggleButton: {
    position: 'relative',
    width: '48px',
    height: '24px',
    borderRadius: '999px',
    border: '1px solid',
    transition: 'all 0.3s',
    cursor: 'pointer',
    outline: 'none'
  },
  toggleSwitch: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    transition: 'all 0.3s'
  },
  statusDescription: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 1.5
  },
  historyCard: {
    flex: 1,
    minHeight: '300px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: '#0a0a0f',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
  },
  historyHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)'
  },
  historyTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0
  },
  historyViewAll: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  historyList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  emptyHistory: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.3)',
    padding: '32px',
    textAlign: 'center' as const
  },
  emptyHistoryIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    color: 'rgba(255,255,255,0.2)'
  },
  emptyHistoryText: {
    fontSize: '14px'
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    transition: 'all 0.15s',
    cursor: 'pointer'
  },
  historyItemLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0
  },
  historyItemTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.3)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    transition: 'color 0.15s'
  },
  historyItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.5)'
  },
  historyItemDot: {
    width: '2px',
    height: '2px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  historyItemDuration: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  mainCard: {
    position: 'relative',
    flex: 1,
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: '#08080c',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column'
  },
  cardGradient1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '500px',
    height: '500px',
    backgroundColor: 'rgba(135, 206, 250, 0.05)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    pointerEvents: 'none'
  },
  cardGradient2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '400px',
    height: '400px',
    backgroundColor: 'rgba(135, 206, 250, 0.05)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    pointerEvents: 'none'
  },
  cardGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, #000 70%, transparent 100%)',
    pointerEvents: 'none'
  },
  mainCardContent: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 48px',
    textAlign: 'center' as const
  },
  startSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
    animation: 'fadeIn 0.5s ease-in'
  },
  startText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '448px'
  },
  startTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 1.1,
    letterSpacing: '-0.5px',
    margin: 0
  },
  startTitleAccent: {
    background: 'linear-gradient(to right, rgba(135, 206, 250, 0.9), rgba(135, 206, 250, 0.6))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  startSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 1.5
  },
  startButtonWrapper: {
    position: 'relative'
  },
  startButtonGlow: {
    position: 'absolute',
    inset: '-4px',
    background: 'linear-gradient(to right, rgba(135, 206, 250, 0.5), rgba(135, 206, 250, 0.3))',
    borderRadius: '16px',
    opacity: 0.2,
    filter: 'blur(8px)',
    transition: 'opacity 0.5s'
  },
  startButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 40px',
    backgroundColor: '#000',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  startButtonIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(135, 206, 250, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    boxShadow: '0 0 20px rgba(135, 206, 250, 0.3)'
  },
  startButtonText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  startButtonLabel: {
    fontSize: '10px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  },
  startButtonAction: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: '0.05em'
  },
  hotkeyHint: {
    marginTop: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.5)'
  },
  kbd: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'rgba(255,255,255,0.3)'
  },
  activeSection: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '48px'
  },
  activePulse: {
    position: 'relative'
  },
  activePulseGlow: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(135, 206, 250, 0.2)',
    filter: 'blur(60px)',
    borderRadius: '50%',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  activeContent: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  activeLabel: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'rgba(135, 206, 250, 0.9)',
    marginBottom: '8px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
  },
  activeTimer: {
    fontSize: '96px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: '-0.05em',
    fontVariantNumeric: 'tabular-nums',
    textShadow: '0 0 40px rgba(0,0,0,0.5)'
  },
  activeProgress: {
    width: '100%',
    maxWidth: '320px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '999px',
    height: '4px',
    overflow: 'hidden'
  },
  activeProgressBar: {
    height: '100%',
    backgroundColor: 'rgba(135, 206, 250, 0.5)',
    borderRadius: '999px',
    width: '33%',
    animation: 'width 2s ease-in-out infinite'
  },
  endButton: {
    padding: '12px 32px',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cardFooter: {
    position: 'relative',
    zIndex: 10,
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)'
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  footerDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  footerRight: {
    fontFamily: 'monospace',
    opacity: 0.5
  },
  socialsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px'
  },
  socialButton: {
    padding: '8px',
    borderRadius: '8px',
    backgroundColor: '#0a0a0f',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none'
  }
};

export default Dashboard;
