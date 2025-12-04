import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { askAI, extractKeyConcepts, extractMainPoints, generateSimplifiedNotes, generateRecap, generateStudyGuide, explainSegment, explainTeacherMeaning, getContextBefore, extractFormulas, rewriteInStyle, askContextQuestion, LearningStyle, analyzeTranscriptSections, detectTestWorthySections, detectConfusingSections, generateTopicTimeline, TranscriptSegmentAnalysis } from './ai';
import { supabase } from './lib/supabase';
import GlassCard from './components/GlassCard';
import { EyeIcon, CommandIcon, MenuIcon, XIcon, CopyIcon, ChevronUpIcon, ChevronDownIcon, PauseIcon, StopIcon, PlayIcon, IncognitoIcon, HomeIcon, SendIcon, ZapIcon, ScreenIcon, RefreshIcon, ClearIcon, FileTextIcon, ListIcon, LightbulbIcon, TargetIcon, StarIcon, ClipboardIcon, BookIcon, HelpCircleIcon, HashIcon, ChevronRightIcon } from './components/Icons';

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
  const [activeTab, setActiveTab] = useState<'chat' | 'transcript' | 'notes'>('chat');
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai' | 'system', text: string, answer?: string, steps?: string, timestamp?: string }[]>([]);
  const [showStepsForMessage, setShowStepsForMessage] = useState<{ [key: number]: boolean }>({});
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
          } catch (e) { }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      });
    } else {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
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

            const { data: { text } } = await Tesseract.recognize(canvas, 'eng', { logger: () => { } });
            const cleanedText = text?.trim() || '';

            if (cleanedText.length > 0) {
              setScannedText(cleanedText);
              setLastScanned(new Date().toLocaleTimeString());
              setLastScanPreview(cleanedText.substring(0, 100) + (cleanedText.length > 100 ? '...' : ''));
              try { localStorage.setItem('last_session_context', cleanedText); } catch { }
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
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No context. Scan or speak." }]);
      return;
    }
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use AI features." }]);
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
          const newMessages = [...prev, { sender: 'ai' as const, text: answer, answer, steps }];
          return newMessages;
        });
      } else {
        // For Study and Solve modes, use the response as-is
        setMessages(prev => [...prev, { sender: 'ai', text: response }]);
      }
    } catch (err) { setMessages(prev => [...prev, { sender: 'system', text: "❌ AI Error." }]); }
    setIsThinking(false);
    if (!promptOverride) {
      setInputText("");
    }
  };

  const handleSend = () => {
    if (inputText.trim()) {
      setMessages(prev => [...prev, { sender: 'user', text: inputText }]);
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
      setMessages(prev => [...prev, { sender: 'user', text: inputText, timestamp }]);
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
    setMessages(prev => [...prev, { sender: 'user', text: inputText, timestamp }]);
    runAI(mode, inputText);
  }, [inputText, mode, scannedText, transcriptLog, userId, handleAnalyze]);

  const handleTranscriptAction = useCallback(async (action: 'copy' | 'summarize' | 'clear') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === 'copy') {
      if (!transcriptLog) return;
      await navigator.clipboard.writeText(transcriptLog);
      setMessages(prev => [...prev, { sender: 'system', text: "✅ Copied!", timestamp }]);
      return;
    }
    if (action === 'clear') {
      setTranscriptLog("");
      setTranscriptSegments([]);
      setMessages(prev => [...prev, { sender: 'system', text: "🗑️ Cleared.", timestamp }]);
      return;
    }
    if (action === 'summarize') {
      if (transcriptLog.length < 50) return;
      setActiveTab('chat');
      setMessages(prev => [...prev, { sender: 'user', text: "Summarize transcript", timestamp }]);
      await runAI("Study", "Summarize the transcript so far.");
    }
  }, [transcriptLog, userId]);

  // --- NOTES TAB HANDLERS ---
  const handleExtractKeyConcepts = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first." }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to extract concepts'}` }]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, concepts: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleExtractMainPoints = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first." }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to extract main points'}` }]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, mainPoints: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleGenerateNotes = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first." }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to generate notes'}` }]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, notes: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleGenerateRecap = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first." }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to generate recap'}` }]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, recap: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleGenerateStudyGuide = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze. Record audio or scan screen first." }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to generate study guide'}` }]);
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, studyGuide: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  const handleCopyNotesContent = useCallback(async (content: string) => {
    await navigator.clipboard.writeText(content);
    setMessages(prev => [...prev, { sender: 'system', text: "✅ Copied to clipboard!" }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Select some text first." }]);
      return;
    }
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }

    setActiveTab('chat');
    setMessages(prev => [...prev, { sender: 'user', text: `What does the teacher mean by: "${targetText.substring(0, 100)}${targetText.length > 100 ? '...' : ''}"` }]);
    setIsThinking(true);

    try {
      const response = await explainTeacherMeaning(targetText, transcriptLog, scannedText, userId, learningStyle);
      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to explain'}` }]);
    } finally {
      setIsThinking(false);
      setShowContextMenu(false);
    }
  }, [selectedSegment, userId, transcriptLog, scannedText, learningStyle]);

  // Context Tool: Give me context from before
  const handleGetContextBefore = useCallback(async (text?: string) => {
    const targetText = text || selectedSegment?.text || '';
    if (!targetText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Select some text first." }]);
      return;
    }
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }

    setActiveTab('chat');
    setMessages(prev => [...prev, { sender: 'user', text: `Give me context for: "${targetText.substring(0, 100)}${targetText.length > 100 ? '...' : ''}"` }]);
    setIsThinking(true);

    try {
      const response = await getContextBefore(targetText, transcriptLog, scannedText, userId);
      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to get context'}` }]);
    } finally {
      setIsThinking(false);
      setShowContextMenu(false);
    }
  }, [selectedSegment, userId, transcriptLog, scannedText]);

  // Context Tool: Extract all formulas
  const handleExtractFormulas = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze." }]);
      return;
    }

    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, formulas: true } }));

    try {
      const formulas = await extractFormulas(transcriptLog, scannedText, userId);
      setExtractedFormulas(formulas);
      if (formulas.length === 0) {
        setMessages(prev => [...prev, { sender: 'system', text: "ℹ️ No formulas found in the lecture content." }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to extract formulas'}` }]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, formulas: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  // Rewrite content in selected learning style
  const handleRewriteInStyle = useCallback(async (content: string, style: LearningStyle) => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return '';
    }

    try {
      const rewritten = await rewriteInStyle(content, style, userId);
      return rewritten;
    } catch (error: any) {
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to rewrite'}` }]);
      return '';
    }
  }, [userId]);

  // Ask a context question
  const handleContextQuestion = useCallback(async (question: string) => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }

    setActiveTab('chat');
    setMessages(prev => [...prev, { sender: 'user', text: question }]);
    setIsThinking(true);

    try {
      const response = await askContextQuestion(question, transcriptLog, scannedText, userId, learningStyle);
      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to answer'}` }]);
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
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (transcriptSegments.length === 0) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No transcript to analyze. Start recording first." }]);
      return;
    }

    setIsAnalyzingTranscript(true);
    setMessages(prev => [...prev, { sender: 'system', text: "🔍 Analyzing transcript sections..." }]);

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
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to analyze transcript'}` }]);
    } finally {
      setIsAnalyzingTranscript(false);
    }
  }, [userId, transcriptSegments, scannedText]);

  // Detect Test-Worthy Sections
  const handleDetectTestWorthy = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze." }]);
      return;
    }

    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, testWorthy: true } }));

    try {
      const result = await detectTestWorthySections(transcriptLog, scannedText, userId);
      setTestWorthySections(result);

      if (result.sections.length === 0) {
        setMessages(prev => [...prev, { sender: 'system', text: "ℹ️ No explicitly test-worthy sections detected." }]);
      }
    } catch (error: any) {
      console.error('Failed to detect test-worthy sections:', error);
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to detect test-worthy sections'}` }]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, testWorthy: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  // Detect Confusing Sections
  const handleDetectConfusing = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (!transcriptLog && !scannedText) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No content to analyze." }]);
      return;
    }

    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, confusing: true } }));

    try {
      const result = await detectConfusingSections(transcriptLog, scannedText, userId);
      setConfusingSections(result);

      if (result.sections.length === 0) {
        setMessages(prev => [...prev, { sender: 'system', text: "✅ No confusing sections detected - lecture seems clear!" }]);
      }
    } catch (error: any) {
      console.error('Failed to detect confusing sections:', error);
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to analyze'}` }]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, confusing: false } }));
    }
  }, [userId, transcriptLog, scannedText]);

  // Generate Topic Timeline
  const handleGenerateTimeline = useCallback(async () => {
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ Please sign in to use this feature." }]);
      return;
    }
    if (transcriptSegments.length === 0) {
      setMessages(prev => [...prev, { sender: 'system', text: "⚠️ No transcript to analyze." }]);
      return;
    }

    setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, timeline: true } }));

    try {
      const result = await generateTopicTimeline(transcriptSegments, userId);
      setTopicTimeline(result);
    } catch (error: any) {
      console.error('Failed to generate timeline:', error);
      setMessages(prev => [...prev, { sender: 'system', text: `❌ ${error.message || 'Failed to generate timeline'}` }]);
    } finally {
      setNotesState(prev => ({ ...prev, isLoading: { ...prev.isLoading, timeline: false } }));
    }
  }, [userId, transcriptSegments]);

  // Get tag color for segment
  const getTagColor = (tag: string): string => {
    const colors: Record<string, string> = {
      'new_topic': 'rgba(255,255,255,0.5)',
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
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          const dir = e.key.replace('Arrow', '').toLowerCase();
          (window as any).electron?.ipcRenderer?.send('move-overlay-window', { direction: dir, distance: d });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose, handleQuickAnalysis, handleManualScan]);

  return (
      <div style={styles.container}>
        {/* Background Tint */}
        <div style={styles.tintOverlay}></div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* --- HEADER BAR --- */}
        <div style={styles.headerBar}>
          {/* Drag Handle */}
          <div style={styles.dragArea}>
            <div style={styles.dragHandle}></div>
          </div>

          {/* Mode Switcher */}
          <div style={styles.modeSwitcher}>
            {['Study', 'Solve', 'Cheat'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                style={{
                  ...styles.modeBtn,
                  ...(mode === m ? styles.modeBtnActive : {}),
                  color: mode === m ? (m === 'Cheat' ? '#ff5252' : m === 'Solve' ? '#0ea5e9' : 'rgba(255,255,255,0.7)') : '#888'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Window Controls */}
          <div style={styles.windowControls}>
            <button onClick={handleClose} style={styles.controlBtn} title="Close">
              <XIcon size={16} color="#aaa" />
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div style={styles.mainContent}>

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div style={styles.tabContent}>
              <div style={styles.chatScroll}>
                {messages.length === 0 && !scannedText && (
                  <div style={styles.emptyState}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.2 }}>🧠</div>
                    <p style={styles.emptyText}>Ready to analyze.</p>
                    <p style={styles.shortcutsHint}>Ctrl + Enter to scan & solve</p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={{ ...styles.messageRow, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={msg.sender === 'user' ? styles.userBubble : (msg.sender === 'system' ? styles.systemBubble : styles.aiBubble)}>
                      {msg.text}
                      {msg.steps && (
                        <div style={styles.stepsContainer}>
                          <div style={styles.stepsDivider}></div>
                          <div style={styles.stepsText}>{msg.steps}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div style={styles.messageRow}>
                    <div style={styles.thinkingBubble}>
                      <div style={styles.dot}></div><div style={styles.dot}></div><div style={styles.dot}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={styles.inputArea}>
                <div style={styles.inputWrapper}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask anything..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    style={styles.input}
                  />
                  <button onClick={() => scanScreen()} style={styles.actionBtn} title="Scan Screen">
                    <EyeIcon size={16} color={isScanning ? '#0ea5e9' : '#888'} />
                  </button>
                  <button onClick={handleSend} style={styles.sendBtn}>
                    <SendIcon size={16} color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TRANSCRIPT TAB */}
          {activeTab === 'transcript' && (
            <div style={styles.tabContent}>
              <div style={styles.toolbar}>
                <button onClick={toggleListening} style={styles.toolBtn}>
                  {isListening ? <PauseIcon size={14} color="#ff5252" /> : <PlayIcon size={14} color="#4caf50" />}
                  <span>{isListening ? "Pause" : "Record"}</span>
                </button>
                <button onClick={() => handleTranscriptAction('clear')} style={styles.toolBtn}>
                  <ClearIcon size={14} color="#aaa" />
                </button>
              </div>
              <div style={styles.transcriptScroll}>
                {transcriptSegments.map((seg, i) => (
                  <div key={i} style={styles.transcriptItem}>
                    <span style={styles.timeTag}>{seg.time}</span>
                    <span>{seg.text}</span>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div style={styles.tabContent}>
              <div style={styles.notesGrid}>
                <button onClick={handleGenerateNotes} style={styles.noteCard}>
                  <FileTextIcon size={24} color="rgba(255,255,255,0.6)" />
                  <span>Simplify</span>
                </button>
                <button onClick={handleExtractKeyConcepts} style={styles.noteCard}>
                  <LightbulbIcon size={24} color="#f59e0b" />
                  <span>Concepts</span>
                </button>
                <button onClick={handleGenerateStudyGuide} style={styles.noteCard}>
                  <BookIcon size={24} color="#ec4899" />
                  <span>Guide</span>
                </button>
              </div>
              <div style={styles.notesOutput}>
                {notesState.simplifiedNotes && (
                  <div style={styles.noteResult}>
                    <div style={styles.noteHeader}>Simplified Notes</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{notesState.simplifiedNotes}</div>
                  </div>
                )}
                {/* Add other note results as needed */}
              </div>
            </div>
          )}

        </div>

        {/* --- BOTTOM NAVIGATION --- */}
        <div style={styles.bottomNav}>
          <button onClick={() => setActiveTab('chat')} style={activeTab === 'chat' ? styles.navBtnActive : styles.navBtn}>
            <MessageCircleIcon size={20} color="currentColor" />
          </button>
          <button onClick={() => setActiveTab('transcript')} style={activeTab === 'transcript' ? styles.navBtnActive : styles.navBtn}>
            <FileTextIcon size={20} color="currentColor" />
          </button>
          <button onClick={() => setActiveTab('notes')} style={activeTab === 'notes' ? styles.navBtnActive : styles.navBtn}>
            <ListIcon size={20} color="currentColor" />
          </button>
        </div>
      </div>
    );
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      backgroundColor: 'rgba(18, 18, 20, 0.95)', fontFamily: '"Inter", sans-serif', overflow: 'hidden',
      color: '#fff'
    },
    tintOverlay: {
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(circle at 50% 0%, rgba(100, 108, 255, 0.1), transparent 70%)'
    },
    headerBar: {
      height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      WebkitAppRegion: 'drag'
    } as any,
    dragArea: { flex: 1, height: '100%' },
    dragHandle: { width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '22px 0 0 0' },
    modeSwitcher: {
      display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px',
      WebkitAppRegion: 'no-drag'
    } as any,
    modeBtn: {
      background: 'transparent',
      border: 'none',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: '0.2s'
    },
    modeBtnActive: { background: 'rgba(255,255,255,0.1)' },
    windowControls: { display: 'flex', gap: '8px', WebkitAppRegion: 'no-drag' } as any,
    controlBtn: {
      background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px',
      transition: '0.2s'
    },
    mainContent: { flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' },
    tabContent: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    chatScroll: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
    emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
    emptyText: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' },
    shortcutsHint: { fontSize: '12px' },
    messageRow: { display: 'flex', width: '100%' },
    userBubble: {
      background: '#27272a', padding: '12px 16px', borderRadius: '16px 16px 4px 16px',
      maxWidth: '85%', fontSize: '14px', lineHeight: '1.5', border: '1px solid rgba(255,255,255,0.1)'
    },
    aiBubble: {
      background: 'rgba(100, 108, 255, 0.1)', padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
      maxWidth: '85%', fontSize: '14px', lineHeight: '1.5', border: '1px solid rgba(100, 108, 255, 0.2)',
      whiteSpace: 'pre-wrap'
    },
    systemBubble: {
      background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '99px',
      fontSize: '11px', color: '#888', alignSelf: 'center'
    },
    thinkingBubble: {
      background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px',
      display: 'flex', gap: '4px'
    },
    dot: { width: '4px', height: '4px', background: '#888', borderRadius: '50%', animation: 'pulse 1s infinite' },
    stepsContainer: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' },
    stepsText: { fontSize: '12px', color: '#ccc', lineHeight: '1.6' },
    inputArea: { padding: '16px', background: 'rgba(18, 18, 20, 0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' },
    inputWrapper: {
      display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.05)',
      padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
    },
    input: {
      flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none'
    },
    actionBtn: {
      background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px',
      borderRadius: '8px', display: 'flex', alignItems: 'center'
    },
    sendBtn: {
      background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: '8px',
      borderRadius: '8px', display: 'flex', alignItems: 'center', color: '#fff'
    },
    bottomNav: {
      height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px',
      borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(18, 18, 20, 0.98)'
    },
    navBtn: {
      background: 'transparent', border: 'none', cursor: 'pointer', padding: '12px',
      borderRadius: '12px', color: '#666', transition: '0.2s'
    },
    navBtnActive: {
      background: 'rgba(100, 108, 255, 0.1)', border: 'none', cursor: 'pointer', padding: '12px',
      borderRadius: '12px', color: 'rgba(255,255,255,0.7)'
    },
    toolbar: { display: 'flex', gap: '8px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    toolBtn: {
      display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 12px',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '6px', color: '#ccc', fontSize: '12px', cursor: 'pointer'
    },
    transcriptScroll: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
    transcriptItem: { display: 'flex', gap: '12px', fontSize: '13px', color: '#ccc', lineHeight: '1.5' },
    timeTag: { fontSize: '11px', color: '#666', minWidth: '40px' },
    notesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px' },
    noteCard: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '12px', cursor: 'pointer', color: '#ccc', fontSize: '12px'
    },
    notesOutput: { flex: 1, overflowY: 'auto', padding: '16px' },
    noteResult: { background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.6', color: '#ccc' },
    noteHeader: { fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#fff' }
  };

  export default Overlay;
