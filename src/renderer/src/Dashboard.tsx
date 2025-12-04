import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from './components/GlassCard';
import LiquidBackground from './components/LiquidBackground';
import SettingsModal from './components/SettingsModal';
import { supabase, userCredits as userCreditsService } from './lib/supabase';
import { UserIcon, UserPlusIcon, CreditCardIcon, HelpCircleIcon, SettingsIcon, InstagramIcon, XLogoIcon, DiscordIcon } from './components/Icons';

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
  { id: 99, title: "OSPF Lab Quiz", mode: "Cheat", duration: "5m", time: "10:30 AM" }
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMode] = useState("Study"); // Keep for session creation, but no UI
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
    // Load sessions from localStorage or use initial (only for pro users)
    const saved = localStorage.getItem('user_sessions');
    const isPro = userCredits?.plan === 'pro' || userCredits?.plan === 'unlimited';
    if (saved) {
      return JSON.parse(saved);
    }
    // Free users start with empty sessions, pro users get initial mock data
    return isPro ? INITIAL_SESSIONS : [];
  });
  // Check if user is pro
  const isProUser = userCredits?.plan === 'pro' || userCredits?.plan === 'unlimited';

  // Check if user has credits available
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
    return saved !== null ? saved === 'true' : true; // Default to showing
  });

  // Update Cheat mode visibility when setting changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('show_cheat_mode');
      const newValue = saved !== null ? saved === 'true' : true;
      setShowCheatMode(newValue);
      // If Cheat was selected and now hidden, switch to Study
      // If Cheat mode is hidden, selectedMode will default to 'Study' on next session
    };

    const handleCustomEvent = (e: CustomEvent) => {
      const newValue = e.detail;
      setShowCheatMode(newValue);
      // If Cheat mode is hidden, selectedMode will default to 'Study' on next session
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cheatModeSettingChanged', handleCustomEvent as EventListener);

    // Also check on mount/update
    const saved = localStorage.getItem('show_cheat_mode');
    const newValue = saved !== null ? saved === 'true' : true;
    if (showCheatMode !== newValue) {
      setShowCheatMode(newValue);
      // If Cheat mode is hidden, selectedMode will default to 'Study' on next session
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cheatModeSettingChanged', handleCustomEvent as EventListener);
    };
  }, [showCheatMode]);

  // Mode Colors Helper
  const getModeColor = (mode: string) => {
    if (mode === 'Study') return 'rgba(135, 206, 250, 0.8)'; // Sky blue
    if (mode === 'Solve') return '#0ea5e9'; // Cyan
    if (mode === 'Cheat') return '#ff5252'; // Red
    return 'rgba(135, 206, 250, 0.8)'; // Default to Study color
  };


  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const handleStartSession = () => {
    // Check if user has credits
    if (!hasCredits) {
      // User has no credits, could show a message or redirect to pricing
      return;
    }

    setIsSessionActive(true);
    setSessionStartTime(new Date());
    setElapsedSeconds(0);
    // Send signal to Main process
    (window as any).electron.ipcRenderer.send('open-overlay');
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

          // Clean and extract meaningful title
          const lines = raw.split('\n').map(line => line.trim()).filter(line => line.length > 0);

          // Try to find a meaningful title (skip very short lines, URLs, etc.)
          let title = '';
          for (const line of lines) {
            // Skip lines that are too short, URLs, or look like code/errors
            if (line.length < 10 ||
              line.startsWith('http') ||
              line.includes('Error:') ||
              line.match(/^[^a-zA-Z]*$/)) {
              continue;
            }

            // Take first meaningful line, but limit length
            title = line;
            break;
          }

          // If no good title found, use first line anyway
          if (!title && lines.length > 0) {
            title = lines[0];
          }

          // Clean up the title
          title = title
            .replace(/\s+/g, ' ') // Multiple spaces to single
            .replace(/[^\w\s\-.,:()]/g, '') // Remove special chars except common punctuation
            .trim();

          // Truncate if too long
          if (title.length > 60) {
            title = title.slice(0, 57) + '...';
          }

          // If still empty or too short, use mode-based default
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
          const modeLabels: Record<string, string> = {
            'Study': 'Study Session',
            'Solve': 'Problem Solving Session',
            'Cheat': 'Quick Answer Session'
          };
          return modeLabels[selectedMode] || 'Session';
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
        // Save to localStorage
        localStorage.setItem('user_sessions', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Load sessions from localStorage on mount
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

  // Load user data from Supabase
  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setUserEmail(user.email || "");
      // Try to get display name from profiles table
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '404') {
          console.error('Profile fetch error:', profileError);
        }

        setUserName(profile?.display_name || user.email?.split('@')[0] || "");
      } catch (error: any) {
        if (error?.code !== 'PGRST116' && error?.status !== 404) {
          console.error('Error loading profile:', error);
        }
        setUserName(user.email?.split('@')[0] || "");
      }

      // Load user credits
      try {
        const credits = await userCreditsService.getCredits(user.id);
        setUserCredits(credits);
      } catch (error) {
        console.error('Failed to load credits:', error);
        setUserCredits({ credits: 25, plan: 'free' });
      }
    }
  };

  useEffect(() => {
    loadUserData();

    // Refresh credits periodically
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

  // Helpers
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

  // HANDLE STEALTH MODE TOGGLE FROM DASHBOARD
  const toggleDetectability = () => {
    const newState = !isDetectable;
    setIsDetectable(newState);

    // Send signal to Main Process
    (window as any).electron?.ipcRenderer?.send('set-detectable', newState);
  };

  return (
    <div style={styles.container}>
      {/* Liquid Background like Overlay */}
      <LiquidBackground />

      {/* Background Gradient Blob for visual flair */}
      <div style={styles.backgroundBlob}></div>

      {/* --- Top Bar --- */}
      <header style={styles.topBar}>
        <div style={styles.logo}>
          <span style={{ color: '#fff' }}>Visnly</span>
        </div>

        <div style={styles.controls}>

          {/* Credit Display */}
          {userCredits && (
            <div style={{
              ...styles.creditBadge,
              background: userCredits.plan === 'unlimited'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(255,255,255,0.1)',
              color: '#fff'
            }}>
              {userCredits.plan === 'unlimited' ? 'PRO' : `${userCredits.credits} credits`}
            </div>
          )}

          <button
            onClick={toggleDetectability}
            style={styles.dropdownButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(20, 20, 25, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(20, 20, 25, 0.65)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={styles.toggleContainer}>
              <div
                style={{
                  ...styles.toggleSwitch,
                  backgroundColor: isDetectable ? '#d32f2f' : '#4caf50',
                  transform: isDetectable ? 'translateX(0)' : 'translateX(18px)',
                  boxShadow: isDetectable
                    ? '0 0 8px rgba(211, 47, 47, 0.5)'
                    : '0 0 8px rgba(76, 175, 80, 0.5)'
                }}
              />
            </div>
            <span>{isDetectable ? "Detectable" : "Undetectable"}</span>
          </button>

          <div style={styles.profileContainer} ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{
                ...styles.profile,
                backgroundColor: isProfileOpen ? 'rgba(255, 255, 255, 0.1)' : 'rgba(42, 42, 47, 0.6)'
              }}
              title="Profile"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1.1)';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) {
                  icon.style.color = '#fff';
                  icon.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProfileOpen) {
                  e.currentTarget.style.backgroundColor = 'rgba(42, 42, 47, 0.6)';
                  e.currentTarget.style.transform = 'scale(1)';
                  const icon = e.currentTarget.querySelector('svg');
                  if (icon) {
                    icon.style.color = '#aaa';
                    icon.style.filter = 'none';
                  }
                }
              }}
            >
              <UserIcon size={18} color={isProfileOpen ? "#fff" : "#aaa"} />
            </button>

            {isProfileOpen && (
              <GlassCard style={styles.profileMenu}>
                {/* User Info Section */}
                <div style={styles.profileHeader}>
                  <div style={styles.profileName}>{userName || "User"}</div>
                  <div style={styles.profileEmail}>{userEmail || ""}</div>
                </div>
                <div style={styles.profileDivider}></div>

                {/* Menu Items */}
                <div style={styles.profileMenuItem}
                  onClick={() => {
                    // Handle invite friends
                    setIsProfileOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <UserPlusIcon size={16} color="#aaa" />
                  <span>Invite Friends</span>
                </div>

                <div style={styles.profileMenuItem}
                  onClick={() => {
                    // Handle billing
                    setIsProfileOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <CreditCardIcon size={16} color="#aaa" />
                  <span>Billing</span>
                </div>

                <div style={styles.profileMenuItem}
                  onClick={() => {
                    // Handle get help
                    setIsProfileOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <HelpCircleIcon size={16} color="#aaa" />
                  <span>Get help</span>
                </div>

                <div style={styles.profileMenuItem}
                  onClick={() => {
                    setShowSettingsModal(true);
                    setIsProfileOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <SettingsIcon size={16} color="#aaa" />
                  <span>Settings</span>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Area --- */}
      <main style={styles.main}>
        {(
          <>
            {/* Active / Start Section */}
            <div style={styles.heroSection}>
              {!isSessionActive ? (
                <GlassCard style={styles.startCard}>
                  <h2 style={styles.heroTitle}>{t('ready_to_learn')}</h2>
                  <p style={styles.heroSub}>{t('ai_assistant_standby')}</p>

                  {!hasCredits && (
                    <div style={styles.sessionLimit}>
                      <span style={styles.limitReached}>No credits remaining. Please purchase more credits to continue.</span>
                    </div>
                  )}

                  <button
                    onClick={handleStartSession}
                    className="start-session-button"
                    disabled={!hasCredits}
                    style={{
                      marginBottom: '12px',
                      opacity: !hasCredits ? 0.5 : 1,
                      cursor: !hasCredits ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {t('button_start')}
                  </button>

                  {/* Test Onboarding Button - Remove in production */}
                  <button
                    onClick={async () => {
                      localStorage.removeItem('onboarding_complete');
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.user) {
                          await supabase
                            .from('profiles')
                            .update({ onboarding_complete: false })
                            .eq('id', session.user.id);
                        }
                      } catch (error) {
                        console.log('Onboarding reset (Supabase update skipped):', error);
                      }
                      window.location.reload();
                    }}
                    style={{
                      ...styles.secondaryBtn,
                      marginBottom: '12px',
                      fontSize: '12px',
                      padding: '8px 16px',
                      background: 'rgba(100, 108, 255, 0.2)',
                      border: '1px solid rgba(100, 108, 255, 0.4)',
                      color: 'rgba(135, 206, 250, 0.9)'
                    }}
                    title="Test Onboarding Flow"
                  >
                    🧪 Test Onboarding
                  </button>

                  <p style={styles.hotkeyHint}>
                    Press <kbd style={styles.kbd}>Ctrl</kbd> + <kbd style={styles.kbd}>Shift</kbd> + <kbd style={styles.kbd}>Space</kbd>
                  </p>
                </GlassCard>
              ) : (
                <GlassCard style={styles.activeCard}>
                  <div style={styles.activeSessionContent}>
                    <div style={styles.sessionStatusRow}>
                      <div style={styles.statusIndicator}>
                        <div style={styles.statusDot}></div>
                        <span style={styles.statusLabel}>{t('session_in_progress')}</span>
                      </div>
                      <span style={styles.timer}>{formatTimerDisplay(elapsedSeconds)}</span>
                    </div>
                    <button
                      onClick={handleEndSession}
                      style={styles.endBtn}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(211, 47, 47, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(211, 47, 47, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(211, 47, 47, 0.4)';
                      }}
                    >
                      {t('button_end')}
                    </button>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* --- History List (simpler, Cluely-style) --- */}
            <div style={styles.historySection}>
              <h3 style={styles.sectionHeader}>{t('recent_activity')}</h3>
              <div style={styles.listContainer}>
                {sessions.length === 0 && (
                  <div style={styles.emptyHistory}>
                    <span style={styles.emptyHistoryTitle}>No sessions yet</span>
                    <span style={styles.emptyHistorySub}>Your recent sessions will appear here.</span>
                  </div>
                )}
                {sessions.map(session => (
                  <div key={session.id} style={styles.row}>
                    <div style={styles.rowLeft}>
                      <div style={styles.rowTextBlock}>
                        <div style={styles.rowTitle}>{session.title}</div>
                        <div style={styles.rowMeta}>
                          <span style={styles.modePill}>
                            <span
                              style={{
                                ...styles.modeDot,
                                backgroundColor: getModeColor(session.mode)
                              }}
                            />
                            <span>{session.mode}</span>
                          </span>
                          <span style={styles.rowDividerDot}>•</span>
                          <span style={styles.rowSub}>{session.time}</span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.rowRight}>
                      <div style={styles.rowTime}>{session.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <SettingsModal
            onClose={() => setShowSettingsModal(false)}
            onLogout={() => {
              // Reset onboarding or clear tokens here
              setShowSettingsModal(false);
              window.location.reload(); // Quick way to reset app state for V1
            }}
          />
        )}
      </main>

      {/* Social links – bottom right */}
      <div style={styles.socialBar}>
        <button
          type="button"
          style={styles.socialIconButton}
          onClick={() => window.open('https://instagram.com/yourhandle', '_blank')}
          title="Instagram"
        >
          <InstagramIcon size={16} color="#c9c9ff" />
        </button>
        <button
          type="button"
          style={styles.socialIconButton}
          onClick={() => window.open('https://x.com/yourhandle', '_blank')}
          title="X"
        >
          <XLogoIcon size={16} color="#c9c9ff" />
        </button>
        <button
          type="button"
          style={styles.socialIconButton}
          onClick={() => window.open('https://discord.gg/yourserver', '_blank')}
          title="Discord"
        >
          <DiscordIcon size={16} color="#c9c9ff" />
        </button>
      </div>
    </div>
  );
};


// --- Styles (CSS-in-JS for V1 speed) ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    backgroundColor: '#050509', // Match overlay vibe: deep neutral
    backgroundImage: 'radial-gradient(circle at top, rgba(135, 206, 250, 0.15) 0, transparent 55%)',
    color: '#e0e0e0',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  backgroundBlob: {
    position: 'absolute',
    top: '-50%',
    left: '20%',
    width: '60%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(100, 108, 255, 0.08) 0%, rgba(0,0,0,0) 70%)',
    zIndex: 0,
    pointerEvents: 'none'
  },
  topBar: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    zIndex: 10,
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  logo: { fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' },
  controls: { display: 'flex', alignItems: 'center', gap: '20px' },
  controlGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  label: { fontSize: '12px', color: '#666', fontWeight: 600, textTransform: 'uppercase' },
  dropdownButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(20, 20, 25, 0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    outline: 'none',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
    height: '36px',
    minHeight: '36px'
  },
  creditBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  },
  toggleContainer: {
    position: 'relative',
    width: '36px',
    height: '18px',
    borderRadius: '9px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center'
  },
  toggleSwitch: {
    position: 'absolute',
    top: '1px',
    left: '1px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    transition: 'all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)',
    boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)'
  },
  profileContainer: {
    position: 'relative',
    zIndex: 100
  },
  profile: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(42, 42, 47, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
    padding: 0,
    outline: 'none'
  },
  profileMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    minWidth: '240px',
    padding: '12px 0',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column'
  },
  profileHeader: {
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  profileName: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  profileEmail: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  profileDivider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '8px 0'
  },
  profileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.9)',
    cursor: 'pointer',
    transition: 'all 0.15s ease-out',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: 500
  },

  main: { flex: 1, padding: '40px', overflowY: 'auto', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },

  heroSection: { width: '100%', maxWidth: '500px', marginBottom: '50px', marginTop: '20px' },
  heroTitle: { fontSize: '32px', fontWeight: 700, margin: '0 0 10px 0', textAlign: 'center' as const },
  heroSub: { fontSize: '16px', color: '#888', margin: '0 0 30px 0', textAlign: 'center' as const },

  startCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px 40px',
    textAlign: 'center' as const
  },
  startBtn: {
    padding: '18px 60px',
    fontSize: '16px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, rgba(135, 206, 250, 0.3) 0%, rgba(135, 206, 250, 0.15) 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(100, 108, 255, 0.3)',
    transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
    letterSpacing: '0.5px',
    marginTop: '10px'
  },
  hotkeyHint: { marginTop: '20px', color: '#666', fontSize: '16px', fontWeight: 500 },
  kbd: { backgroundColor: '#222', padding: '4px 8px', borderRadius: '4px', border: '1px solid #333', fontFamily: 'monospace', color: '#ccc', fontSize: '14px', fontWeight: 600 },
  sessionLimit: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '16px',
    fontWeight: 500,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  limitReached: {
    color: '#ff8a80',
    fontWeight: 600,
    marginLeft: '8px'
  },
  limitOptionsCard: {
    marginTop: '20px',
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    backgroundColor: 'rgba(15, 15, 20, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 14px 35px rgba(0, 0, 0, 0.55)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  limitOptionsHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  limitOptionsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.92)'
  },
  limitOptionsSub: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 1.5
  },
  limitOptionsButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px'
  },
  limitPrimaryButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, rgba(135, 206, 250, 0.3), rgba(135, 206, 250, 0.15))',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 10px 25px rgba(100, 108, 255, 0.45)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  limitSecondaryButton: {
    padding: '9px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(25, 25, 30, 0.9)',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  secondaryBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    background: 'transparent',
    color: '#888',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  activeCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '16px'
  },
  activeSessionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sessionStatusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'rgba(135, 206, 250, 0.3)',
    animation: 'pulse-status 2s ease-in-out infinite'
  },
  statusLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
    letterSpacing: '0.5px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  timer: {
    fontSize: '24px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: '0.5px'
  },
  endBtn: {
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: '#ff8a80',
    border: '1px solid rgba(211, 47, 47, 0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '13px',
    transition: 'all 0.2s ease',
    alignSelf: 'flex-start',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },

  historySection: { width: '100%', maxWidth: '600px' },
  sectionHeader: { fontSize: '13px', color: '#777', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
  emptyHistory: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px dashed rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(15,15,18,0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  emptyHistoryTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.8)'
  },
  emptyHistorySub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: 'rgba(15,15,18,0.9)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.03)',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease'
  },
  rowLeft: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 },
  rowTextBlock: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  rowTitle: { fontWeight: 500, fontSize: '14px', color: '#f5f5f5', whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis', overflow: 'hidden' },
  rowMeta: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  modePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 8px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  modeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '999px'
  },
  rowDividerDot: {
    opacity: 0.4
  },
  rowSub: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  rowRight: { textAlign: 'right' as const, marginLeft: '12px', flexShrink: 0 },
  rowTime: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 },
  socialBar: {
    position: 'fixed',
    right: 24,
    bottom: 18,
    display: 'flex',
    gap: 8,
    zIndex: 20
  },
  socialIconButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(15,15,20,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease'
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  }
};


export default Dashboard;
