import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { LiquidBackground } from './LiquidBackground';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { DownloadModal } from './DownloadModal';
import { Navbar } from './Navbar';
import { Logo } from './Logo';
import { ArrowRight, Brain, Zap, Shield, Sparkles, BookOpen, Layers, Target, MousePointer2, AlertCircle } from 'lucide-react';

export const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, 50]);

  return (
    <div 
      className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-indigo-500/30" 
      style={{ backgroundColor: '#050505' }}
    >
      <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(circle at 50% 0%, #1a1a2e 0%, #050505 60%)' }} />
      <LiquidBackground />

      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 pt-32 pb-20 overflow-hidden">
        <motion.div 
          style={{ opacity, y }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Visnly v2.0 is Live</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 pb-2">
              Your Invisible
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300">
              Second Brain.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Real-time lecture analysis, instant answers, and smart study tools.
            <span className="text-white font-medium"> Completely undetectable.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button 
              className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
              onClick={() => {
                const downloadUrl = import.meta.env.VITE_DOWNLOAD_URL || '/downloads/Visnly-Setup.exe';
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = 'Visnly-Setup.exe';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity" />
              <span className="flex items-center gap-2">
                Download for Windows
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <Link to="/how-it-works" className="px-8 py-4 rounded-full font-medium text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
              See how it works
            </Link>
          </div>
        </motion.div>

        {/* Floating UI Elements Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 relative w-full max-w-4xl perspective-1000"
        >
          <div className="relative bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Mockup Header */}
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="ml-4 px-3 py-1 rounded-md bg-white/5 text-[10px] text-gray-400 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Transcript Active
              </div>
            </div>

            {/* Mockup Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[300px] md:h-[400px]">
              {/* Left Column: Chat/Transcript */}
              <div className="md:col-span-2 bg-black/40 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10 pointer-events-none" />
                <div className="flex items-start gap-3 opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">AI</div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-white/5 text-sm text-gray-300">
                    Based on the screen, here's the solution for the differential equation...
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 text-xs font-bold">V</div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-indigo-500/10 border border-indigo-500/20 text-sm text-gray-200">
                    <p className="font-semibold text-indigo-400 text-xs mb-1 uppercase tracking-wider">Tap-to-Explain</p>
                    The term <span className="text-white font-mono bg-white/10 px-1 rounded">dy/dx</span> represents the rate of change. Since this is a first-order linear equation...
                  </div>
                </div>
                <div className="mt-auto z-20">
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-[10px] border border-yellow-500/20">⚠️ Confusing Part Detected</span>
                    <span className="px-2 py-1 rounded bg-pink-500/10 text-pink-500 text-[10px] border border-pink-500/20">⭐ Test-Worthy</span>
                  </div>
                  <div className="h-10 bg-white/5 rounded-lg border border-white/10 flex items-center px-4 text-gray-500 text-sm">
                    Ask a follow-up question...
                  </div>
                </div>
              </div>

              {/* Right Column: Tools */}
              <div className="hidden md:flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover/card:text-indigo-300"><Brain size={16} /></div>
                    <span className="font-medium text-sm">Key Concepts</span>
                  </div>
                  <div className="h-1.5 w-12 bg-white/10 rounded-full mb-1" />
                  <div className="h-1.5 w-8 bg-white/10 rounded-full" />
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/20 text-green-400 group-hover/card:text-green-300"><Target size={16} /></div>
                    <span className="font-medium text-sm">Main Points</span>
                  </div>
                  <div className="h-1.5 w-16 bg-white/10 rounded-full mb-1" />
                  <div className="h-1.5 w-10 bg-white/10 rounded-full" />
                </div>
                <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Live Analysis</span>
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-indigo-500 rounded-full" />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Confidence</span>
                      <span>98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Section 1: Analysis */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm mb-4">
                <Sparkles size={16} />
                <span>PHASE 1: INTELLIGENCE</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Turn Lectures into <br />
                <span className="text-white">Knowledge Instantly.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Stop frantically typing. Visnly listens to your lecture and watches your screen to extract what actually matters.
              </p>
              <ul className="space-y-4">
                {[
                  "Key Concepts & Definition Extraction",
                  "Automatic Bullet-Point Notes",
                  "End-of-Lecture Recaps & Study Guides"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl -z-10" />
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">One-Click Study Guide</h3>
                    <p className="text-sm text-gray-500">Generated 2m ago • Calculus I</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-xs text-indigo-400 font-bold mb-1">KEY CONCEPT</div>
                    <div className="text-sm text-gray-200">The Chain Rule applies when differentiating composite functions.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-xs text-green-400 font-bold mb-1">FORMULA</div>
                    <div className="text-sm font-mono text-gray-200">d/dx [f(g(x))] = f'(g(x)) * g'(x)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-xs text-pink-400 font-bold mb-1">TEST TIP</div>
                    <div className="text-sm text-gray-200">Professor emphasized this will be 20% of the midterm.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: Interaction */}
      <section className="py-24 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center md:grid-flow-col-dense">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="md:col-start-2"
            >
              <div className="flex items-center gap-2 text-purple-400 font-mono text-sm mb-4">
                <MousePointer2 size={16} />
                <span>PHASE 2: INTERACTION</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Don't Just Watch. <br />
                <span className="text-white">Interact.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Confused? Just click. Visnly makes every line of your lecture transcript interactive.
              </p>
              <ul className="space-y-4">
                {[
                  "Tap-to-Explain: Instant clarity on any sentence",
                  "Context Tools: \"What did they mean by that?\"",
                  "Adapt to Your Style: Explanations in simple terms or analogies"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative md:col-start-1"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-purple-500/20 to-pink-500/20 blur-3xl -z-10" />
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-1/2 right-10 w-8 h-8 bg-white/20 rounded-full animate-ping" />
                <div className="absolute top-1/2 right-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black z-20 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                  <MousePointer2 size={16} />
                </div>
                
                <div className="space-y-4 opacity-50 blur-[1px]">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/10 rounded w-5/6" />
                </div>
                
                <div className="mt-6 p-4 bg-[#1A1A1A] border border-purple-500/30 rounded-xl shadow-2xl relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                      <Zap size={12} /> AI Explanation
                    </div>
                    <div className="text-[10px] text-gray-500">Just now</div>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    The professor is referring to <span className="text-white font-semibold">entropy</span> here. Imagine a messy room—it takes work to clean it (order), but it gets messy naturally (disorder). That's what they mean by "natural tendency towards disorder."
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 3: Detection */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 text-red-400 font-mono text-sm mb-4">
                <AlertCircle size={16} />
                <span>PHASE 3: DETECTION</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Know What Matters <br />
                <span className="text-white">Before the Exam.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Visnly's AI stays alert even when you zone out. It flags critical moments automatically.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                  <Target className="text-red-400 mb-3" size={24} />
                  <h4 className="font-bold mb-1">Test-Worthy Detection</h4>
                  <p className="text-xs text-gray-400">Flags "this will be on the exam" moments instantly.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-colors">
                  <div className="text-yellow-400 mb-3 font-bold text-xl">?</div>
                  <h4 className="font-bold mb-1">Confusion Alerts</h4>
                  <p className="text-xs text-gray-400">Identifies complex topics that need extra review.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
                  <Layers className="text-blue-400 mb-3" size={24} />
                  <h4 className="font-bold mb-1">Auto-Timestamps</h4>
                  <p className="text-xs text-gray-400">Marks new topics, examples, and definitions.</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative h-[400px]"
            >
              {/* Abstract Timeline Visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-full bg-white/10 relative">
                  {[0.2, 0.4, 0.6, 0.8].map((top, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-[#050505]"
                      style={{ 
                        top: `${top * 100}%`,
                        backgroundColor: i === 1 ? '#ec4899' : i === 3 ? '#eab308' : '#6366f1' 
                      }}
                    >
                      <div className={`absolute left-8 top-1/2 -translate-y-1/2 w-48 p-3 rounded-lg border backdrop-blur-md ${
                        i === 1 ? 'bg-pink-500/10 border-pink-500/30' : 
                        i === 3 ? 'bg-yellow-500/10 border-yellow-500/30' : 
                        'bg-indigo-500/10 border-indigo-500/30'
                      }`}>
                        <div className={`text-[10px] font-bold mb-1 ${
                          i === 1 ? 'text-pink-400' : i === 3 ? 'text-yellow-400' : 'text-indigo-400'
                        }`}>
                          {i === 1 ? 'TEST ALERT' : i === 3 ? 'CONFUSION DETECTED' : 'NEW TOPIC'}
                        </div>
                        <div className="text-xs text-gray-300">
                          {i === 1 ? 'Prof: "You WILL see this on the final."' : 
                           i === 3 ? 'Complex explanation detected.' : 'Intro to Derivatives'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Pricing />
      <FAQ />

      {/* CTA Section */}
      <section className="py-32 px-4 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent -z-10" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tight"
          >
            Pass the Class. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Keep the Knowledge.</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <button 
              className="btn scale-125" 
              tabIndex={0} 
              onMouseDown={() => setIsDownloading(true)}
              onMouseUp={() => setIsDownloading(false)}
              onMouseLeave={() => setIsDownloading(false)}
              onClick={() => {
                const downloadUrl = import.meta.env.VITE_DOWNLOAD_URL || '/downloads/Visnly-Setup.exe';
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = 'Visnly-Setup.exe';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <svg className="btn-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 3.449L9.75 2.1v9.451H0V3.449zm10.949-1.606L24 0v11.551H10.949V1.843zm-10.949 11.4h9.75V21.9L0 20.551V13.243zm10.949 0H24V24L10.949 22.157V13.243z" fill="currentColor"/>
              </svg>
              <span className="btn-text">{isDownloading ? 'Starting Download...' : 'Get for Windows'}</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 relative z-10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <div className="font-bold text-xl tracking-tight">Visnly</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="mailto:support@visnly.com" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-600">© 2025 Visnly Inc.</p>
        </div>
      </footer>

      <DownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

