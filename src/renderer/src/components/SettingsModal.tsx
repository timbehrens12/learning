import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import { supabase } from '../lib/supabase';
import { UserIcon, CreditCardIcon, SettingsIcon, KeyboardIcon, HelpCircleIcon, ScaleIcon, BookIcon, BugIcon, ZapIcon, MessageCircleIcon, ShieldIcon, ExternalLinkIcon, CheckIcon, ChevronDownIcon, MailIcon } from './Icons';

interface SettingsProps {
  onClose: () => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsProps> = ({ onClose, onLogout }) => {
  const { t, i18n } = useTranslation();
  
  // Map language codes to display names
  const languageCodeToDisplay: Record<string, string> = {
    'en': 'English (US)',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'zh': 'Mandarin (中文)',
    'pt': 'Portuguese (Português)'
  };
  
  // Map display names to language codes
  const languageDisplayToCode: Record<string, string> = {
    'English (US)': 'en',
    'Spanish (Español)': 'es',
    'French (Français)': 'fr',
    'Mandarin (中文)': 'zh',
    'Portuguese (Português)': 'pt'
  };
  
  // Get initial language from localStorage or i18n
  const getInitialLanguage = (): string => {
    const stored = localStorage.getItem('app_lang');
    if (stored && languageDisplayToCode[stored]) {
      return stored;
    }
    // Fallback to i18n current language
    return languageCodeToDisplay[i18n.language] || 'English (US)';
  };
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState(getInitialLanguage());
  const [isRecordingKey, setIsRecordingKey] = useState(false);
  const [hotkey, setHotkey] = useState("Ctrl + Shift + Space");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Load user data from Supabase
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        // Try to get display name from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        if (profile?.display_name) {
          setDisplayName(profile.display_name);
        } else {
          // Fallback to email username
          setDisplayName(user.email?.split('@')[0] || "");
        }
      }
    };
    loadUserData();
  }, []);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageDropdownOpen]);
  
  // Sync language state with i18n when component mounts or i18n changes
  useEffect(() => {
    const currentDisplay = languageCodeToDisplay[i18n.language] || 'English (US)';
    if (language !== currentDisplay) {
      setLanguage(currentDisplay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);
  
  // Update language state and trigger i18n change immediately
  const handleLanguageChange = (displayName: string) => {
    setLanguage(displayName);
    const langCode = languageDisplayToCode[displayName] || 'en';
    i18n.changeLanguage(langCode);
    localStorage.setItem('app_lang', displayName); // Persist preference
  };

  // ==========================================
  // 🧠 THE FUNCTION CONTENT (LOGIC LAYER)
  // ==========================================

  // 1. SYSTEM ACTIONS
  const handleQuitApp = () => {
    // Sends signal to Main process to kill the app
    // @ts-ignore
    if ((window as any).electron?.ipcRenderer) {
      (window as any).electron.ipcRenderer.send('quit-app');
    }
  };

  const handleSignOut = async () => {
    // 1. Sign out from Supabase
    await supabase.auth.signOut();
    // 2. Clear local storage / tokens
    localStorage.clear();
    // 3. Trigger the logout prop to reset the UI state
    onLogout();
  };

  // 2. EXTERNAL LINKS (Billing, Legal, Support)
  // We use window.open to launch the user's default browser (Chrome/Edge)
  const openExternal = (url: string) => {
    window.open(url, '_blank');
  };

  // 3. PROFILE ACTIONS
  const handleUpdateProfile = () => {
    // TODO: Connect to backend API
    console.log("Saving profile:", { displayName, language });
    // Language is already updated immediately via handleLanguageChange, so we just save other profile data
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000); // Hide after 3 seconds
  };

  const handleDeleteAccount = () => {
    const confirmText = prompt("Type 'DELETE' to permanently erase your account.");
    if (confirmText === 'DELETE') {
      // TODO: Call API to delete user
      console.log("Account deleted");
      handleSignOut();
    }
  };

  // 4. BILLING ACTIONS
  const handleManageSubscription = (planType: 'free' | 'pro') => {
    if (planType === 'pro') {
      openExternal('https://buy.stripe.com/your_pro_link_id'); // Replace with real Stripe link
    } else {
      openExternal('https://billing.stripe.com/p/login/your_portal_id'); // Customer portal
    }
  };

  // 5. KEYBIND RECORDER
  useEffect(() => {
    if (isRecordingKey) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Ignore modifier-only presses
        if (['Control', 'Shift', 'Alt', 'Meta', 'OS'].includes(e.key)) return;

        const mods = [];
        if (e.ctrlKey || e.metaKey) mods.push(e.metaKey ? 'Cmd' : 'Ctrl');
        if (e.shiftKey) mods.push('Shift');
        if (e.altKey) mods.push('Alt');
        const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;

        const newCombo = [...mods, key].join(' + ');
        setHotkey(newCombo);
        setIsRecordingKey(false);
        
        // Send to Electron Main Process to register globally
        if ((window as any).electron?.ipcRenderer) {
          (window as any).electron.ipcRenderer.send('update-hotkey', newCombo.replace('Ctrl', 'CommandOrControl').replace('Cmd', 'CommandOrControl'));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isRecordingKey]);

  // ==========================================
  // 🎨 THE UI RENDERER
  // ==========================================

  const renderContent = () => {
    switch (activeTab) {
      
      // --- PROFILE TAB ---
      case 'profile':
        return (
          <div style={styles.animateFade}>
            <h2 style={styles.heading}>Account Identity</h2>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Display Name</label>
              <input 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                style={styles.input}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(100, 108, 255, 0.5)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(100, 108, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input 
                value={email} 
                disabled 
                style={{
                  ...styles.input, 
                  opacity: 0.5, 
                  cursor: 'not-allowed',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderColor: 'rgba(255,255,255,0.05)'
                }} 
              />
              <div style={styles.microHint}>Email cannot be changed via the app for security.</div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <button onClick={() => openExternal('https://visnly.com/reset-password')} style={styles.secondaryBtn}>
                Request Password Reset
              </button>
            </div>

            <div style={styles.divider}></div>
            
            <h3 style={{...styles.heading, color: '#ff5252', fontSize: '14px'}}>Danger Zone</h3>
            <div style={styles.dangerBox}>
              <div>
                <div style={{fontWeight: 700, fontSize: '13px'}}>Delete Account</div>
                <div style={{fontSize: '11px', opacity: 0.7}}>Permanently remove all data.</div>
              </div>
              <button onClick={handleDeleteAccount} style={styles.dangerBtn}>Delete</button>
            </div>

            <div style={styles.actionRow}>
               <button onClick={handleUpdateProfile} style={styles.primaryBtn}>{t('button_save')}</button>
            </div>
          </div>
        );

      // --- GENERAL / PREFERENCES TAB ---
      case 'general':
        return (
          <div style={styles.animateFade}>
            <h2 style={styles.heading}>App Preferences</h2>
            
            {/* Language Selector */}
            <div style={styles.row}>
              <div>
                <div style={styles.label}>{t('interface_language_label')}</div>
                <div style={styles.microHint}>{t('ai_response_hint')}</div>
              </div>
              <div style={{ position: 'relative' }} ref={languageDropdownRef}>
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  style={styles.languageDropdownButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                  }}
                >
                  <span>{language}</span>
                  <ChevronDownIcon size={14} color="#ccc" />
                </button>
                {isLanguageDropdownOpen && (
                  <GlassCard style={styles.languageDropdownMenu}>
                    {Object.values(languageCodeToDisplay).map((lang) => (
                      <div
                        key={lang}
                        onClick={() => {
                          handleLanguageChange(lang);
                          setIsLanguageDropdownOpen(false);
                        }}
                        style={{
                          ...styles.languageDropdownItem,
                          backgroundColor: language === lang ? 'rgba(100, 108, 255, 0.15)' : 'transparent',
                          color: language === lang ? '#fff' : '#ccc'
                        }}
                        onMouseEnter={(e) => {
                          if (language !== lang) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (language !== lang) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {lang}
                        {language === lang && <CheckIcon size={14} color="rgba(255,255,255,0.7)" />}
                      </div>
                    ))}
                  </GlassCard>
                )}
              </div>
            </div>


            <div style={styles.divider}></div>

            {/* Reset Onboarding */}
            <div style={styles.row}>
              <div>
                <div style={styles.label}>Reset Onboarding</div>
                <div style={styles.microHint}>Show the onboarding flow again (useful for testing)</div>
              </div>
              <button 
                onClick={async () => {
                  localStorage.removeItem('onboarding_complete');
                  // Also clear from Supabase if logged in
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                      await supabase
                        .from('profiles')
                        .update({ onboarding_complete: false })
                        .eq('id', session.user.id);
                    }
                  } catch (error) {
                    // Ignore errors if column doesn't exist
                    console.log('Onboarding reset (Supabase update skipped):', error);
                  }
                  alert('Onboarding reset! The app will reload to show the onboarding flow.');
                  window.location.reload();
                }}
                style={styles.secondaryBtn}
              >
                Reset Onboarding
              </button>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.row}>
              <button onClick={handleSignOut} style={styles.secondaryBtn}>{t('sign_out')}</button>
              <button onClick={handleQuitApp} style={styles.secondaryBtn}>{t('quit_app')}</button>
            </div>
          </div>
        );

      // --- BILLING TAB ---
      case 'billing':
        return (
          <div style={styles.animateFade}>
            <h2 style={styles.heading}>{t('subscription_plans')}</h2>
            
            <div style={styles.billingGrid}>
              {/* FREE CARD */}
              <div style={styles.planCard}>
                <div style={styles.planName}>{t('basic')}</div>
                <div style={styles.planPrice}>{t('free')}</div>
                <ul style={styles.featureList}>
                  <li>✓ 15 AI Scans / Day</li>
                  <li>✓ Basic Study Mode</li>
                  <li>✓ Community Support</li>
                </ul>
                <button 
                  style={{...styles.secondaryBtn, width: '100%', marginTop: 'auto'}}
                  disabled
                >
                  {t('current_plan')}
                </button>
              </div>

              {/* PRO CARD */}
              <div style={{...styles.planCard, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)'}}>
                <div style={{...styles.planName, color: 'rgba(255,255,255,0.7)'}}>{t('scholar_pro')}</div>
                <div style={styles.planPrice}>$9.99<span style={{fontSize: '14px'}}>/mo</span></div>
                <ul style={styles.featureList}>
                  <li>✓ Unlimited Scans</li>
                  <li>✓ Advanced Solve & Cheat Modes</li>
                  <li>✓ Transcript Analysis</li>
                  <li>✓ Stealth Priority</li>
                </ul>
                <button 
                  onClick={() => handleManageSubscription('pro')}
                  style={{...styles.primaryBtn, width: '100%', marginTop: 'auto'}}
                >
                  {t('upgrade_now')}
                </button>
              </div>
            </div>
            
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <button onClick={() => handleManageSubscription('free')} style={styles.textLink}>
                Manage existing subscription via Stripe
              </button>
            </div>
          </div>
        );

      // --- SUPPORT TAB ---
      case 'support':
        return (
          <div style={styles.animateFade}>
            <h2 style={styles.heading}>Help Center</h2>
            <div style={styles.linkList}>
              <div style={styles.linkItem} onClick={() => openExternal('https://visnly.com/help')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <BookIcon size={16} color="#aaa" />
                  <span>Documentation & Guides</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
              <div style={styles.linkItem} onClick={() => openExternal('https://visnly.com/bug-report')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <BugIcon size={16} color="#aaa" />
                  <span>Report a Bug</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
              <div style={styles.linkItem} onClick={() => openExternal('https://visnly.com/changelog')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <ZapIcon size={16} color="#aaa" />
                  <span>View Changelog (v1.0.0)</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
              <div style={styles.linkItem} onClick={() => openExternal('https://discord.gg/visnly')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <MessageCircleIcon size={16} color="#aaa" />
                  <span>Join Discord Community</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
              <div style={styles.linkItem} onClick={() => openExternal('mailto:support@visnly.com')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <MailIcon size={16} color="#aaa" />
                  <span>Contact Support</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
            </div>
          </div>
        );

      // --- KEYBINDS TAB ---
      case 'keybinds':
        return (
          <div style={styles.animateFade}>
            <h2 style={styles.heading}>Keybinds</h2>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Summon Overlay</label>
              <div style={styles.microHint}>Global hotkey to open/hide the overlay window.</div>
              <div style={{display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px'}}>
                <button 
                  onClick={() => setIsRecordingKey(true)}
                  style={{
                    ...styles.keybindBtn,
                    borderColor: isRecordingKey ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                    color: isRecordingKey ? 'rgba(255,255,255,0.8)' : '#fff',
                    backgroundColor: isRecordingKey ? 'rgba(100, 108, 255, 0.1)' : 'rgba(0,0,0,0.3)'
                  }}
                >
                  {isRecordingKey ? "Press Keys..." : hotkey}
                </button>
                {isRecordingKey && (
                  <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic'}}>
                    Listening for key combination...
                  </div>
                )}
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.inputGroup}>
              <h3 style={{fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#fff'}}>Overlay Controls</h3>
              <div style={{...styles.microHint, marginBottom: '16px'}}>These shortcuts work when the overlay window is active.</div>
              <div style={styles.shortcutList}>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Quick Analyze</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Capture screen and run AI analysis</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + Enter</kbd>
                </div>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Capture Screen Only</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Scan screen without running AI</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + S</kbd>
                </div>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Explain Mode</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Switch to Study/Explain mode</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + 1</kbd>
                </div>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Solve Mode</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Switch to Solve mode</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + 2</kbd>
                </div>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Cheat Mode</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Switch to quick answer mode</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + 3</kbd>
                </div>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Toggle Interface</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Show/hide the overlay card</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + \</kbd>
                </div>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Move Overlay</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Move window in any direction</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + Arrow Keys</kbd>
                </div>
              </div>
            </div>

            <div style={styles.divider}></div>

            <div style={styles.inputGroup}>
              <h3 style={{fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#fff'}}>Default Shortcuts</h3>
              <div style={styles.shortcutList}>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Open Overlay</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Toggle overlay window visibility</div>
                  </div>
                  <kbd style={styles.kbd}>Ctrl + Shift + Space</kbd>
                </div>
                <div style={styles.shortcutItem}>
                  <div>
                    <div style={{fontWeight: 500, fontSize: '13px', color: '#ccc'}}>Close Overlay</div>
                    <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>Hide overlay window</div>
                  </div>
                  <kbd style={styles.kbd}>Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        );

      // --- LEGAL TAB ---
      case 'legal':
        return (
          <div style={styles.animateFade}>
            <h2 style={styles.heading}>Legal & Compliance</h2>
            <div style={styles.linkList}>
              <div style={styles.linkItem} onClick={() => openExternal('https://visnly.com/terms')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <ScaleIcon size={16} color="#aaa" />
                  <span>Terms of Service</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
              <div style={styles.linkItem} onClick={() => openExternal('https://visnly.com/privacy')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <ShieldIcon size={16} color="#aaa" />
                  <span>Privacy Policy</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
              <div style={styles.linkItem} onClick={() => openExternal('https://visnly.com/compliance')}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <ShieldIcon size={16} color="#aaa" />
                  <span>Trust & Compliance Center</span>
                </div>
                <ExternalLinkIcon size={14} color="#666" />
              </div>
            </div>
            <div style={{marginTop: '30px', fontSize: '11px', color: '#555', lineHeight: '1.5'}}>
              Visnly ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}<br/>
              Version: 1.0.0 (Stable)<br/>
              © 2025 Visnly Inc. All rights reserved.
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  // --- MAIN LAYOUT ---
  return (
    <div style={styles.backdrop} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <GlassCard style={styles.modal}>
        
        {/* SIDEBAR NAVIGATION */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>{t('settings')}</div>
          
          <div style={styles.navGroup}>
            <div style={styles.navLabel}>USER</div>
            <button onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? styles.navBtnActive : styles.navBtn}>
              <UserIcon size={16} color={activeTab === 'profile' ? '#fff' : '#888'} />
              <span>{t('profile')}</span>
            </button>
            <button onClick={() => setActiveTab('billing')} style={activeTab === 'billing' ? styles.navBtnActive : styles.navBtn}>
              <CreditCardIcon size={16} color={activeTab === 'billing' ? '#fff' : '#888'} />
              <span>{t('billing')}</span>
            </button>
          </div>

          <div style={styles.navGroup}>
            <div style={styles.navLabel}>APP</div>
            <button onClick={() => setActiveTab('general')} style={activeTab === 'general' ? styles.navBtnActive : styles.navBtn}>
              <SettingsIcon size={16} color={activeTab === 'general' ? '#fff' : '#888'} />
              <span>{t('general_settings')}</span>
            </button>
            <button onClick={() => setActiveTab('keybinds')} style={activeTab === 'keybinds' ? styles.navBtnActive : styles.navBtn}>
              <KeyboardIcon size={16} color={activeTab === 'keybinds' ? '#fff' : '#888'} />
              <span>{t('hotkey_label')}</span>
            </button>
            <button onClick={() => setActiveTab('support')} style={activeTab === 'support' ? styles.navBtnActive : styles.navBtn}>
              <HelpCircleIcon size={16} color={activeTab === 'support' ? '#fff' : '#888'} />
              <span>Support</span>
            </button>
            <button onClick={() => setActiveTab('legal')} style={activeTab === 'legal' ? styles.navBtnActive : styles.navBtn}>
              <ScaleIcon size={16} color={activeTab === 'legal' ? '#fff' : '#888'} />
              <span>Legal</span>
            </button>
          </div>

          <button onClick={onClose} style={styles.closeBtn}>Close</button>
        </div>

        {/* CONTENT AREA */}
        <div style={styles.content}>
          {renderContent()}
        </div>

      </GlassCard>
      
      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div style={styles.toast}>
          <div style={styles.toastContent}>
            <CheckIcon size={16} color="#4caf50" />
            <span>Profile settings saved!</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 💅 STYLES (Cluely Aesthetic)
// ==========================================
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
  },
  modal: {
    width: '850px', height: '600px', display: 'flex', overflow: 'hidden', padding: 0,
    backgroundColor: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  // Sidebar
  sidebar: { width: '240px', backgroundColor: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '24px', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { fontSize: '20px', fontWeight: 700, marginBottom: '32px', color: '#fff', letterSpacing: '-0.5px' },
  navGroup: { marginBottom: '32px' },
  navLabel: { fontSize: '10px', fontWeight: 700, color: '#555', marginBottom: '12px', paddingLeft: '12px', letterSpacing: '1px' },
  navBtn: { width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#888', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', transition: '0.2s', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' },
  navBtnActive: { width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' },
  closeBtn: { marginTop: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#888', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },

  // Content Area
  content: { flex: 1, padding: '40px 50px', overflowY: 'auto' },
  animateFade: { animation: 'fadeIn 0.3s ease-out' },
  heading: { fontSize: '24px', fontWeight: 700, marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', color: '#fff' },
  
  // Form Elements
  inputGroup: { marginBottom: '24px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#ccc', marginBottom: '8px' },
  input: { 
    width: '100%', 
    padding: '12px', 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '8px', 
    color: 'white', 
    fontSize: '14px', 
    outline: 'none',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const
  },
  microHint: { fontSize: '11px', color: '#666', marginTop: '6px' },
  languageDropdownButton: {
    width: '200px',
    padding: '12px 14px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },
  languageDropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    minWidth: '200px',
    padding: '6px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    backgroundColor: 'rgba(20, 20, 25, 0.95)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  },
  languageDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#ccc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: 500
  },
  
  // Buttons
  primaryBtn: { padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' },
  secondaryBtn: { padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ccc', fontWeight: 500, cursor: 'pointer', fontSize: '14px', marginRight: '10px' },
  dangerBtn: { padding: '8px 16px', backgroundColor: 'rgba(255, 82, 82, 0.1)', border: '1px solid #ff5252', borderRadius: '6px', color: '#ff5252', fontWeight: 600, cursor: 'pointer', fontSize: '12px' },
  textLink: { background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' },
  
  // Custom Components
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  divider: { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '30px 0' },
  toggleWrapper: { display: 'flex', alignItems: 'center' },
  toggleButton: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)',
    outline: 'none'
  },
  toggleThumb: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)'
  },
  dangerBox: { border: '1px solid rgba(255,82,82,0.3)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,82,82,0.05)', marginBottom: '20px' },
  actionRow: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end' },
  
  // Billing
  billingGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  planCard: { padding: '24px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', minHeight: '280px' },
  planName: { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '10px', letterSpacing: '1px' },
  planPrice: { fontSize: '32px', fontWeight: 700, marginBottom: '20px', color: '#fff' },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '13px', color: '#bbb', lineHeight: '2.2' },
  
  // Links
  linkList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  linkItem: { display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: '0.2s', fontSize: '14px', color: '#ddd' },
  
  // Keybind
  keybindBtn: { fontFamily: 'monospace', padding: '8px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', cursor: 'pointer', minWidth: '180px', fontSize: '13px', transition: 'all 0.2s' },
  kbd: { fontFamily: 'monospace', padding: '4px 8px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '11px', color: '#ccc', fontWeight: 600 },
  shortcutList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  shortcutItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' },
  
  // Toast Notification
  toast: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    zIndex: 10000,
    animation: 'slideInUp 0.3s ease-out'
  },
  toastContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    backgroundColor: 'rgba(20, 20, 25, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
};

export default SettingsModal;

