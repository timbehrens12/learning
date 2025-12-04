import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';
import { askAI, extractKeyConcepts, extractMainPoints, generateSimplifiedNotes, generateRecap, generateStudyGuide, explainSegment, explainTeacherMeaning, getContextBefore, extractFormulas, rewriteInStyle, askContextQuestion, LearningStyle, analyzeTranscriptSections, detectTestWorthySections, detectConfusingSections, generateTopicTimeline, TranscriptSegmentAnalysis } from './ai';
import { supabase } from './lib/supabase';
import GlassCard from './components/GlassCard';
import { EyeIcon, CommandIcon, MenuIcon, XIcon, CopyIcon, ChevronUpIcon, ChevronDownIcon, PauseIcon, StopIcon, PlayIcon, IncognitoIcon, HomeIcon, SendIcon, ZapIcon, ScreenIcon, RefreshIcon, ClearIcon, FileTextIcon, ListIcon, LightbulbIcon, TargetIcon, StarIcon, ClipboardIcon, BookIcon, HelpCircleIcon, HashIcon, ChevronRightIcon, CameraIcon, MicIcon, MicOffIcon, SettingsIcon, MaximizeIcon, MinimizeIcon } from './components/Icons';

declare global { interface Window { webkitSpeechRecognition: any; } }

// Types for Notes tab
interface NotesState {
  keyConcepts: string[];
  definitions: { term: string; definition: string }[];
  mainPoints: string[];
  simplifiedNotes: string;
  recap: { summary: string; reviewTopics: string[]; nextSteps: string[] } | null;
  studyGuide: {
    title: string;
    keyConcepts: string[];
    definitions: { term: string; definition: string }[];
    formulas: string[];
    mainTakeaways: string[];
    testLikelyTopics: string[];
    studyTips: string[];
  } | null;
  isLoading: { [key: string]: boolean };
  activeSection: 'overview' | 'concepts' | 'notes' | 'recap' | 'studyguide' | null;
}

const Overlay: React.FC = () => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [inputMode, setInputMode] = useState<'chat' | 'screen' | 'voice'>('chat');
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{sender: 'user' | 'ai' | 'system', text: string, answer?: string, steps?: string, timestamp?: string}[]>([]);
  const [showStepsForMessage, setShowStepsForMessage] = useState<{[key: number]: boolean}>({});
  const [inputText, setInputText] = useState("");
  const [scannedText, setScannedText] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<"Study" | "Solve" | "Cheat">("Study");
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
  
  // Notes tab state
  const [notesState, setNotesState] = useState<NotesState>({
    keyConcepts: [],
    definitions: [],
    mainPoints: [],
    simplifiedNotes: '',
    recap: null,
    studyGuide: null,
    isLoading: {},
    activeSection: null
  });
  
  // Phase 2: Interactive Features State
  const [learningStyle, setLearningStyle] = useState<LearningStyle>(() => {
    const saved = localStorage.getItem('visnly_learning_style');
    return (saved as LearningStyle) || 'default';
  });
  const [selectedSegment, setSelectedSegment] = useState<{ index: number; text: string; time: string } | null>(null);
  const [segmentExplanation, setSegmentExplanation] = useState<string>('');
  const [isExplainingSegment, setIsExplainingSegment] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [extractedFormulas, setExtractedFormulas] = useState<{ formula: string; explanation: string }[]>([]);
  const [showLearningStylePicker, setShowLearningStylePicker] = useState(false);
  const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null);
  
  // Phase 3: Advanced Intelligence State
  const [segmentAnalysis, setSegmentAnalysis] = useState<TranscriptSegmentAnalysis[]>([]);
  const [testWorthySections, setTestWorthySections] = useState<{
    sections: { text: string; reason: string; confidence: 'likely' | 'very_likely' | 'certain' }[];
    summary: string;
  } | null>(null);
  const [confusingSections, setConfusingSections] = useState<{
    sections: { text: string; reason: string; suggestion: string; severity: 'minor' | 'moderate' | 'significant' }[];
    overallClarity: string;
  } | null>(null);
  const [topicTimeline, setTopicTimeline] = useState<{
    timeline: { time: string; topic: string; type: string; duration?: string }[];
    totalTopics: number;
  } | null>(null);
  const [isAnalyzingTranscript, setIsAnalyzingTranscript] = useState(false);
  const [showTranscriptTags, setShowTranscriptTags] = useState(true);
  const [analysisFilter, setAnalysisFilter] = useState<'all' | 'test_worthy' | 'confusing' | 'topics'>('all');
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load user ID from session on mount and listen for auth changes
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          console.log('Overlay: User ID loaded:', user.id);
        } else {
          console.log('Overlay: No user session found');
          setUserId(null);
        }
      } catch (error) {
        console.error('Overlay: Failed to load user ID:', error);
        setUserId(null);
      }
    };
    
    // Load initially
    loadUserId();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        console.log('Overlay: User signed in:', session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        console.log('Overlay: User signed out');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const runAI = async (selectedMode: string, promptOverride?: string) => {
    const contextPrompt = promptOverride || inputText || (selectedMode === 'Cheat' ? 'Give me the answer' : '');
    if (!scannedText && !contextPrompt && !transcriptLog) { 
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No context. Scan or speak."}]); 
      return; 
    }
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use AI features."}]);
      return;
    }
    setMode(selectedMode as any); setIsThinking(true);
    
    // Save session context for better title generation
    // Prioritize: user prompt > scanned text > transcript
    const sessionContext = contextPrompt || scannedText || transcriptLog;
    if (sessionContext) {
      try {
        // Save the most meaningful context (user prompt takes priority)
        const contextToSave = contextPrompt || scannedText.substring(0, 200) || transcriptLog.substring(0, 200);
        localStorage.setItem('last_session_context', contextToSave);
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    try {
      const response = await askAI(selectedMode, scannedText, transcriptLog, contextPrompt, userId);
      
      // For Cheat mode, parse the response to extract answer and steps
      if (selectedMode === 'Cheat') {
        const answerMatch = response.match(/---ANSWER---\s*([\s\S]*?)(?=\n---STEPS---|$)/);
        const stepsMatch = response.match(/---STEPS---\s*([\s\S]*?)$/);
        
        const answer = answerMatch ? answerMatch[1].trim() : response;
        const steps = stepsMatch ? stepsMatch[1].trim() : undefined;
        
        setMessages(prev => {
          const newMessages = [...prev, {sender: 'ai' as const, text: answer, answer, steps}];
          return newMessages;
        });
      } else {
        // For Study and Solve modes, use the response as-is
        setMessages(prev => [...prev, {sender: 'ai', text: response}]);
      }
    } catch (err) { setMessages(prev => [...prev, {sender: 'system', text: "❌ AI Error."}]); }
    setIsThinking(false); 
    if (!promptOverride) {
      setInputText(""); 
    }
  };
  
  const handleSend = () => { 
    if (inputText.trim()) { 
      setMessages(prev => [...prev, {sender: 'user', text: inputText}]); 
      runAI(mode); 
    } else {
      // If no input text, automatically analyze with current context
      // For Cheat mode, use "Give me the answer" prompt
      const autoPrompt = mode === 'Cheat' ? 'Give me the answer' : '';
      runAI(mode, autoPrompt);
    }
  };

  // Helper functions for media button styles
  const getMediaButtonBaseStyles = () => {
    return {
      background: 'transparent',
      boxShadow: 'none',
      textShadow: 'none',
      transform: 'scale(1)',
      color: 'rgba(255, 255, 255, 0.6)',
      letterSpacing: '0.05em',
    };
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
    
    await runAI(mode, autoPrompt);
    setInputText("");
  }, [isScanning, isThinking, inputText, mode, scanScreen, transcriptLog, scannedText, scanError]);

  const handleSendWithContext = useCallback(() => {
    if (!inputText.trim()) {
      handleAnalyze();
      return;
    }
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {sender: 'user', text: inputText, timestamp}]);
    runAI(mode, inputText);
  }, [inputText, mode, scannedText, transcriptLog, userId, handleAnalyze]);

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
      await runAI("Study", "Summarize the transcript so far.");
    }
  }, [transcriptLog, userId]);

  // --- NOTES TAB HANDLERS ---
  const handleExtractKeyConcepts = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, concepts: true }, activeSection: 'concepts' }));
    
    try {
      const result = await extractKeyConcepts(transcriptLog, scannedText, userId);
      setNotesState(prev => ({
        ...prev,
        keyConcepts: result.concepts,
        definitions: result.definitions,
        isLoading: { ...prev.isLoading, concepts: false }
      }));
    } catch (error: any) {
      console.error('Failed to extract concepts:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to extract concepts'}`}]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, concepts: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleExtractMainPoints = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, mainPoints: true }, activeSection: 'concepts' }));
    
    try {
      const result = await extractMainPoints(transcriptLog, scannedText, userId);
      setNotesState(prev => ({
        ...prev,
        mainPoints: result,
        isLoading: { ...prev.isLoading, mainPoints: false }
      }));
    } catch (error: any) {
      console.error('Failed to extract main points:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to extract main points'}`}]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, mainPoints: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleGenerateNotes = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, notes: true }, activeSection: 'notes' }));
    
    try {
      const result = await generateSimplifiedNotes(transcriptLog, scannedText, userId);
      setNotesState(prev => ({
        ...prev,
        simplifiedNotes: result,
        isLoading: { ...prev.isLoading, notes: false }
      }));
    } catch (error: any) {
      console.error('Failed to generate notes:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to generate notes'}`}]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, notes: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleGenerateRecap = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, recap: true }, activeSection: 'recap' }));
    
    try {
      const result = await generateRecap(transcriptLog, scannedText, userId);
      setNotesState(prev => ({
        ...prev,
        recap: result,
        isLoading: { ...prev.isLoading, recap: false }
      }));
    } catch (error: any) {
      console.error('Failed to generate recap:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to generate recap'}`}]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, recap: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleGenerateStudyGuide = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, studyGuide: true }, activeSection: 'studyguide' }));
    
    try {
      const result = await generateStudyGuide(transcriptLog, scannedText, userId);
      setNotesState(prev => ({
        ...prev,
        studyGuide: result,
        isLoading: { ...prev.isLoading, studyGuide: false }
      }));
    } catch (error: any) {
      console.error('Failed to generate study guide:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to generate study guide'}`}]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, studyGuide: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleCopyNotesContent = useCallback(async (content: string) => {
    await navigator.clipboard.writeText(content);
    setMessages(prev => [...prev, {sender: 'system', text: "✅ Copied to clipboard!"}]);
  }, []);

  const clearNotesState = useCallback(() => {
    setNotesState({
      keyConcepts: [],
      definitions: [],
      mainPoints: [],
      simplifiedNotes: '',
      recap: null,
      studyGuide: null,
      isLoading: {},
      activeSection: null
    });
  }, []);

  // --- PHASE 2: INTERACTIVE FEATURES HANDLERS ---
  
  // Save learning style preference
  useEffect(() => {
    localStorage.setItem('visnly_learning_style', learningStyle);
  }, [learningStyle]);

  // Tap-to-Explain: Handle clicking on a transcript segment
  const handleSegmentClick = useCallback(async (segment: { index: number; text: string; time: string }, event: React.MouseEvent) => {
    event.preventDefault();
    
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    
    setSelectedSegment(segment);
    setSegmentExplanation('');
    setIsExplainingSegment(true);
    
    try {
      const explanation = await explainSegment(
        segment.text,
        transcriptLog,
        scannedText,
        userId,
        learningStyle
      );
      setSegmentExplanation(explanation);
    } catch (error: any) {
      console.error('Failed to explain segment:', error);
      setSegmentExplanation(`Error: ${error.message || 'Failed to explain. Please try again.'}`);
    } finally {
      setIsExplainingSegment(false);
    }
  }, [userId, transcriptLog, scannedText, learningStyle]);

  // Close segment explanation popup
  const closeSegmentExplanation = useCallback(() => {
    setSelectedSegment(null);
    setSegmentExplanation('');
  }, []);

  // Context Tool: What does the teacher mean?
  const handleWhatDoesThisMean = useCallback(async (text?: string) => {
    const targetText = text || selectedSegment?.text || '';
    if (!targetText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Select some text first."}]);
      return;
    }
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    
    setActiveTab('chat');
    setMessages(prev => [...prev, {sender: 'user', text: `What does the teacher mean by: "${targetText.substring(0, 100)}${targetText.length > 100 ? '...' : ''}"`}]);
    setIsThinking(true);
    
    try {
      const response = await explainTeacherMeaning(targetText, transcriptLog, scannedText, userId, learningStyle);
      setMessages(prev => [...prev, {sender: 'ai', text: response}]);
    } catch (error: any) {
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to explain'}`}]);
    } finally {
      setIsThinking(false);
      setShowContextMenu(false);
    }
  }, [selectedSegment, userId, transcriptLog, scannedText, learningStyle]);

  // Context Tool: Give me context from before
  const handleGetContextBefore = useCallback(async (text?: string) => {
    const targetText = text || selectedSegment?.text || '';
    if (!targetText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Select some text first."}]);
      return;
    }
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    
    setActiveTab('chat');
    setMessages(prev => [...prev, {sender: 'user', text: `Give me context for: "${targetText.substring(0, 100)}${targetText.length > 100 ? '...' : ''}"`}]);
    setIsThinking(true);
    
    try {
      const response = await getContextBefore(targetText, transcriptLog, scannedText, userId);
      setMessages(prev => [...prev, {sender: 'ai', text: response}]);
    } catch (error: any) {
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to get context'}`}]);
    } finally {
      setIsThinking(false);
      setShowContextMenu(false);
    }
  }, [selectedSegment, userId, transcriptLog, scannedText]);

  // Context Tool: Extract all formulas
  const handleExtractFormulas = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, formulas: true } }));
    
    try {
      const formulas = await extractFormulas(transcriptLog, scannedText, userId);
      setExtractedFormulas(formulas);
      if (formulas.length === 0) {
        setMessages(prev => [...prev, {sender: 'system', text: "ℹ️ No formulas found in the lecture content."}]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to extract formulas'}`}]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, formulas: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  // Rewrite content in selected learning style
  const handleRewriteInStyle = useCallback(async (content: string, style: LearningStyle) => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return '';
    }
    
    try {
      const rewritten = await rewriteInStyle(content, style, userId);
      return rewritten;
    } catch (error: any) {
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to rewrite'}`}]);
      return '';
    }
  }, [userId]);

  // Ask a context question
  const handleContextQuestion = useCallback(async (question: string) => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    
    setActiveTab('chat');
    setMessages(prev => [...prev, {sender: 'user', text: question}]);
    setIsThinking(true);
    
    try {
      const response = await askContextQuestion(question, transcriptLog, scannedText, userId, learningStyle);
      setMessages(prev => [...prev, {sender: 'ai', text: response}]);
    } catch (error: any) {
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to answer'}`}]);
    } finally {
      setIsThinking(false);
    }
  }, [userId, transcriptLog, scannedText, learningStyle]);

  // Right-click context menu for transcript segments
  const handleSegmentRightClick = useCallback((segment: { index: number; text: string; time: string }, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedSegment(segment);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  }, []);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showContextMenu]);

  // --- PHASE 3: ADVANCED INTELLIGENCE HANDLERS ---

  // Analyze transcript sections (Auto-Timestamps)
  const handleAnalyzeTranscript = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (transcriptSegments.length === 0) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No transcript to analyze. Start recording first."}]);
      return;
    }
    
    setIsAnalyzingTranscript(true);
    setMessages(prev => [...prev, {sender: 'system', text: "🔍 Analyzing transcript sections..."}]);
    
    try {
      const analysis = await analyzeTranscriptSections(transcriptSegments, scannedText, userId);
      setSegmentAnalysis(analysis);
      
      const testWorthyCount = analysis.filter(a => a.isTestWorthy).length;
      const confusingCount = analysis.filter(a => a.isConfusing).length;
      const newTopics = analysis.filter(a => a.tags.includes('new_topic')).length;
      
      setMessages(prev => [...prev, {
        sender: 'system', 
        text: `✅ Analysis complete: ${newTopics} topics, ${testWorthyCount} test-worthy, ${confusingCount} potentially confusing sections`
      }]);
    } catch (error: any) {
      console.error('Failed to analyze transcript:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to analyze transcript'}`}]);
    } finally {
      setIsAnalyzingTranscript(false);
    }
  }, [userId, transcriptSegments, scannedText]);

  // Detect Test-Worthy Sections
  const handleDetectTestWorthy = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, testWorthy: true } }));
    
    try {
      const result = await detectTestWorthySections(transcriptLog, scannedText, userId);
      setTestWorthySections(result);
      
      if (result.sections.length === 0) {
        setMessages(prev => [...prev, {sender: 'system', text: "ℹ️ No explicitly test-worthy sections detected."}]);
      }
    } catch (error: any) {
      console.error('Failed to detect test-worthy sections:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to detect test-worthy sections'}`}]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, testWorthy: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  // Detect Confusing Sections
  const handleDetectConfusing = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No content to analyze."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, confusing: true } }));
    
    try {
      const result = await detectConfusingSections(transcriptLog, scannedText, userId);
      setConfusingSections(result);
      
      if (result.sections.length === 0) {
        setMessages(prev => [...prev, {sender: 'system', text: "✅ No confusing sections detected - lecture seems clear!"}]);
      }
    } catch (error: any) {
      console.error('Failed to detect confusing sections:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to analyze'}`}]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, confusing: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  // Generate Topic Timeline
  const handleGenerateTimeline = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ Please sign in to use this feature."}]);
      return;
    }
    if (transcriptSegments.length === 0) {
      setMessages(prev => [...prev, {sender: 'system', text: "⚠️ No transcript to analyze."}]);
      return;
    }
    
    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, timeline: true } }));
    
    try {
      const result = await generateTopicTimeline(transcriptSegments, userId);
      setTopicTimeline(result);
    } catch (error: any) {
      console.error('Failed to generate timeline:', error);
      setMessages(prev => [...prev, {sender: 'system', text: `❌ ${error.message || 'Failed to generate timeline'}`}]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, timeline: false } }));
    }
  }, [userId, transcriptSegments]);

  // Get tag color for segment
  const getTagColor = (tag: string): string => {
    const colors: Record<string, string> = {
      'new_topic': '#8b5cf6',
      'example': '#0ea5e9',
      'definition': '#22c55e',
      'review': '#f59e0b',
      'important': '#ef4444',
      'test_worthy': '#ec4899',
      'confusing': '#f97316',
      'summary': '#6366f1'
    };
    return colors[tag] || '#888';
  };

  // Get importance badge color
  const getImportanceColor = (importance: string): string => {
    const colors: Record<string, string> = {
      'low': '#666',
      'medium': '#888',
      'high': '#f59e0b',
      'critical': '#ef4444'
    };
    return colors[importance] || '#888';
  };

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* --- MAIN OVERLAY --- */}
      <AnimatePresence>
        {isCardVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ${
              viewMode === 'expanded' ? 'w-[800px] h-[600px]' : 'w-[500px] h-auto'
            }`}
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <ZapIcon className="w-4 h-4 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Visnly</h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Selector */}
                <div className="flex rounded-lg bg-black/20 p-1">
                  {[
                    { key: 'Study', icon: BookOpenIcon, color: 'text-blue-400' },
                    { key: 'Solve', icon: TargetIcon, color: 'text-purple-400' },
                    { key: 'Cheat', icon: ZapIcon, color: 'text-red-400' }
                  ].map(({ key, icon: Icon, color }) => (
                    <button
                      key={key}
                      onClick={() => setMode(key as "Study" | "Solve" | "Cheat")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        mode === key
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-3 h-3 inline mr-1 ${color}`} />
                      {key}
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <button
                  onClick={() => setViewMode(viewMode === 'compact' ? 'expanded' : 'compact')}
                  className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                  {viewMode === 'compact' ?
                    <MaximizeIcon className="w-4 h-4 text-gray-400" /> :
                    <MinimizeIcon className="w-4 h-4 text-gray-400" />
                  }
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-all"
                >
                  <XIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
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
                
                // Helper function to strip markdown formatting for cleaner display
                const stripMarkdown = (text: string): string => {
                  return text
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic *text*
                    .replace(/__(.*?)__/g, '$1') // Remove bold __text__
                    .replace(/_(.*?)_/g, '$1') // Remove italic _text_
                    .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough ~~text~~
                    .replace(/`(.*?)`/g, '$1') // Remove inline code `text`
                    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
                    .replace(/#{1,6}\s+/g, '') // Remove headers
                    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
                    .trim();
                };
                
                const displayText = isUser ? msg.text : stripMarkdown(msg.text);
                
                return (
                    <div key={i} style={{...styles.messageRow, justifyContent: isUser ? 'flex-end' : 'flex-start'}}>
                      {!isUser && !isSystem && <div style={styles.aiAvatar}>AI</div>}
                      <div style={{display:'flex', flexDirection:'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%'}}>
                        <div style={isUser ? styles.userBubble : (isSystem ? styles.systemBubble : styles.aiBubble)}>
                      {displayText}
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
            <>
              <div style={styles.footer}>
                {/* Context Pills */}
                {(scannedText || transcriptLog) && (
                  <div style={styles.contextRow}>
                    {scannedText && <span style={styles.contextPill} title={lastScanPreview}>📷 Screen</span>}
                    {transcriptLog && <span style={styles.contextPill}>🎙️ Transcript</span>}
                    <button onClick={() => { setScannedText(""); setLastScanPreview(""); }} style={styles.clearContextBtn}>Clear Context</button>
                  </div>
                )}
              </div>
              
              <div style={styles.footer}>
              <div style={styles.presetsRow}>
                {/* Study / Explain presets */}
                {mode === 'Study' && (
                  <>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Study');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Explain this concept in detail' }]);
                        runAI('Study', 'Explain this concept in detail');
                      }}
                    >
                      Explain concept
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Study');
                        setMessages(prev => [...prev, { sender: 'user', text: 'What are the key points and main takeaways?' }]);
                        runAI('Study', 'What are the key points and main takeaways?');
                      }}
                    >
                      Key points
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Study');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Give me study questions to test my understanding' }]);
                        runAI('Study', 'Give me study questions to test my understanding');
                      }}
                    >
                      Study questions
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Study');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Summarize this content in a clear and concise way' }]);
                        runAI('Study', 'Summarize this content in a clear and concise way');
                      }}
                    >
                      Summarize
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Study');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Break this down into simpler terms that are easy to understand' }]);
                        runAI('Study', 'Break this down into simpler terms that are easy to understand');
                      }}
                    >
                      Simplify
                    </button>
                  </>
                )}

                {/* Solve presets */}
                {mode === 'Solve' && (
                  <>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Solve');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Give me the full breakdown of this step by step' }]);
                        runAI('Solve', 'Give me the full breakdown of this step by step');
                      }}
                    >
                      Full breakdown
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Solve');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Show every step like you are solving a word problem' }]);
                        runAI('Solve', 'Show every step like you are solving a word problem');
                      }}
                    >
                      Word problem steps
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Solve');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Check my work and fix any mistakes' }]);
                        runAI('Solve', 'Check my work and fix any mistakes');
                      }}
                    >
                      Check my work
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Solve');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Explain why each step is correct' }]);
                        runAI('Solve', 'Explain why each step is correct');
                      }}
                    >
                      Explain each step
                    </button>
                  </>
                )}

                {/* Cheat presets */}
                {mode === 'Cheat' && (
                  <>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Cheat');
                        setMessages(prev => [...prev, { sender: 'user', text: "What's the answer?" }]);
                        runAI('Cheat', "What's the answer?");
                      }}
                    >
                      What&apos;s the answer
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Cheat');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Give me just the final answer with no explanation' }]);
                        runAI('Cheat', 'Give me just the final answer with no explanation');
                      }}
                    >
                      Just the answer
                    </button>
                    <button
                      type="button"
                      style={styles.presetChip}
                      onClick={() => {
                        setMode('Cheat');
                        setMessages(prev => [...prev, { sender: 'user', text: 'Answer fast and keep it short' }]);
                        runAI('Cheat', 'Answer fast and keep it short');
                      }}
                    >
                      Answer fast
                    </button>
                  </>
                )}
              </div>

              <div style={styles.inputWrapper}>
                <div style={styles.inputContainer}>
                  <input 
                    type="text" 
                    placeholder="Ask about your screen or conversation, or ↑ ↩ for Assist" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    style={styles.input}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                <button 
                  onClick={handleSend} 
                  style={styles.sendBtn}
                >
                  <SendIcon size={16} color="currentColor" />
                </button>
                </div>
              </div>
              
              <div style={styles.footerRow}>
                <div style={styles.modeRow}>
                  {/* Study */}
                  <div
                    onClick={() => setMode("Study")}
                    style={{
                      ...styles.modeChip,
                      ...(mode === 'Study' ? styles.modeChipActive : styles.modeChipInactive),
                      color: mode === 'Study' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    Explain
                  </div>
                  {/* Solve */}
                  <div
                    onClick={() => setMode("Solve")}
                    style={{
                      ...styles.modeChip,
                      ...(mode === 'Solve' ? styles.modeChipActive : styles.modeChipInactive),
                      color: mode === 'Solve' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    Solve
                  </div>
                  {/* Cheat */}
                  <div
                    onClick={() => setMode("Cheat")}
                    style={{
                      ...styles.modeChip,
                      ...(mode === 'Cheat' ? styles.modeChipActive : styles.modeChipInactive),
                      color: mode === 'Cheat' ? '#ff5252' : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    Cheat
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  style={styles.clearChatBtn}
                >
                  Clear chat
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- TRANSCRIPT TAB CONTENT --- */}
        {activeTab === 'transcript' && (
          <div style={styles.transcriptView}>
            {/* Toolbar */}
            <div style={styles.transcriptToolbar}>
              <div style={{fontSize: '11px', fontWeight: 600, color: isListening ? (isAudioDetected ? '#4caf50' : '#ff5252') : '#666', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px'}}>
                {isListening ? (
                  <>
                    <span style={{display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isAudioDetected ? '#4caf50' : '#ff5252', animation: isAudioDetected ? 'none' : 'pulse-red 1.5s ease-in-out infinite'}}></span>
                    {isAudioDetected ? "🔊 Audio Detected" : "🔴 Listening..."}
                  </>
                ) : (
                  "⏸ Paused"
                )}
              </div>
              <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                <button 
                  onClick={handleAnalyzeTranscript} 
                  disabled={isAnalyzingTranscript}
                  style={{
                    ...styles.toolBtn,
                    background: segmentAnalysis.length > 0 ? 'rgba(139,92,246,0.15)' : undefined
                  }} 
                  title="Analyze transcript sections"
                >
                  <TargetIcon size={14} color={segmentAnalysis.length > 0 ? '#8b5cf6' : 'currentColor'} />
                  <span>{isAnalyzingTranscript ? '...' : 'Analyze'}</span>
                </button>
                <button onClick={() => handleTranscriptAction('copy')} style={styles.toolBtn} title="Copy all transcript">
                  <CopyIcon size={14} color="currentColor" />
                  <span>Copy</span>
                </button>
                <button onClick={() => handleTranscriptAction('summarize')} style={styles.toolBtn} title="Summarize with AI">
                  <ZapIcon size={14} color="currentColor" />
                  <span>Summarize</span>
                </button>
              </div>
            </div>
            
            {/* Analysis Filters (shown when analysis exists) */}
            {segmentAnalysis.length > 0 && (
              <div style={styles.analysisFiltersBar}>
                <button 
                  onClick={() => setShowTranscriptTags(!showTranscriptTags)}
                  style={{
                    ...styles.analysisFilterBtn,
                    background: showTranscriptTags ? 'rgba(139,92,246,0.2)' : 'transparent'
                  }}
                >
                  {showTranscriptTags ? '🏷️ Tags On' : '🏷️ Tags Off'}
                </button>
                <div style={styles.analysisFilterDivider}></div>
                {[
                  { key: 'all', label: 'All', count: segmentAnalysis.length },
                  { key: 'test_worthy', label: '⭐ Test', count: segmentAnalysis.filter(s => s.isTestWorthy).length },
                  { key: 'confusing', label: '⚠️ Review', count: segmentAnalysis.filter(s => s.isConfusing).length },
                  { key: 'topics', label: '📌 Topics', count: segmentAnalysis.filter(s => s.tags.includes('new_topic')).length },
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setAnalysisFilter(filter.key as any)}
                    style={{
                      ...styles.analysisFilterBtn,
                      background: analysisFilter === filter.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                      opacity: filter.count === 0 ? 0.5 : 1
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            )}

            {/* Text Stream - Now with Tap-to-Explain */}
            <div style={styles.transcriptContent}>
              {transcriptSegments.length === 0 && !isListening ? (
                <div style={styles.transcriptEmpty}>
                  <div style={{marginBottom: '10px', fontSize: '20px'}}>🎙️</div>
                  <div>Microphone is ready.</div>
                  <div style={{fontSize: '11px', opacity: 0.5}}>Use the controls in the top bar to start recording.</div>
                  <div style={{fontSize: '10px', opacity: 0.4, marginTop: '8px'}}>💡 Tip: Click any text to get an instant explanation</div>
                </div>
              ) : (
                <>
                  {transcriptSegments.map((seg, i) => {
                    const analysis = segmentAnalysis[i];
                    const shouldShow = analysisFilter === 'all' || 
                      (analysisFilter === 'test_worthy' && analysis?.isTestWorthy) ||
                      (analysisFilter === 'confusing' && analysis?.isConfusing) ||
                      (analysisFilter === 'topics' && analysis?.tags.includes('new_topic'));
                    
                    if (segmentAnalysis.length > 0 && !shouldShow) return null;
                    
                    return (
                      <div 
                        key={i} 
                        style={{
                          ...styles.transcriptRow,
                          ...styles.transcriptRowClickable,
                          backgroundColor: selectedSegment?.index === i 
                            ? 'rgba(139,92,246,0.15)' 
                            : hoveredSegmentIndex === i 
                              ? 'rgba(139,92,246,0.08)' 
                              : analysis?.isTestWorthy 
                                ? 'rgba(236,72,153,0.08)'
                                : analysis?.isConfusing
                                  ? 'rgba(249,115,22,0.08)'
                                  : 'transparent',
                          borderLeft: analysis?.importance === 'critical' 
                            ? '3px solid #ef4444' 
                            : analysis?.importance === 'high'
                              ? '3px solid #f59e0b'
                              : analysis?.isTestWorthy
                                ? '3px solid #ec4899'
                                : 'none',
                          paddingLeft: analysis?.importance === 'critical' || analysis?.importance === 'high' || analysis?.isTestWorthy
                            ? '10px' : undefined
                        }}
                        onClick={(e) => handleSegmentClick({ index: i, text: seg.text, time: seg.time }, e)}
                        onContextMenu={(e) => handleSegmentRightClick({ index: i, text: seg.text, time: seg.time }, e)}
                        onMouseEnter={() => setHoveredSegmentIndex(i)}
                        onMouseLeave={() => setHoveredSegmentIndex(null)}
                        title="Click to explain • Right-click for more options"
                      >
                        <span style={styles.timestamp}>{seg.time}</span>
                        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'}}>
                          {/* Topic Label if new topic */}
                          {showTranscriptTags && analysis?.topicLabel && (
                            <span style={styles.topicLabel}>📌 {analysis.topicLabel}</span>
                          )}
                          
                          <span style={styles.transcriptLineText}>{seg.text}</span>
                          
                          {/* Tags */}
                          {showTranscriptTags && analysis && analysis.tags.length > 0 && (
                            <div style={styles.segmentTagsRow}>
                              {analysis.tags.map((tag, ti) => (
                                <span 
                                  key={ti} 
                                  style={{
                                    ...styles.segmentTag,
                                    backgroundColor: `${getTagColor(tag)}20`,
                                    borderColor: `${getTagColor(tag)}40`,
                                    color: getTagColor(tag)
                                  }}
                                >
                                  {tag.replace('_', ' ')}
                                </span>
                              ))}
                              {analysis.isTestWorthy && (
                                <span style={styles.testWorthyBadge}>⭐ TEST</span>
                              )}
                              {analysis.isConfusing && (
                                <span style={styles.confusingBadge}>⚠️ REVIEW</span>
                              )}
                            </div>
                          )}
                        </div>
                        <span style={{
                          ...styles.tapToExplainHint,
                          opacity: hoveredSegmentIndex === i ? 1 : 0
                        }}>
                          <LightbulbIcon size={12} color="rgba(139,92,246,0.7)" />
                        </span>
                      </div>
                    );
                  })}
                  {isListening && (
                    <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px'}}>
                      Listening...
                    </div>
                  )}
                </>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Segment Explanation Popup (Tap-to-Explain) */}
            {selectedSegment && (
              <div style={styles.segmentPopup}>
                <div style={styles.segmentPopupHeader}>
                  <div style={styles.segmentPopupTitle}>
                    <LightbulbIcon size={16} color="#8b5cf6" />
                    <span>Explain This</span>
                  </div>
                  <button onClick={closeSegmentExplanation} style={styles.segmentPopupClose}>
                    <XIcon size={16} color="#888" />
                  </button>
                </div>
                <div style={styles.segmentPopupSelected}>
                  "{selectedSegment.text.substring(0, 150)}{selectedSegment.text.length > 150 ? '...' : ''}"
                </div>
                <div style={styles.segmentPopupContent}>
                  {isExplainingSegment ? (
                    <div style={styles.segmentPopupLoading}>
                      <div style={styles.loadingSpinner}></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : segmentExplanation ? (
                    <div style={styles.segmentPopupExplanation}>{segmentExplanation}</div>
                  ) : null}
                </div>
                <div style={styles.segmentPopupActions}>
                  <button 
                    onClick={() => handleWhatDoesThisMean(selectedSegment.text)}
                    style={styles.contextActionBtn}
                  >
                    <HelpCircleIcon size={14} color="currentColor" />
                    What does this mean?
                  </button>
                  <button 
                    onClick={() => handleGetContextBefore(selectedSegment.text)}
                    style={styles.contextActionBtn}
                  >
                    <ChevronRightIcon size={14} color="currentColor" />
                    Give me context
                  </button>
                  <button 
                    onClick={() => {
                      if (segmentExplanation) {
                        navigator.clipboard.writeText(segmentExplanation);
                        setMessages(prev => [...prev, {sender: 'system', text: '✅ Copied!'}]);
                      }
                    }}
                    style={styles.contextActionBtn}
                    disabled={!segmentExplanation}
                  >
                    <CopyIcon size={14} color="currentColor" />
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Right-Click Context Menu */}
            {showContextMenu && selectedSegment && (
              <div 
                style={{
                  ...styles.contextMenu,
                  left: contextMenuPosition.x,
                  top: contextMenuPosition.y
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => handleSegmentClick(selectedSegment, { preventDefault: () => {} } as React.MouseEvent)}
                  style={styles.contextMenuItem}
                >
                  <LightbulbIcon size={14} color="#8b5cf6" />
                  Explain this
                </button>
                <button 
                  onClick={() => handleWhatDoesThisMean()}
                  style={styles.contextMenuItem}
                >
                  <HelpCircleIcon size={14} color="#0ea5e9" />
                  What does teacher mean?
                </button>
                <button 
                  onClick={() => handleGetContextBefore()}
                  style={styles.contextMenuItem}
                >
                  <ChevronRightIcon size={14} color="#22c55e" />
                  Give me context before
                </button>
                <div style={styles.contextMenuDivider}></div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSegment.text);
                    setMessages(prev => [...prev, {sender: 'system', text: '✅ Copied!'}]);
                    setShowContextMenu(false);
                  }}
                  style={styles.contextMenuItem}
                >
                  <CopyIcon size={14} color="#888" />
                  Copy text
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- NOTES TAB CONTENT --- */}
        {activeTab === 'notes' && (
          <div style={styles.notesView}>
            {/* Quick Actions Bar with Learning Style Selector */}
            <div style={styles.notesToolbar}>
              <span style={{fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                Study Tools
              </span>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                {/* Learning Style Picker */}
                <div style={{position: 'relative'}}>
                  <button 
                    onClick={() => setShowLearningStylePicker(!showLearningStylePicker)}
                    style={{
                      ...styles.toolBtn,
                      background: learningStyle !== 'default' ? 'rgba(139,92,246,0.15)' : undefined,
                      borderColor: learningStyle !== 'default' ? 'rgba(139,92,246,0.3)' : undefined
                    }}
                    title="Learning Style"
                  >
                    <span style={{fontSize: '12px'}}>
                      {learningStyle === 'default' ? '🎓' : 
                       learningStyle === 'simple' ? '📝' :
                       learningStyle === 'visual' ? '🎨' :
                       learningStyle === 'stepbystep' ? '📋' : '💡'}
                    </span>
                    <span style={{fontSize: '11px'}}>Style</span>
                    <ChevronDownIcon size={12} color="currentColor" />
                  </button>
                  
                  {showLearningStylePicker && (
                    <div style={styles.learningStyleDropdown}>
                      <div style={styles.learningStyleDropdownHeader}>Learning Style</div>
                      {[
                        { value: 'default', label: 'Default', icon: '🎓', desc: 'Clear, educational' },
                        { value: 'simple', label: 'Simple', icon: '📝', desc: 'Easy language, no jargon' },
                        { value: 'visual', label: 'Visual', icon: '🎨', desc: 'Mental images, diagrams' },
                        { value: 'stepbystep', label: 'Step-by-Step', icon: '📋', desc: 'Numbered, structured' },
                        { value: 'analogies', label: 'Analogies', icon: '💡', desc: 'Real-world comparisons' },
                      ].map(style => (
                        <button
                          key={style.value}
                          onClick={() => {
                            setLearningStyle(style.value as LearningStyle);
                            setShowLearningStylePicker(false);
                          }}
                          style={{
                            ...styles.learningStyleOption,
                            background: learningStyle === style.value ? 'rgba(139,92,246,0.15)' : 'transparent'
                          }}
                        >
                          <span style={{fontSize: '16px'}}>{style.icon}</span>
                          <div style={{flex: 1, textAlign: 'left'}}>
                            <div style={{fontSize: '12px', fontWeight: 600, color: '#fff'}}>{style.label}</div>
                            <div style={{fontSize: '10px', color: '#888'}}>{style.desc}</div>
                          </div>
                          {learningStyle === style.value && (
                            <span style={{color: '#8b5cf6'}}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={clearNotesState} 
                  style={styles.toolBtn} 
                  title="Clear all notes"
                >
                  <ClearIcon size={14} color="currentColor" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div style={styles.notesActionsGrid}>
              <button 
                onClick={handleExtractKeyConcepts}
                disabled={notesState.isLoading.concepts}
                style={{
                  ...styles.notesActionBtn,
                  borderColor: notesState.activeSection === 'concepts' ? '#8b5cf6' : 'rgba(255,255,255,0.1)'
                }}
              >
                <LightbulbIcon size={18} color="#8b5cf6" />
                <span style={styles.notesActionLabel}>Key Concepts</span>
                {notesState.isLoading.concepts && <span style={styles.loadingDot}>...</span>}
              </button>

              <button 
                onClick={handleExtractMainPoints}
                disabled={notesState.isLoading.mainPoints}
                style={{
                  ...styles.notesActionBtn,
                  borderColor: notesState.mainPoints.length > 0 ? '#0ea5e9' : 'rgba(255,255,255,0.1)'
                }}
              >
                <TargetIcon size={18} color="#0ea5e9" />
                <span style={styles.notesActionLabel}>Main Points</span>
                {notesState.isLoading.mainPoints && <span style={styles.loadingDot}>...</span>}
              </button>

              <button 
                onClick={handleGenerateNotes}
                disabled={notesState.isLoading.notes}
                style={{
                  ...styles.notesActionBtn,
                  borderColor: notesState.activeSection === 'notes' ? '#22c55e' : 'rgba(255,255,255,0.1)'
                }}
              >
                <ListIcon size={18} color="#22c55e" />
                <span style={styles.notesActionLabel}>Simplified Notes</span>
                {notesState.isLoading.notes && <span style={styles.loadingDot}>...</span>}
              </button>

              <button 
                onClick={handleGenerateRecap}
                disabled={notesState.isLoading.recap}
                style={{
                  ...styles.notesActionBtn,
                  borderColor: notesState.activeSection === 'recap' ? '#f59e0b' : 'rgba(255,255,255,0.1)'
                }}
              >
                <StarIcon size={18} color="#f59e0b" />
                <span style={styles.notesActionLabel}>End Recap</span>
                {notesState.isLoading.recap && <span style={styles.loadingDot}>...</span>}
              </button>

              <button 
                onClick={handleGenerateStudyGuide}
                disabled={notesState.isLoading.studyGuide}
                style={{
                  ...styles.notesActionBtn,
                  ...styles.notesActionBtnWide,
                  borderColor: notesState.activeSection === 'studyguide' ? '#ec4899' : 'rgba(255,255,255,0.1)'
                }}
              >
                <BookIcon size={18} color="#ec4899" />
                <span style={styles.notesActionLabel}>One-Click Study Guide</span>
                {notesState.isLoading.studyGuide && <span style={styles.loadingDot}>...</span>}
              </button>
            </div>

            {/* Context Tools Section */}
            <div style={styles.contextToolsSection}>
              <div style={styles.contextToolsHeader}>
                <HelpCircleIcon size={14} color="#888" />
                <span>Context Tools</span>
              </div>
              <div style={styles.contextToolsGrid}>
                <button 
                  onClick={() => handleContextQuestion("What are all the key terms and their definitions mentioned in this lecture?")}
                  style={styles.contextToolBtn}
                >
                  📖 Define all terms
                </button>
                <button 
                  onClick={handleExtractFormulas}
                  disabled={notesState.isLoading.formulas}
                  style={styles.contextToolBtn}
                >
                  🔢 Extract formulas {notesState.isLoading.formulas && '...'}
                </button>
                <button 
                  onClick={() => handleContextQuestion("What examples did the teacher use to explain concepts?")}
                  style={styles.contextToolBtn}
                >
                  📋 List examples
                </button>
                <button 
                  onClick={() => handleContextQuestion("What are the most important things to remember from this lecture?")}
                  style={styles.contextToolBtn}
                >
                  ⭐ Most important
                </button>
              </div>
            </div>

            {/* Phase 3: Advanced Analysis Section */}
            <div style={styles.advancedAnalysisSection}>
              <div style={styles.contextToolsHeader}>
                <TargetIcon size={14} color="#ec4899" />
                <span>Smart Analysis</span>
              </div>
              <div style={styles.contextToolsGrid}>
                <button 
                  onClick={handleDetectTestWorthy}
                  disabled={notesState.isLoading.testWorthy}
                  style={{
                    ...styles.contextToolBtn,
                    background: testWorthySections ? 'rgba(236,72,153,0.15)' : undefined,
                    borderColor: testWorthySections ? 'rgba(236,72,153,0.3)' : undefined
                  }}
                >
                  ⭐ Test-Worthy {notesState.isLoading.testWorthy && '...'}
                </button>
                <button 
                  onClick={handleDetectConfusing}
                  disabled={notesState.isLoading.confusing}
                  style={{
                    ...styles.contextToolBtn,
                    background: confusingSections ? 'rgba(249,115,22,0.15)' : undefined,
                    borderColor: confusingSections ? 'rgba(249,115,22,0.3)' : undefined
                  }}
                >
                  ⚠️ Confusing Parts {notesState.isLoading.confusing && '...'}
                </button>
                <button 
                  onClick={handleGenerateTimeline}
                  disabled={notesState.isLoading.timeline}
                  style={{
                    ...styles.contextToolBtn,
                    background: topicTimeline ? 'rgba(99,102,241,0.15)' : undefined,
                    borderColor: topicTimeline ? 'rgba(99,102,241,0.3)' : undefined
                  }}
                >
                  📍 Topic Timeline {notesState.isLoading.timeline && '...'}
                </button>
                <button 
                  onClick={handleAnalyzeTranscript}
                  disabled={isAnalyzingTranscript}
                  style={{
                    ...styles.contextToolBtn,
                    background: segmentAnalysis.length > 0 ? 'rgba(139,92,246,0.15)' : undefined,
                    borderColor: segmentAnalysis.length > 0 ? 'rgba(139,92,246,0.3)' : undefined
                  }}
                >
                  🔍 Full Analysis {isAnalyzingTranscript && '...'}
                </button>
              </div>
            </div>

            {/* Extracted Formulas Display */}
            {extractedFormulas.length > 0 && (
              <div style={styles.formulasSection}>
                <div style={styles.notesSectionHeader}>
                  <HashIcon size={16} color="#22c55e" />
                  <span>Extracted Formulas</span>
                  <button 
                    onClick={() => {
                      const content = extractedFormulas.map(f => `${f.formula}\n  → ${f.explanation}`).join('\n\n');
                      navigator.clipboard.writeText(content);
                      setMessages(prev => [...prev, {sender: 'system', text: '✅ Copied formulas!'}]);
                    }}
                    style={styles.copySmallBtn}
                  >
                    <CopyIcon size={12} color="currentColor" />
                  </button>
                  <button 
                    onClick={() => setExtractedFormulas([])}
                    style={{...styles.copySmallBtn, marginLeft: '4px'}}
                  >
                    <XIcon size={12} color="currentColor" />
                  </button>
                </div>
                <div style={styles.formulasList}>
                  {extractedFormulas.map((f, i) => (
                    <div key={i} style={styles.formulaItem}>
                      <div style={styles.formulaText}>{f.formula}</div>
                      <div style={styles.formulaExplanation}>{f.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test-Worthy Sections Display */}
            {testWorthySections && testWorthySections.sections.length > 0 && (
              <div style={styles.testWorthySection}>
                <div style={styles.notesSectionHeader}>
                  <StarIcon size={16} color="#ec4899" />
                  <span>Test-Worthy Material</span>
                  <button 
                    onClick={() => {
                      const content = `TEST-WORTHY MATERIAL\n\n${testWorthySections.summary}\n\n${testWorthySections.sections.map(s => `[${s.confidence.toUpperCase()}] ${s.text}\n→ ${s.reason}`).join('\n\n')}`;
                      navigator.clipboard.writeText(content);
                      setMessages(prev => [...prev, {sender: 'system', text: '✅ Copied!'}]);
                    }}
                    style={styles.copySmallBtn}
                  >
                    <CopyIcon size={12} color="currentColor" />
                  </button>
                  <button 
                    onClick={() => setTestWorthySections(null)}
                    style={{...styles.copySmallBtn, marginLeft: '4px'}}
                  >
                    <XIcon size={12} color="currentColor" />
                  </button>
                </div>
                <div style={styles.testWorthySummary}>{testWorthySections.summary}</div>
                <div style={styles.testWorthyList}>
                  {testWorthySections.sections.map((section, i) => (
                    <div key={i} style={styles.testWorthyItem}>
                      <div style={styles.testWorthyItemHeader}>
                        <span style={{
                          ...styles.confidenceBadge,
                          background: section.confidence === 'certain' ? 'rgba(239,68,68,0.2)' :
                                     section.confidence === 'very_likely' ? 'rgba(236,72,153,0.2)' : 'rgba(249,115,22,0.2)',
                          color: section.confidence === 'certain' ? '#ef4444' :
                                section.confidence === 'very_likely' ? '#ec4899' : '#f97316'
                        }}>
                          {section.confidence === 'certain' ? '🎯 CERTAIN' : 
                           section.confidence === 'very_likely' ? '⭐ VERY LIKELY' : '📌 LIKELY'}
                        </span>
                      </div>
                      <div style={styles.testWorthyText}>"{section.text}"</div>
                      <div style={styles.testWorthyReason}>→ {section.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confusing Sections Display */}
            {confusingSections && confusingSections.sections.length > 0 && (
              <div style={styles.confusingSection}>
                <div style={styles.notesSectionHeader}>
                  <HelpCircleIcon size={16} color="#f97316" />
                  <span>Areas to Review</span>
                  <span style={styles.clarityBadge}>
                    {confusingSections.overallClarity === 'clear' ? '✅ Clear' :
                     confusingSections.overallClarity === 'mostly_clear' ? '👍 Mostly Clear' :
                     confusingSections.overallClarity === 'somewhat_confusing' ? '⚠️ Some Confusion' : '❗ Very Confusing'}
                  </span>
                  <button 
                    onClick={() => setConfusingSections(null)}
                    style={{...styles.copySmallBtn, marginLeft: 'auto'}}
                  >
                    <XIcon size={12} color="currentColor" />
                  </button>
                </div>
                <div style={styles.confusingList}>
                  {confusingSections.sections.map((section, i) => (
                    <div key={i} style={{
                      ...styles.confusingItem,
                      borderLeftColor: section.severity === 'significant' ? '#ef4444' :
                                       section.severity === 'moderate' ? '#f97316' : '#f59e0b'
                    }}>
                      <div style={styles.confusingSeverity}>
                        {section.severity === 'significant' ? '🔴' : section.severity === 'moderate' ? '🟠' : '🟡'} 
                        {section.severity.toUpperCase()}
                      </div>
                      <div style={styles.confusingText}>"{section.text}"</div>
                      <div style={styles.confusingReason}>Why: {section.reason}</div>
                      <div style={styles.confusingSuggestion}>💡 {section.suggestion}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Timeline Display */}
            {topicTimeline && topicTimeline.timeline.length > 0 && (
              <div style={styles.timelineSection}>
                <div style={styles.notesSectionHeader}>
                  <ListIcon size={16} color="#6366f1" />
                  <span>Topic Timeline ({topicTimeline.totalTopics} topics)</span>
                  <button 
                    onClick={() => {
                      const content = topicTimeline.timeline.map(t => `${t.time} - ${t.topic} (${t.type})${t.duration ? ` [${t.duration}]` : ''}`).join('\n');
                      navigator.clipboard.writeText(content);
                      setMessages(prev => [...prev, {sender: 'system', text: '✅ Copied timeline!'}]);
                    }}
                    style={styles.copySmallBtn}
                  >
                    <CopyIcon size={12} color="currentColor" />
                  </button>
                  <button 
                    onClick={() => setTopicTimeline(null)}
                    style={{...styles.copySmallBtn, marginLeft: '4px'}}
                  >
                    <XIcon size={12} color="currentColor" />
                  </button>
                </div>
                <div style={styles.timelineList}>
                  {topicTimeline.timeline.map((item, i) => (
                    <div key={i} style={styles.timelineItem}>
                      <div style={styles.timelineTime}>{item.time}</div>
                      <div style={styles.timelineDot}></div>
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineTopic}>{item.topic}</div>
                        <div style={styles.timelineMeta}>
                          <span style={{
                            ...styles.timelineType,
                            background: item.type === 'intro' ? 'rgba(139,92,246,0.2)' :
                                       item.type === 'deep_dive' ? 'rgba(14,165,233,0.2)' :
                                       item.type === 'example' ? 'rgba(34,197,94,0.2)' :
                                       item.type === 'review' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'
                          }}>
                            {item.type === 'intro' ? '🆕' : item.type === 'deep_dive' ? '🔍' : 
                             item.type === 'example' ? '📝' : item.type === 'review' ? '🔄' : '➡️'} {item.type}
                          </span>
                          {item.duration && <span style={styles.timelineDuration}>{item.duration}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Display Area */}
            <div style={styles.notesResultsArea}>
              {/* Empty State */}
              {!notesState.keyConcepts.length && !notesState.mainPoints.length && 
               !notesState.simplifiedNotes && !notesState.recap && !notesState.studyGuide && 
               !Object.values(notesState.isLoading).some(v => v) && (
                <div style={styles.notesEmptyState}>
                  <FileTextIcon size={32} color="rgba(255,255,255,0.2)" />
                  <p style={{marginTop: '12px', fontSize: '13px', color: '#666'}}>
                    {transcriptLog || scannedText 
                      ? "Click a button above to analyze your lecture content"
                      : "Record audio or scan screen to get started"}
                  </p>
                  {(transcriptLog || scannedText) && (
                    <p style={{fontSize: '11px', color: '#555', marginTop: '4px'}}>
                      {transcriptLog ? `📝 ${transcriptLog.split(' ').length} words in transcript` : ''}
                      {transcriptLog && scannedText ? ' • ' : ''}
                      {scannedText ? '📷 Screen captured' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Loading State */}
              {Object.values(notesState.isLoading).some(v => v) && (
                <div style={styles.notesLoadingState}>
                  <div style={styles.loadingSpinner}></div>
                  <p style={{marginTop: '12px', fontSize: '13px', color: '#888'}}>Analyzing lecture content...</p>
                </div>
              )}

              {/* Key Concepts Results */}
              {(notesState.keyConcepts.length > 0 || notesState.definitions.length > 0) && !notesState.isLoading.concepts && (
                <div style={styles.notesSection}>
                  <div style={styles.notesSectionHeader}>
                    <LightbulbIcon size={16} color="#8b5cf6" />
                    <span>Key Concepts</span>
                    <button 
                      onClick={() => handleCopyNotesContent(
                        `KEY CONCEPTS:\n${notesState.keyConcepts.map(c => `• ${c}`).join('\n')}\n\nDEFINITIONS:\n${notesState.definitions.map(d => `• ${d.term}: ${d.definition}`).join('\n')}`
                      )}
                      style={styles.copySmallBtn}
                    >
                      <CopyIcon size={12} color="currentColor" />
                    </button>
                  </div>
                  <div style={styles.conceptsList}>
                    {notesState.keyConcepts.map((concept, i) => (
                      <div key={i} style={styles.conceptItem}>
                        <span style={styles.conceptBullet}>•</span>
                        <span>{concept}</span>
                      </div>
                    ))}
                  </div>
                  {notesState.definitions.length > 0 && (
                    <>
                      <div style={{...styles.notesSectionHeader, marginTop: '12px'}}>
                        <span style={{fontSize: '11px', color: '#888'}}>Definitions</span>
                      </div>
                      <div style={styles.definitionsList}>
                        {notesState.definitions.map((def, i) => (
                          <div key={i} style={styles.definitionItem}>
                            <span style={styles.definitionTerm}>{def.term}:</span>
                            <span style={styles.definitionText}>{def.definition}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Main Points Results */}
              {notesState.mainPoints.length > 0 && !notesState.isLoading.mainPoints && (
                <div style={styles.notesSection}>
                  <div style={styles.notesSectionHeader}>
                    <TargetIcon size={16} color="#0ea5e9" />
                    <span>Main Teaching Points</span>
                    <button 
                      onClick={() => handleCopyNotesContent(notesState.mainPoints.map((p, i) => `${i+1}. ${p}`).join('\n'))}
                      style={styles.copySmallBtn}
                    >
                      <CopyIcon size={12} color="currentColor" />
                    </button>
                  </div>
                  <div style={styles.mainPointsList}>
                    {notesState.mainPoints.map((point, i) => (
                      <div key={i} style={styles.mainPointItem}>
                        <span style={styles.mainPointNumber}>{i + 1}</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simplified Notes Results */}
              {notesState.simplifiedNotes && !notesState.isLoading.notes && (
                <div style={styles.notesSection}>
                  <div style={styles.notesSectionHeader}>
                    <ListIcon size={16} color="#22c55e" />
                    <span>Simplified Notes</span>
                    <button 
                      onClick={() => handleCopyNotesContent(notesState.simplifiedNotes)}
                      style={styles.copySmallBtn}
                    >
                      <CopyIcon size={12} color="currentColor" />
                    </button>
                  </div>
                  <div style={styles.simplifiedNotesContent}>
                    {notesState.simplifiedNotes}
                  </div>
                </div>
              )}

              {/* Recap Results */}
              {notesState.recap && !notesState.isLoading.recap && (
                <div style={styles.notesSection}>
                  <div style={styles.notesSectionHeader}>
                    <StarIcon size={16} color="#f59e0b" />
                    <span>Lecture Recap</span>
                    <button 
                      onClick={() => handleCopyNotesContent(
                        `SUMMARY:\n${notesState.recap?.summary}\n\nTOPICS TO REVIEW:\n${notesState.recap?.reviewTopics.map(t => `• ${t}`).join('\n')}\n\nNEXT STEPS:\n${notesState.recap?.nextSteps.map(s => `• ${s}`).join('\n')}`
                      )}
                      style={styles.copySmallBtn}
                    >
                      <CopyIcon size={12} color="currentColor" />
                    </button>
                  </div>
                  <div style={styles.recapContent}>
                    <div style={styles.recapSummary}>{notesState.recap.summary}</div>
                    
                    {notesState.recap.reviewTopics.length > 0 && (
                      <div style={styles.recapSubsection}>
                        <span style={styles.recapSubtitle}>📚 Topics to Review</span>
                        <ul style={styles.recapList}>
                          {notesState.recap.reviewTopics.map((topic, i) => (
                            <li key={i}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {notesState.recap.nextSteps.length > 0 && (
                      <div style={styles.recapSubsection}>
                        <span style={styles.recapSubtitle}>✅ Next Steps</span>
                        <ul style={styles.recapList}>
                          {notesState.recap.nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Study Guide Results */}
              {notesState.studyGuide && !notesState.isLoading.studyGuide && (
                <div style={styles.notesSection}>
                  <div style={styles.notesSectionHeader}>
                    <BookIcon size={16} color="#ec4899" />
                    <span>{notesState.studyGuide.title || 'Study Guide'}</span>
                    <button 
                      onClick={() => {
                        const sg = notesState.studyGuide!;
                        const content = [
                          `# ${sg.title}\n`,
                          `## Key Concepts\n${sg.keyConcepts.map(c => `• ${c}`).join('\n')}\n`,
                          sg.definitions.length ? `## Definitions\n${sg.definitions.map(d => `• ${d.term}: ${d.definition}`).join('\n')}\n` : '',
                          sg.formulas.length ? `## Formulas\n${sg.formulas.map(f => `• ${f}`).join('\n')}\n` : '',
                          `## Main Takeaways\n${sg.mainTakeaways.map(t => `• ${t}`).join('\n')}\n`,
                          `## Test-Likely Topics\n${sg.testLikelyTopics.map(t => `⭐ ${t}`).join('\n')}\n`,
                          `## Study Tips\n${sg.studyTips.map(t => `💡 ${t}`).join('\n')}`
                        ].filter(Boolean).join('\n');
                        handleCopyNotesContent(content);
                      }}
                      style={styles.copySmallBtn}
                    >
                      <CopyIcon size={12} color="currentColor" />
                    </button>
                  </div>
                  
                  <div style={styles.studyGuideContent}>
                    {/* Key Concepts */}
                    {notesState.studyGuide.keyConcepts.length > 0 && (
                      <div style={styles.sgSection}>
                        <span style={styles.sgSectionTitle}>💡 Key Concepts</span>
                        <div style={styles.sgList}>
                          {notesState.studyGuide.keyConcepts.map((c, i) => (
                            <span key={i} style={styles.sgChip}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Definitions */}
                    {notesState.studyGuide.definitions.length > 0 && (
                      <div style={styles.sgSection}>
                        <span style={styles.sgSectionTitle}>📖 Definitions</span>
                        {notesState.studyGuide.definitions.map((d, i) => (
                          <div key={i} style={styles.sgDefinition}>
                            <strong>{d.term}:</strong> {d.definition}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulas */}
                    {notesState.studyGuide.formulas.length > 0 && (
                      <div style={styles.sgSection}>
                        <span style={styles.sgSectionTitle}>🔢 Formulas</span>
                        {notesState.studyGuide.formulas.map((f, i) => (
                          <div key={i} style={styles.sgFormula}>{f}</div>
                        ))}
                      </div>
                    )}

                    {/* Main Takeaways */}
                    {notesState.studyGuide.mainTakeaways.length > 0 && (
                      <div style={styles.sgSection}>
                        <span style={styles.sgSectionTitle}>🎯 Main Takeaways</span>
                        <ul style={styles.sgBulletList}>
                          {notesState.studyGuide.mainTakeaways.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Test-Likely Topics */}
                    {notesState.studyGuide.testLikelyTopics.length > 0 && (
                      <div style={styles.sgSection}>
                        <span style={styles.sgSectionTitle}>⭐ Likely on Test</span>
                        <div style={styles.sgList}>
                          {notesState.studyGuide.testLikelyTopics.map((t, i) => (
                            <span key={i} style={{...styles.sgChip, background: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.3)'}}>{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Study Tips */}
                    {notesState.studyGuide.studyTips.length > 0 && (
                      <div style={styles.sgSection}>
                        <span style={styles.sgSectionTitle}>📝 Study Tips</span>
                        {notesState.studyGuide.studyTips.map((tip, i) => (
                          <div key={i} style={styles.sgTip}>💡 {tip}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>
      )}

      {/* --- CONTROL BAR CONTAINER (Centered Above Main Card) --- */}
      <div style={styles.controlBarContainer}>
        <div style={styles.controlBar}>
          <button 
            style={{
              ...styles.controlBtn, 
              ...styles.controlBtnCircle,
              transition: 'all 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)'
            }}
            title="Incognito Mode"
            onClick={toggleStealth}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = isDetectable
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(211, 47, 47, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <IncognitoIcon
              size={16}
              color={isDetectable ? '#aaa' : '#ff5252'}
            />
          </button>
          
          {/* SMART EYE BUTTON */}
          <div 
            style={{position: 'relative', display: 'flex', alignItems: 'center'}}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button 
              onClick={() => scanScreen()} 
              style={{
                ...styles.controlBtn, 
                color: isScanning ? '#0ea5e9' : (scannedText ? 'white' : '#aaa'),
                position: 'relative'
              }}
              title="Scan Screen"
            >
              <EyeIcon size={16} color={isScanning ? '#0ea5e9' : (scannedText ? 'white' : '#aaa')} />
            </button>
            
            {/* The "Live" Dot (Shows if we have context) */}
            {!isScanning && scannedText && (
              <div style={{
                position: 'absolute', 
                top: 2, 
                right: 2, 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: '#4caf50', 
                border: '1px solid #1a1a1a',
                zIndex: 10
              }} />
            )}

            {/* The Tooltip (Only shows on hover) */}
            {showTooltip && (
              <div style={{
                position: 'absolute', 
                top: '30px', 
                right: '-10px',
                background: 'rgba(0,0,0,0.9)', 
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 10px', 
                borderRadius: '6px',
                fontSize: '10px', 
                color: '#ccc', 
                whiteSpace: 'nowrap' as const,
                zIndex: 100, 
                backdropFilter: 'blur(4px)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                Last scan: <span style={{color: '#fff', fontWeight: 700}}>{lastScanned}</span>
              </div>
            )}
          </div>
          
          <div style={styles.mediaControls}>
            <button 
              onClick={toggleListening}
              style={{
                ...styles.mediaBtn,
                ...getMediaButtonBaseStyles()
              }}
              title={isListening ? "Pause Recording" : "Start Recording"}
            >
              <span style={{ 
                filter: 'drop-shadow(0 0 0px rgba(255, 255, 255, 0))', 
                transition: 'filter 0.1s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.1s cubic-bezier(0.22, 0.61, 0.36, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isListening ? <PauseIcon size={14} color="currentColor" /> : <PlayIcon size={14} color="currentColor" />}
              </span>
            </button>
            <button 
              onClick={() => {
                if (isListening) toggleListening();
              }}
              style={{
                ...styles.mediaBtn,
                ...getMediaButtonBaseStyles()
              }}
              title="Stop Recording"
            >
              <span style={{ 
                filter: 'drop-shadow(0 0 0px rgba(255, 255, 255, 0))', 
                transition: 'filter 0.1s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.1s cubic-bezier(0.22, 0.61, 0.36, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <StopIcon size={14} color="currentColor" />
              </span>
            </button>
          </div>
          
          <button 
            onClick={() => setIsCardVisible(!isCardVisible)}
            style={styles.controlBtn}
            title={isCardVisible ? "Hide" : "Show"}
          >
            {isCardVisible ? <ChevronUpIcon size={16} color="#aaa" /> : <ChevronDownIcon size={16} color="#aaa" />}
          </button>
          
          <div style={styles.separator}></div>
          
          <div 
            style={{...styles.controlBtn, ...({WebkitAppRegion: 'drag'} as any), cursor: 'move'}}
            title="Move Window (Drag)"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <MenuIcon size={16} color="#aaa" />
          </div>
        </div>

        {/* --- CLOSE BUTTON (Right Next to Control Bar) --- */}
        <button 
          onClick={handleClose}
          style={styles.closeButton}
          title="Close"
        >
          <XIcon size={16} color="#aaa" />
        </button>
      </div>
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
  
  footer: { 
    padding: '10px 14px', 
    borderTop: '1px solid rgba(255,255,255,0.05)' 
  },
  presetsRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginBottom: '8px'
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '4px'
  },
  inputWrapper: {
    marginBottom: '6px'
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    padding: '6px 10px',
    transition: 'all 0.2s ease'
  },
  input: { 
    flex: 1, 
    background: 'transparent', 
    border: 'none', 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: '13px', 
    outline: 'none',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.5'
  },
  sendBtn: { 
    minWidth: '32px', 
    height: '28px', 
    borderRadius: '999px', 
    border: '0',
    color: 'hsla(0, 0%, 90%, 1)',
    fontWeight: 600, 
    fontSize: '14px',
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    transition: 'all 0.1s cubic-bezier(0.22, 0.61, 0.36, 1)',
    position: 'relative',
    overflow: 'hidden',
    padding: '0 10px',
    letterSpacing: '0.05em',
    lineHeight: '1',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #646cff 0%, #4c54d4 100%)'
  },
  modeRow: { 
    display: 'flex', 
    justifyContent: 'flex-start', 
    gap: '14px',
    paddingTop: '4px' 
  },
  modeChip: { 
    fontSize: '10px', 
    fontWeight: 600, 
    textTransform: 'uppercase' as const, 
    letterSpacing: '1px', 
    cursor: 'pointer', 
    padding: '6px 12px', 
    borderRadius: '8px',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none' as const,
    overflow: 'hidden',
  },
  modeChipActive: {
    opacity: 1,
    transform: 'scale(1.08) translateY(-1px)',
    background: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  modeChipInactive: {
    opacity: 0.5,
    transform: 'scale(1)',
    borderBottomWidth: '0px',
    background: 'transparent',
    boxShadow: 'none',
  },
  presetChip: {
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: '11px',
    padding: '4px 10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s ease-out',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  clearChatBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.15s ease-out',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
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
  primaryBtn: { padding: '8px 16px', borderRadius: '8px', background: '#646cff', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px' },
  
  // Control Bar Styles (Top Center)
  controlBarContainer: {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 1000,
    pointerEvents: 'auto',
    ...({WebkitAppRegion: 'no-drag'} as any)
  },
  controlBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(20, 20, 25, 0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    padding: '4px',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.03)',
    transition: 'all 0.2s ease-out'
  },
  controlBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
    transition: '0.2s',
    color: '#aaa',
    minWidth: '28px',
    height: '28px',
    pointerEvents: 'auto',
    position: 'relative',
    zIndex: 1001
  },
  controlBtnCircle: {
    borderRadius: '50%',
    padding: '6px'
  },
  mediaControls: {
    display: 'flex',
    gap: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    padding: '3px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  mediaBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 6px',
    borderRadius: '6px',
    transition: 'all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
    color: 'rgba(255, 255, 255, 0.6)',
    minWidth: '24px',
    height: '24px',
    position: 'relative',
    pointerEvents: 'auto',
    zIndex: 1001
  },
  separator: {
    width: '1px',
    height: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '0 2px'
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(20, 20, 25, 0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    color: '#aaa',
    flexShrink: 0,
    pointerEvents: 'auto',
    zIndex: 1001
  },
  
  // --- NOTES TAB STYLES ---
  notesView: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  notesToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  notesActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    padding: '12px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  notesActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#fff'
  },
  notesActionBtnWide: {
    gridColumn: 'span 2'
  },
  notesActionLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#ccc'
  },
  loadingDot: {
    marginLeft: 'auto',
    color: '#888',
    animation: 'pulse 1s infinite'
  },
  notesResultsArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px'
  },
  notesEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '20px'
  },
  notesLoadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  notesSection: {
    marginBottom: '16px',
    padding: '12px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  notesSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff'
  },
  copySmallBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s'
  },
  conceptsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  conceptItem: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.5'
  },
  conceptBullet: {
    color: '#8b5cf6',
    fontWeight: 700
  },
  definitionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  definitionItem: {
    fontSize: '12px',
    lineHeight: '1.5',
    padding: '8px',
    background: 'rgba(139,92,246,0.08)',
    borderRadius: '6px',
    borderLeft: '2px solid #8b5cf6'
  },
  definitionTerm: {
    fontWeight: 600,
    color: '#a78bfa',
    marginRight: '4px'
  },
  definitionText: {
    color: '#ccc'
  },
  mainPointsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  mainPointItem: {
    display: 'flex',
    gap: '10px',
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.5'
  },
  mainPointNumber: {
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(14,165,233,0.2)',
    color: '#0ea5e9',
    borderRadius: '50%',
    fontSize: '11px',
    fontWeight: 700,
    flexShrink: 0
  },
  simplifiedNotesContent: {
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap'
  },
  recapContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  recapSummary: {
    fontSize: '13px',
    color: '#fff',
    lineHeight: '1.6',
    padding: '10px',
    background: 'rgba(245,158,11,0.1)',
    borderRadius: '8px',
    borderLeft: '3px solid #f59e0b'
  },
  recapSubsection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  recapSubtitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  recapList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.6'
  },
  studyGuideContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  sgSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sgSectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#ec4899',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  sgList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  sgChip: {
    fontSize: '11px',
    padding: '4px 10px',
    background: 'rgba(139,92,246,0.15)',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: '999px',
    color: '#ccc'
  },
  sgDefinition: {
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.5',
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px'
  },
  sgFormula: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#22c55e',
    padding: '8px 10px',
    background: 'rgba(34,197,94,0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(34,197,94,0.2)'
  },
  sgBulletList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#ccc',
    lineHeight: '1.6'
  },
  sgTip: {
    fontSize: '12px',
    color: '#ccc',
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px',
    lineHeight: '1.5'
  },
  
  // --- PHASE 2: INTERACTIVE FEATURES STYLES ---
  
  // Tap-to-Explain - Clickable transcript rows
  transcriptRowClickable: {
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderRadius: '6px',
    padding: '6px 8px',
    margin: '2px 0',
    position: 'relative'
  },
  tapToExplainHint: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    opacity: 0,
    transition: 'opacity 0.15s ease'
  },
  
  // Segment Explanation Popup
  segmentPopup: {
    position: 'absolute',
    bottom: '60px',
    left: '12px',
    right: '12px',
    background: 'rgba(20, 20, 25, 0.98)',
    backdropFilter: 'blur(20px)',
    borderRadius: '12px',
    border: '1px solid rgba(139,92,246,0.3)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    maxHeight: '300px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100
  },
  segmentPopupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  segmentPopupTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff'
  },
  segmentPopupClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  segmentPopupSelected: {
    padding: '8px 12px',
    fontSize: '11px',
    color: '#888',
    fontStyle: 'italic',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(139,92,246,0.05)'
  },
  segmentPopupContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px'
  },
  segmentPopupLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '20px',
    color: '#888',
    fontSize: '13px'
  },
  segmentPopupExplanation: {
    fontSize: '13px',
    color: '#ccc',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap'
  },
  segmentPopupActions: {
    display: 'flex',
    gap: '6px',
    padding: '10px 12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.2)'
  },
  contextActionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#aaa',
    fontSize: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  
  // Right-click Context Menu
  contextMenu: {
    position: 'fixed',
    background: 'rgba(20, 20, 25, 0.98)',
    backdropFilter: 'blur(20px)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    padding: '4px',
    minWidth: '180px',
    zIndex: 1000
  },
  contextMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 10px',
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    color: '#ccc',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease'
  },
  contextMenuDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
    margin: '4px 0'
  },
  
  // Learning Style Dropdown
  learningStyleDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    background: 'rgba(20, 20, 25, 0.98)',
    backdropFilter: 'blur(20px)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    padding: '8px',
    minWidth: '220px',
    zIndex: 100
  },
  learningStyleDropdownHeader: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '6px 8px',
    marginBottom: '4px'
  },
  learningStyleOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s ease'
  },
  
  // Context Tools Section
  contextToolsSection: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  contextToolsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  },
  contextToolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px'
  },
  contextToolBtn: {
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#ccc',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textAlign: 'center'
  },
  
  // Formulas Section
  formulasSection: {
    margin: '0 14px 14px',
    padding: '12px',
    background: 'rgba(34,197,94,0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(34,197,94,0.15)'
  },
  formulasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  formulaItem: {
    padding: '10px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    borderLeft: '3px solid #22c55e'
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#22c55e',
    fontWeight: 600,
    marginBottom: '4px'
  },
  formulaExplanation: {
    fontSize: '11px',
    color: '#888',
    lineHeight: '1.4'
  },
  
  // --- PHASE 3: ADVANCED INTELLIGENCE STYLES ---
  
  // Analysis Filters Bar
  analysisFiltersBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    background: 'rgba(0,0,0,0.2)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    overflowX: 'auto'
  },
  analysisFilterBtn: {
    padding: '4px 8px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#888',
    fontSize: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  },
  analysisFilterDivider: {
    width: '1px',
    height: '16px',
    background: 'rgba(255,255,255,0.1)',
    margin: '0 4px'
  },
  
  // Segment Tags
  topicLabel: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#8b5cf6',
    background: 'rgba(139,92,246,0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    alignSelf: 'flex-start'
  },
  segmentTagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '2px'
  },
  segmentTag: {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '3px',
    border: '1px solid',
    fontWeight: 500,
    textTransform: 'uppercase'
  },
  testWorthyBadge: {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '3px',
    background: 'rgba(236,72,153,0.2)',
    color: '#ec4899',
    fontWeight: 700
  },
  confusingBadge: {
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '3px',
    background: 'rgba(249,115,22,0.2)',
    color: '#f97316',
    fontWeight: 700
  },
  
  // Advanced Analysis Section
  advancedAnalysisSection: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(236,72,153,0.03)'
  },
  
  // Test-Worthy Section
  testWorthySection: {
    margin: '0 14px 14px',
    padding: '12px',
    background: 'rgba(236,72,153,0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(236,72,153,0.15)'
  },
  testWorthySummary: {
    fontSize: '12px',
    color: '#fff',
    padding: '10px',
    background: 'rgba(236,72,153,0.1)',
    borderRadius: '6px',
    marginBottom: '10px',
    lineHeight: '1.5'
  },
  testWorthyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  testWorthyItem: {
    padding: '10px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    borderLeft: '3px solid #ec4899'
  },
  testWorthyItemHeader: {
    marginBottom: '6px'
  },
  confidenceBadge: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px'
  },
  testWorthyText: {
    fontSize: '12px',
    color: '#fff',
    fontStyle: 'italic',
    marginBottom: '4px',
    lineHeight: '1.5'
  },
  testWorthyReason: {
    fontSize: '11px',
    color: '#888',
    lineHeight: '1.4'
  },
  
  // Confusing Section
  confusingSection: {
    margin: '0 14px 14px',
    padding: '12px',
    background: 'rgba(249,115,22,0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(249,115,22,0.15)'
  },
  clarityBadge: {
    fontSize: '10px',
    color: '#888',
    marginLeft: '8px'
  },
  confusingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  confusingItem: {
    padding: '10px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    borderLeft: '3px solid #f97316'
  },
  confusingSeverity: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#f97316',
    marginBottom: '4px'
  },
  confusingText: {
    fontSize: '12px',
    color: '#fff',
    fontStyle: 'italic',
    marginBottom: '4px',
    lineHeight: '1.5'
  },
  confusingReason: {
    fontSize: '11px',
    color: '#888',
    marginBottom: '4px',
    lineHeight: '1.4'
  },
  confusingSuggestion: {
    fontSize: '11px',
    color: '#22c55e',
    background: 'rgba(34,197,94,0.1)',
    padding: '6px 8px',
    borderRadius: '4px',
    lineHeight: '1.4'
  },
  
  // Timeline Section
  timelineSection: {
    margin: '0 14px 14px',
    padding: '12px',
    background: 'rgba(99,102,241,0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(99,102,241,0.15)'
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0'
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 0',
    position: 'relative'
  },
  timelineTime: {
    fontSize: '10px',
    color: '#6366f1',
    fontWeight: 600,
    minWidth: '45px',
    flexShrink: 0
  },
  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#6366f1',
    flexShrink: 0,
    marginTop: '4px',
    position: 'relative'
  },
  timelineContent: {
    flex: 1
  },
  timelineTopic: {
    fontSize: '12px',
    color: '#fff',
    fontWeight: 500,
    marginBottom: '4px'
  },
  timelineMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  timelineType: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#ccc'
  },
  timelineDuration: {
    fontSize: '10px',
    color: '#666'
  }
};

export default Overlay;
