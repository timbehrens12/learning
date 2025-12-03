import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { askAI } from './ai';
import { supabase } from './lib/supabase';
import GlassCard from './components/GlassCard';
import { EyeIcon, CommandIcon, MenuIcon, XIcon, CopyIcon, ChevronUpIcon, ChevronDownIcon, PauseIcon, StopIcon, PlayIcon, IncognitoIcon, HomeIcon, SendIcon, ZapIcon, ScreenIcon, RefreshIcon, ClearIcon } from './components/Icons';

declare global { interface Window { webkitSpeechRecognition: any; } }

const Overlay: React.FC = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'chat' | 'transcript'>('chat');
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{sender: 'user' | 'ai' | 'system', text: string, answer?: string, steps?: string, timestamp?: string}[]>([]);
  const [showStepsForMessage, setShowStepsForMessage] = useState<{[key: number]: boolean}>({});
  const [inputText, setInputText] = useState("");
  const [scannedText, setScannedText] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<"Explain" | "Solve">("Explain"); // Simplified modes
  const [isListening, setIsListening] = useState(false);
  const [transcriptLog, setTranscriptLog] = useState("");
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [lastScanned, setLastScanned] = useState<string>("Never");
  const [showTooltip, setShowTooltip] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<{ time: string; text: string }[]>([]);
  const [isDetectable, setIsDetectable] = useState(true);
  const [isAudioDetected, setIsAudioDetected] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanPreview, setLastScanPreview] = useState<string>("");
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load saved messages on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('current_session_messages');
      const savedTranscript = localStorage.getItem('current_session_transcript');
      const savedTranscriptSegments = localStorage.getItem('current_session_transcript_segments');
      
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      if (savedTranscript) {
        setTranscriptLog(savedTranscript);
      }
      if (savedTranscriptSegments) {
        const parsed = JSON.parse(savedTranscriptSegments);
        if (Array.isArray(parsed)) {
          setTranscriptSegments(parsed);
        }
      }
    } catch (e) {
      console.log('Could not load saved session data');
    }
  }, []);
  
  // Save messages when they change
  useEffect(() => {
    try {
      localStorage.setItem('current_session_messages', JSON.stringify(messages));
    } catch (e) {
      // Ignore storage errors
    }
  }, [messages]);
  
  // Save transcript when it changes
  useEffect(() => {
    try {
      localStorage.setItem('current_session_transcript', transcriptLog);
      localStorage.setItem('current_session_transcript_segments', JSON.stringify(transcriptSegments));
    } catch (e) {
      // Ignore storage errors
    }
  }, [transcriptLog, transcriptSegments]);

  // Scroll to bottom
  useEffect(() => { 
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, transcriptLog, activeTab]);

  // Focus input when overlay becomes visible
  useEffect(() => {
    if (isCardVisible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCardVisible]);

  // Load user ID for credit tracking
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (error) {
        console.error('Failed to load user ID:', error);
      }
    };
    loadUserId();
  }, []);

  // Speech Logic - Initialize once on mount
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true; 
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const text = finalTranscript.trim();
          setTranscriptLog(prev => prev + text + ' ');
          setTranscriptSegments(prev => [...prev, { time, text }]);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        isListeningRef.current = false;
        // Auto-restart logic handled in original code, simplifying for brevity/stability
      };
      
      recognition.onend = () => {
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        }
      };

      recognition.onsoundstart = () => setIsAudioDetected(true);
      recognition.onsoundend = () => setIsAudioDetected(false);

      recognitionRef.current = recognition;
      }
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = isListening;

    if (isListening) {
      requestMicrophonePermission().then((hasPermission) => {
        if (hasPermission) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
            } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      });
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, [isListening]);

  const toggleListening = () => setIsListening(prev => !prev);

  const handleClose = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    }
    (window as any).electron?.ipcRenderer?.send('close-overlay');
  }, [isListening]);

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcriptLog);
  };

  const toggleStealth = () => {
    const newDetectableState = !isDetectable;
    setIsDetectable(newDetectableState);
    (window as any).electron?.ipcRenderer?.send('set-detectable', newDetectableState);
  };

  // Logic Helpers - Screen Capture and OCR
  const scanScreen = useCallback(async (): Promise<string | null> => {
    try {
      setIsScanning(true); 
      setScanError(null);
      
      // @ts-ignore - Electron API
      const source = await window.electron.ipcRenderer.invoke('get-screen-source');
      if (!source) throw new Error('Could not get screen source');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: false, 
        video: { 
          mandatory: { 
            chromeMediaSource: 'desktop', 
            chromeMediaSourceId: source.id, 
            minWidth: 1280, 
            maxWidth: 1920 
          } 
        } as any 
      });
      
      const video = document.createElement('video'); 
      video.srcObject = stream;
      
      return new Promise((resolve) => {
      video.onloadedmetadata = async () => {
        try {
            await video.play();
            await new Promise(r => setTimeout(r, 300));
            
          const canvas = canvasRef.current;
            if (!canvas) throw new Error('Canvas not available');
            
            canvas.width = video.videoWidth; 
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d'); 
            ctx?.drawImage(video, 0, 0);
            
            stream.getTracks().forEach(track => track.stop());
            
            const { data: { text } } = await Tesseract.recognize(canvas, 'eng', { logger: () => {} });
            const cleanedText = text?.trim() || '';
            
            if (cleanedText.length > 0) {
              setScannedText(cleanedText);
              setLastScanned(new Date().toLocaleTimeString());
              setLastScanPreview(cleanedText.substring(0, 100) + (cleanedText.length > 100 ? '...' : ''));
              try { localStorage.setItem('last_session_context', cleanedText); } catch {}
              setIsScanning(false);
              resolve(cleanedText);
            } else {
              setScanError('No text detected.');
              setIsScanning(false);
              resolve(null);
          }
        } catch (err) {
            setScanError('Failed to read screen text.');
          setIsScanning(false);
            resolve(null);
        }
      };
      video.onerror = () => {
          setScanError('Failed to capture screen.');
        setIsScanning(false);
          resolve(null);
      };
      });
    } catch (err: any) {
      setScanError(err?.message || 'Failed to capture screen.');
      setIsScanning(false); 
      return null;
    }
  }, []);

  const runAI = async (selectedMode: string, screenContext: string, promptOverride?: string, userId?: string) => {
    const contextPrompt = promptOverride || inputText || '';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (!screenContext && !contextPrompt && !transcriptLog) { 
      setMessages(prev => [...prev, {
        sender: 'system', 
        text: "⚠️ No context. Capture screen first.",
        timestamp
      }]); 
      return; 
    }
    
    setMode(selectedMode as any);
    setIsThinking(true);
    
    try {
      const response = await askAI(selectedMode, screenContext, transcriptLog, contextPrompt, userId);
      
      if (response.startsWith('Error:')) {
        setMessages(prev => [...prev, {sender: 'system', text: `❌ ${response}`, timestamp}]);
        setIsThinking(false);
        return;
      }
      
      // Legacy "Cheat" handling logic (now "Solve" handles similar)
      const answerMatch = response.match(/\*\*Answer:\*\*([\s\S]*?)(?=\n\*\*Steps:\*\*|$)/i);
      const stepsMatch = response.match(/\*\*Steps:\*\*([\s\S]*?)$/i);
        
      if (answerMatch) {
         // Structured response
         const answer = answerMatch[1].trim();
        const steps = stepsMatch ? stepsMatch[1].trim() : undefined;
         setMessages(prev => [...prev, { sender: 'ai', text: answer, answer, steps, timestamp }]);
      } else {
         setMessages(prev => [...prev, {sender: 'ai', text: response, timestamp}]);
      }

    } catch (err: any) { 
      setMessages(prev => [...prev, {
        sender: 'system', 
        text: `❌ Error: ${err?.message}`,
        timestamp
      }]); 
    }
    
    setIsThinking(false); 
    if (!promptOverride) setInputText("");
  };
  
  const handleAnalyze = useCallback(async () => {
    if (isScanning || isThinking) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (inputText.trim()) { 
      setMessages(prev => [...prev, {sender: 'user', text: inputText, timestamp}]);
    }
    
    setMessages(prev => [...prev, { sender: 'system', text: "📷 Capturing...", timestamp }]);
    const screenText = await scanScreen();
    
    setMessages(prev => prev.filter(m => m.text !== "📷 Capturing..."));

    if (!screenText && !transcriptLog && !inputText.trim()) {
      setMessages(prev => [...prev, { sender: 'system', text: scanError || "⚠️ No text found.", timestamp }]);
      return;
    }
    
    let autoPrompt = inputText.trim();
    if (!autoPrompt) {
      if (mode === 'Solve') autoPrompt = 'Solve this step by step';
      else autoPrompt = 'Explain this concept';
    }
    
    await runAI(mode, screenText || scannedText, autoPrompt, userId || undefined);
    setInputText("");
  }, [isScanning, isThinking, inputText, mode, scanScreen, transcriptLog, scannedText, scanError]);

  const handleSendWithContext = useCallback(() => {
    if (!inputText.trim()) {
      handleAnalyze();
      return;
    }
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {sender: 'user', text: inputText, timestamp}]);
    runAI(mode, scannedText, inputText);
  }, [inputText, mode, scannedText, handleAnalyze]);

  const handleTranscriptAction = useCallback(async (action: 'copy' | 'summarize' | 'clear') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (action === 'copy') {
      if (!transcriptLog) return;
      await navigator.clipboard.writeText(transcriptLog);
      setMessages(prev => [...prev, {sender: 'system', text: "✅ Copied!", timestamp}]);
      return;
    }
    if (action === 'clear') {
      setTranscriptLog("");
      setTranscriptSegments([]);
      setMessages(prev => [...prev, {sender: 'system', text: "🗑️ Cleared.", timestamp}]);
      return;
    }
    if (action === 'summarize') {
      if (transcriptLog.length < 50) return;
        setActiveTab('chat');
      setMessages(prev => [...prev, {sender: 'user', text: "Summarize transcript", timestamp}]);
      await runAI("Explain", "", "Summarize the transcript so far.", userId || undefined);
    }
  }, [transcriptLog]);

  const handleQuickAnalysis = useCallback(async () => {
    if (isScanning || isThinking) return;
    await handleAnalyze();
  }, [isScanning, isThinking, handleAnalyze]);
  
  const handleManualScan = useCallback(async () => {
    if (isScanning) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const screenText = await scanScreen();
    if (screenText) {
      setMessages(prev => [...prev, { sender: 'system', text: `📷 Captured ${screenText.split(/\s+/).length} words.`, timestamp }]);
    }
  }, [isScanning, scanScreen]);

  // --- KEYBOARD ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); return; }
      if (e.ctrlKey && e.key === '\\') { e.preventDefault(); setIsCardVisible(prev => !prev); return; }
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleQuickAnalysis(); return; }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleManualScan(); return; }

      if (e.ctrlKey) {
        const d = 50;
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            e.preventDefault();
          const dir = e.key.replace('Arrow','').toLowerCase();
          (window as any).electron?.ipcRenderer?.send('move-overlay-window', { direction: dir, distance: d });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickAnalysis, handleManualScan, handleClose]);

  // --- RENDER ---
  return (
    <div style={styles.container}>
      <div style={styles.tintOverlay}></div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* --- FLOATING HEADER (Draggable) --- */}
      {isCardVisible && (
        <div style={styles.headerBar}>
          <div style={styles.dragArea}>
            <div style={styles.dragHandle}></div>
          </div>
          <div style={styles.headerControls}>
             <button onClick={toggleStealth} style={styles.iconBtn} title={isDetectable ? "Visible to screen share" : "Invisible (Stealth Mode)"}>
                <IncognitoIcon size={16} color={isDetectable ? "#aaa" : "#ff5252"} />
             </button>
             <button onClick={handleClose} style={styles.iconBtn} title="Close Overlay">
                <XIcon size={16} color="#aaa" />
             </button>
          </div>
        </div>
      )}

      {/* --- MAIN CARD --- */}
      {isCardVisible && (
        <GlassCard style={styles.mainCard}>
          {/* Tabs */}
          <div style={styles.tabRow}>
          <button 
            onClick={() => setActiveTab('chat')}
              style={activeTab === 'chat' ? styles.tabActive : styles.tab}
          >
            Chat
            </button>
            <button 
            onClick={() => setActiveTab('transcript')}
              style={activeTab === 'transcript' ? styles.tabActive : styles.tab}
          >
            Transcript
            </button>
            {activeTab === 'transcript' && (
               <div style={styles.recIndicator}>
                 <span style={{...styles.recDot, background: isListening ? '#ef4444' : '#555'}}></span>
                 {isListening ? (isAudioDetected ? "Listening..." : "On") : "Off"}
               </div>
          )}
        </div>

          {/* Content */}
          <div style={styles.contentArea}>
            {activeTab === 'chat' ? (
              <div style={styles.chatScroll}>
              {messages.length === 0 && !scannedText && (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}><CommandIcon size={32} color="rgba(255,255,255,0.2)" /></div>
                    <p style={styles.emptyText}>Ready to analyze.</p>
                    <div style={styles.shortcutsHint}>
                      <span>Ctrl + Enter</span> to scan & solve
                </div>
                  </div>
              )}

              {messages.map((msg, i) => {
                const isUser = msg.sender === 'user';
                const isSystem = msg.sender === 'system';
                  const hasSteps = !!msg.steps;
                  const showSteps = showStepsForMessage[i];
                
                return (
                    <div key={i} style={{...styles.messageRow, justifyContent: isUser ? 'flex-end' : 'flex-start'}}>
                      {!isUser && !isSystem && <div style={styles.aiAvatar}>AI</div>}
                      <div style={{display:'flex', flexDirection:'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%'}}>
                        <div style={isUser ? styles.userBubble : (isSystem ? styles.systemBubble : styles.aiBubble)}>
                      {msg.text}
                    </div>
                        {hasSteps && (
                          <div style={styles.stepsContainer}>
                        <button
                              onClick={() => setShowStepsForMessage(prev => ({...prev, [i]: !prev[i]}))}
                              style={styles.toggleStepsBtn}
                            >
                              {showSteps ? "Hide Steps" : "Show Steps"}
                        </button>
                            {showSteps && <div style={styles.stepsBubble}>{msg.steps}</div>}
                          </div>
                        )}
                        {msg.timestamp && <div style={styles.timestamp}>{msg.timestamp}</div>}
                      </div>
                  </div>
                );
              })}

              {isThinking && (
                  <div style={styles.messageRow}>
                    <div style={styles.aiAvatar}>AI</div>
                    <div style={styles.thinkingBubble}>
                      <div style={styles.dot}></div><div style={styles.dot}></div><div style={styles.dot}></div>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            ) : (
              <div style={styles.transcriptScroll}>
                {transcriptSegments.length === 0 ? (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyText}>No audio recorded.</p>
                    <button onClick={toggleListening} style={styles.primaryBtn}>
                      {isListening ? "Stop Recording" : "Start Recording"}
                    </button>
              </div>
                ) : (
                  transcriptSegments.map((seg, i) => (
                    <div key={i} style={styles.transcriptItem}>
                      <span style={styles.timeTag}>{seg.time}</span>
                      <span>{seg.text}</span>
                </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
                
                {/* Transcript Floating Controls */}
                <div style={styles.transcriptFloatBar}>
                   <button onClick={toggleListening} style={styles.iconBtnBig} title={isListening ? "Stop" : "Record"}>
                     {isListening ? <StopIcon /> : <PlayIcon />}
                </button>
                   <div style={styles.vSep}></div>
                   <button onClick={() => handleTranscriptAction('copy')} style={styles.iconBtn} title="Copy"><CopyIcon size={14}/></button>
                   <button onClick={() => handleTranscriptAction('summarize')} style={styles.iconBtn} title="Summarize"><ZapIcon size={14}/></button>
                   <button onClick={() => handleTranscriptAction('clear')} style={styles.iconBtn} title="Clear"><ClearIcon size={14}/></button>
              </div>
            </div>
        )}
            </div>

          {/* Footer Input */}
          {activeTab === 'chat' && (
            <div style={styles.footer}>
              {/* Context Pills */}
              {(scannedText || transcriptLog) && (
                <div style={styles.contextRow}>
                  {scannedText && <span style={styles.contextPill} title={lastScanPreview}>📷 Screen</span>}
                  {transcriptLog && <span style={styles.contextPill}>🎙️ Transcript</span>}
                  <button onClick={() => { setScannedText(""); setLastScanPreview(""); }} style={styles.clearContextBtn}>Clear Context</button>
                    </div>
                  )}
              
              <div style={styles.inputBar}>
                {/* Mode Switcher */}
                <div style={styles.modeSwitch}>
          <button 
                    onClick={() => setMode('Explain')}
                    style={mode === 'Explain' ? styles.modeBtnActive : styles.modeBtn}
          >
                    Explain
          </button>
            <button 
                    onClick={() => setMode('Solve')}
                    style={mode === 'Solve' ? styles.modeBtnActive : styles.modeBtn}
                  >
                    Solve
            </button>
          </div>
          
                <div style={styles.inputFieldWrapper}>
                  <input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.ctrlKey) {
                        e.preventDefault();
                        inputText.trim() ? handleSendWithContext() : handleAnalyze();
                }
              }}
                    placeholder={scannedText ? "Ask a follow-up..." : "Type or click Analyze"}
                    style={styles.inputField}
                    disabled={isScanning || isThinking}
                  />
            <button 
                    onClick={inputText.trim() ? handleSendWithContext : handleAnalyze}
                    disabled={isScanning || isThinking}
                    style={styles.actionBtn}
                  >
                    {isScanning ? "..." : (inputText.trim() ? <SendIcon size={14} /> : <ScreenIcon size={14} />)}
            </button>
          </div>
          </div>
        </div>
          )}

          {/* Resize Handle (Visual) */}
          <div style={styles.resizeHandle}></div>
        </GlassCard>
      )}
    </div>
  );
};

// --- MODERN MINIMALIST STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
    backgroundColor: 'transparent', fontFamily: '"Inter", sans-serif', overflow: 'hidden'
  },
  tintOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.1)', pointerEvents: 'none', zIndex: 0
  },
  headerBar: {
    position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
    width: '90%', maxWidth: '400px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 200, pointerEvents: 'auto'
  },
  dragArea: {
    flex: 1, height: '100%', display: 'flex', alignItems: 'center', 
    cursor: 'grab', WebkitAppRegion: 'drag'
  } as any,
  dragHandle: {
    width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px'
  },
  headerControls: {
    display: 'flex', gap: '8px', paddingLeft: '10px'
  },
  iconBtn: {
    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '6px', width: '28px', height: '28px', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    cursor: 'pointer', color: '#ccc', transition: '0.2s'
  },
  mainCard: {
    marginTop: '50px', marginBottom: '20px', marginLeft: 'auto', marginRight: 'auto',
    width: 'calc(100% - 32px)', maxWidth: '420px', flex: 1,
    display: 'flex', flexDirection: 'column', 
    borderRadius: '16px', overflow: 'hidden', pointerEvents: 'auto',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18, 18, 20, 0.85)', backdropFilter: 'blur(20px)'
  },
  tabRow: {
    display: 'flex', padding: '12px 16px 0', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
    alignItems: 'center'
  },
  tab: {
    background: 'none', border: 'none', borderBottom: '2px solid transparent', 
    padding: '8px 0', fontSize: '13px', fontWeight: 500, color: '#888', cursor: 'pointer', transition: '0.2s'
  },
  tabActive: {
    background: 'none', border: 'none', borderBottom: '2px solid #646cff', 
    padding: '8px 0', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer'
  },
  recIndicator: {
    marginLeft: 'auto', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', color: '#888'
  },
  recDot: { width: '6px', height: '6px', borderRadius: '50%' },
  
  contentArea: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  chatScroll: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  
  messageRow: { display: 'flex', gap: '10px', width: '100%' },
  aiAvatar: {
    width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #646cff, #a78bfa)',
    fontSize: '10px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: '4px'
  },
  userBubble: {
    padding: '10px 14px', borderRadius: '12px 12px 2px 12px', background: '#27272a', 
    color: '#fff', fontSize: '13px', lineHeight: '1.5', border: '1px solid rgba(255,255,255,0.1)'
  },
  aiBubble: {
    padding: '10px 14px', borderRadius: '2px 12px 12px 12px', background: 'rgba(100,108,255,0.1)', 
    color: '#e0e0e0', fontSize: '13px', lineHeight: '1.6', border: '1px solid rgba(100,108,255,0.2)',
    whiteSpace: 'pre-wrap' as const
  },
  systemBubble: {
    alignSelf: 'center', fontSize: '11px', color: '#666', background: 'rgba(255,255,255,0.05)',
    padding: '4px 10px', borderRadius: '999px'
  },
  thinkingBubble: {
    padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
    display: 'flex', gap: '4px', alignItems: 'center'
  },
  dot: { width: '4px', height: '4px', background: '#888', borderRadius: '50%', animation: 'pulse 1s infinite' },
  
  stepsContainer: { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
  toggleStepsBtn: {
    background: 'none', border: 'none', fontSize: '11px', color: '#646cff', cursor: 'pointer', textAlign: 'left', padding: 0
  },
  stepsBubble: {
    padding: '10px', background: 'rgba(0,0,0,0.2)', borderLeft: '2px solid #646cff', fontSize: '12px', color: '#ccc',
    whiteSpace: 'pre-wrap' as const
  },
  timestamp: { fontSize: '10px', color: '#555', marginTop: '4px', alignSelf: 'flex-end' },
  
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  emptyIcon: { marginBottom: '16px' },
  emptyText: { fontSize: '14px', color: '#888', fontWeight: 500 },
  shortcutsHint: { fontSize: '11px', color: '#555', marginTop: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' },
  
  footer: { padding: '12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' },
  contextRow: { display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' },
  contextPill: { fontSize: '10px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(34,197,94,0.2)' },
  clearContextBtn: { background: 'none', border: 'none', fontSize: '10px', color: '#666', cursor: 'pointer', marginLeft: 'auto' },
  
  inputBar: { display: 'flex', gap: '8px', alignItems: 'stretch' },
  modeSwitch: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' },
  modeBtn: { background: 'none', border: 'none', fontSize: '11px', padding: '6px 10px', color: '#666', cursor: 'pointer', borderRadius: '6px' },
  modeBtnActive: { background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '11px', padding: '6px 10px', color: '#fff', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 },
  
  inputFieldWrapper: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center' },
  inputField: { 
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '8px', padding: '10px 40px 10px 12px', color: '#fff', fontSize: '13px', outline: 'none'
  },
  actionBtn: {
    position: 'absolute', right: '6px', width: '28px', height: '28px', borderRadius: '6px',
    background: '#646cff', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: '0.2s'
  },
  
  resizeHandle: {
    position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', cursor: 'nwse-resize',
    background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.2) 50%)'
  },
  
  transcriptScroll: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  transcriptItem: { display: 'flex', gap: '12px', fontSize: '13px', lineHeight: '1.6', color: '#ccc' },
  timeTag: { fontSize: '11px', color: '#555', flexShrink: 0, marginTop: '3px' },
  transcriptFloatBar: { 
    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    background: '#222', borderRadius: '999px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px',
    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  iconBtnBig: { width: '32px', height: '32px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  vSep: { width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)' },
  primaryBtn: { padding: '8px 16px', borderRadius: '8px', background: '#646cff', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' }
};

export default Overlay;
