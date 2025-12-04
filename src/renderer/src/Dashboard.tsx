import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import GlassCard from './components/GlassCard';
import LiquidBackground from './components/LiquidBackground';
import SettingsModal from './components/SettingsModal';
import { supabase, userCredits as userCreditsService } from './lib/supabase';
import { UserIcon, UserPlusIcon, CreditCardIcon, HelpCircleIcon, SettingsIcon, InstagramIcon, XLogoIcon, DiscordIcon, PlayIcon, BarChart3Icon, ZapIcon, BookOpenIcon, ClockIcon, TargetIcon } from './components/Icons';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

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
    if (mode === 'Study') return '#8b5cf6'; // Violet
    if (mode === 'Solve') return '#0ea5e9'; // Cyan
    if (mode === 'Cheat') return '#ff5252'; // Red
    return '#8b5cf6'; // Default to Study color
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
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden">
      <LiquidBackground />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex items-center justify-between p-6 border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <ZapIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Visnly Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Credits Badge */}
          {userCredits && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                userCredits.plan === 'unlimited'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              {userCredits.plan === 'unlimited' ? 'PRO' : `${userCredits.credits} credits`}
            </motion.div>
          )}

          {/* Stealth Toggle */}
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={toggleDetectability}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="relative w-8 h-4 rounded-full bg-gray-600 transition-colors">
              <motion.div
                className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                  isDetectable ? 'bg-red-500 left-0.5' : 'bg-green-500 left-4.5'
                }`}
                animate={{ x: isDetectable ? 0 : 16 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              {isDetectable ? "Detectable" : "Undetectable"}
            </span>
          </motion.button>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group"
            >
              <UserIcon
                size={18}
                className={`transition-colors ${isProfileOpen ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
              />
            </motion.button>

            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-12 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl p-4 z-50"
              >
                {/* User Info */}
                <div className="mb-4 pb-4 border-b border-white/5">
                  <div className="text-sm font-semibold text-white">{userName || "User"}</div>
                  <div className="text-xs text-gray-400">{userEmail || ""}</div>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm">
                    <UserPlusIcon size={16} className="text-gray-400" />
                    <span className="text-gray-300">Invite Friends</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm">
                    <CreditCardIcon size={16} className="text-gray-400" />
                    <span className="text-gray-300">Billing</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm">
                    <HelpCircleIcon size={16} className="text-gray-400" />
                    <span className="text-gray-300">Get Help</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsModal(true);
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                  >
                    <SettingsIcon size={16} className="text-gray-400" />
                    <span className="text-gray-300">Settings</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 p-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Quick Actions Row */}
          <motion.div variants={cardVariants} className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Ready to Study</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Session Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-black/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <PlayIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Start Session</h3>
                      <p className="text-sm text-gray-400">Launch Visnly overlay</p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartSession}
                    disabled={!hasCredits}
                    className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hasCredits ? 'Start Studying' : 'No Credits Available'}
                  </button>
                </div>
              </motion.div>

              {/* Credits Status Card */}
              {userCredits && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-black/40 border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      userCredits.plan === 'unlimited'
                        ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'
                        : 'bg-yellow-500/20'
                    }`}>
                      <ZapIcon className={`w-6 h-6 ${
                        userCredits.plan === 'unlimited' ? 'text-emerald-400' : 'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Credits</h3>
                      <p className="text-sm text-gray-400">
                        {userCredits.plan === 'unlimited' ? 'Unlimited' : `${userCredits.credits} remaining`}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {userCredits.plan === 'unlimited' ? '∞' : userCredits.credits}
                  </div>
                </motion.div>
              )}

              {/* Recent Sessions Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-black/40 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Recent</h3>
                    <p className="text-sm text-gray-400">Last session</p>
                  </div>
                </div>
                <div className="text-sm text-gray-300">
                  {sessions.length > 0
                    ? `${sessions[0].title} • ${sessions[0].duration}`
                    : 'No sessions yet'
                  }
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Session History */}
          {sessions.length > 0 && (
            <motion.div variants={cardVariants} className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Session History</h3>
              <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6">
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            session.mode === 'Study' ? 'bg-indigo-500/20 text-indigo-400' :
                            session.mode === 'Solve' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {session.mode === 'Study' ? <BookOpenIcon size={18} /> :
                             session.mode === 'Solve' ? <TargetIcon size={18} /> :
                             <ZapIcon size={18} />}
                          </div>
                          <div>
                            <div className="font-medium text-white">{session.title}</div>
                            <div className="text-sm text-gray-400">{session.mode} • {session.time}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">{session.duration}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Session Status */}
          {isSessionActive && (
            <motion.div
              variants={cardVariants}
              className="mb-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center animate-pulse">
                    <TargetIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Session Active</h3>
                    <p className="text-sm text-gray-400">Visnly overlay is running</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-white">{formatTimerDisplay(elapsedSeconds)}</div>
                  <div className="text-sm text-gray-400">elapsed</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Overview */}
          <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{sessions.length}</div>
              <div className="text-sm text-gray-400">Total Sessions</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">
                {sessions.reduce((acc, s) => acc + parseInt(s.duration), 0)}m
              </div>
              <div className="text-sm text-gray-400">Study Time</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {userCredits?.credits || 0}
              </div>
              <div className="text-sm text-gray-400">Credits Left</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">
                {isProUser ? 'PRO' : 'FREE'}
              </div>
              <div className="text-sm text-gray-400">Plan</div>
            </div>
          </motion.div>
        </div>
      </motion.main>
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
                  color: '#646cff'
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
      </motion.main>
    </div>
  );
};


// --- Styles (CSS-in-JS for V1 speed) ---
const styles: Record<string, React.CSSProperties> = {
  container: { 
    height: '100vh', 
    backgroundColor: '#050509', // Match overlay vibe: deep neutral
    backgroundImage: 'radial-gradient(circle at top, rgba(100,108,255,0.25) 0, transparent 55%)',
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
    background: 'linear-gradient(135deg, #646cff 0%, #4c54d4 100%)', 
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
    background: 'linear-gradient(135deg, #646cff, #4c54d4)',
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
    backgroundColor: '#646cff',
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
