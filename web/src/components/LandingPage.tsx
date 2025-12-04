import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { LiquidBackground } from './LiquidBackground';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { DownloadModal } from './DownloadModal';
import { Navbar } from './Navbar';
import { Logo } from './Logo';
import { ArrowRight, Brain, Zap, Sparkles, BookOpen, Layers, Target, MousePointer2, AlertCircle } from 'lucide-react';

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
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Visnly v2.0 is Live</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.05]">
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 pb-2">
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
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
              </span>
            </button>
            <Link to="/how-it-works" className="px-8 py-4 rounded-full font-medium text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
              See how it works
            </Link>
          </div>
        </motion.div>

        {/* Improved Floating UI Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 relative w-full max-w-5xl perspective-1000"
        >
          <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden group ring-1 ring-white/5">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-50" />
            
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2a2a2a] border border-white/10" />
                <div className="w-3 h-3 rounded-full bg-[#2a2a2a] border border-white/10" />
                <div className="w-3 h-3 rounded-full bg-[#2a2a2a] border border-white/10" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-wide">Live Transcript Active</span>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-[450px]">
              {/* Left Column: Transcript */}
              <div className="md:col-span-8 p-6 flex flex-col gap-4 border-r border-white/5 relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A] z-10 pointer-events-none h-full" />
                 
                 {/* Chat Bubbles */}
                 <div className="flex flex-col gap-6 opacity-40 blur-[0.5px]">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-mono text-gray-500">AI</div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                        <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                      </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-6 mt-auto z-20">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-white" fill="currentColor" />
                      </div>
                      <div className="p-4 rounded-2xl rounded-tl-none bg-[#151515] border border-white/10 shadow-xl max-w-lg">
                        <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                          <Sparkles size={12} /> Explanation
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          The professor is describing <span className="text-white font-medium">Bernoulli's Principle</span>. 
                          Remember: as speed increases, pressure decreases. This is why airplanes fly.
                        </p>
                      </div>
                    </div>
                    
                    {/* Input Area */}
                    <div className="mt-4 relative">
                      <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 text-gray-500 text-sm">
                        Ask a follow-up question...
                      </div>
                      <div className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 rounded-lg flex items-center justify-center">
                        <ArrowRight size={16} className="text-white" />
                      </div>
                    </div>
                 </div>
              </div>

              {/* Right Column: Context Tools */}
              <div className="md:col-span-4 bg-[#0F0F0F] p-6 flex flex-col gap-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Analysis Tools</div>
                
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 mb-1">
                    <Brain size={16} className="text-indigo-400" />
                    <span className="font-medium text-sm text-gray-200">Key Concepts</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">Extract definitions & terms</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3 mb-1">
                    <Target size={16} className="text-emerald-400" />
                    <span className="font-medium text-sm text-gray-200">Test Radar</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-7">Flag exam-likely topics</p>
                </div>

                <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-300 uppercase">Live Confidence</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  </div>
                  <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mb-2">
                    <div className="h-full w-[92%] bg-indigo-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>ACCURACY</span>
                    <span>98.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Section 1: Analysis */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs mb-6 tracking-widest uppercase">
                <Sparkles size={14} />
                <span>Phase 1: Intelligence</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Turn Lectures into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Instant Knowledge.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed font-light">
                Stop frantically typing. Visnly listens to your lecture and watches your screen to extract what actually matters, filtering out the noise.
              </p>
              <ul className="space-y-6">
                {[
                  "Key Concepts & Definition Extraction",
                  "Automatic Bullet-Point Notes",
                  "End-of-Lecture Recaps & Study Guides"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-gray-300">
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl -z-10" />
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="flex gap-5 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <BookOpen size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">One-Click Study Guide</h3>
                    <p className="text-sm text-gray-500">Generated 2m ago • Calculus I</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
                    <div className="text-[10px] text-indigo-400 font-bold mb-2 tracking-wider">KEY CONCEPT</div>
                    <div className="text-sm text-gray-300 leading-relaxed">The Chain Rule applies when differentiating composite functions.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
                    <div className="text-[10px] text-emerald-400 font-bold mb-2 tracking-wider">FORMULA</div>
                    <div className="text-sm font-mono text-gray-300">d/dx [f(g(x))] = f'(g(x)) * g'(x)</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 2: Interaction */}
      <section className="py-32 px-4 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center md:grid-flow-col-dense">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="md:col-start-2"
            >
              <div className="flex items-center gap-2 text-purple-400 font-mono text-xs mb-6 tracking-widest uppercase">
                <MousePointer2 size={14} />
                <span>Phase 2: Interaction</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Don't Just Watch. <br />
                <span className="text-white">Interact.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed font-light">
                Confused? Just click. Visnly makes every line of your lecture transcript interactive, giving you instant clarity.
              </p>
              <ul className="space-y-6">
                {[
                  "Tap-to-Explain: Instant clarity on any sentence",
                  "Context Tools: \"What did they mean by that?\"",
                  "Adapt to Your Style: Explanations in simple terms or analogies"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-gray-300">
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative md:col-start-1"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-purple-500/10 to-pink-500/10 blur-3xl -z-10" />
              <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 relative overflow-hidden h-[400px]">
                <div className="absolute top-1/2 right-10 w-12 h-12 bg-white/10 rounded-full animate-ping duration-[3s]" />
                <div className="absolute top-1/2 right-10 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black z-20 cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-transform hover:scale-110">
                  <MousePointer2 size={20} fill="currentColor" />
                </div>
                
                <div className="space-y-6 opacity-30 blur-[2px]">
                  <div className="h-4 bg-white/20 rounded w-3/4" />
                  <div className="h-4 bg-white/20 rounded w-full" />
                  <div className="h-4 bg-white/20 rounded w-5/6" />
                  <div className="h-4 bg-white/20 rounded w-4/5" />
                </div>
                
                <div className="absolute bottom-8 left-8 right-8 p-5 bg-[#1A1A1A]/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl z-30 transform transition-all hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                      <Zap size={12} fill="currentColor" /> AI Explanation
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono">12:42 PM</div>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    The professor is referring to <span className="text-white font-semibold">entropy</span>. Imagine a messy room—it takes work to clean it (order), but it gets messy naturally (disorder).
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section 3: Detection */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 text-red-400 font-mono text-xs mb-6 tracking-widest uppercase">
                <AlertCircle size={14} />
                <span>Phase 3: Detection</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Know What Matters <br />
                <span className="text-white">Before the Exam.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed font-light">
                Visnly's AI stays alert even when you zone out. It flags critical moments and "test-worthy" material automatically.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors group">
                  <Target className="text-red-400 mb-3 group-hover:scale-110 transition-transform" size={24} strokeWidth={1.5} />
                  <h4 className="font-bold mb-1 text-white">Test Radar</h4>
                  <p className="text-xs text-gray-500">Flags "this will be on the exam" moments instantly.</p>
                </div>
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-colors group">
                  <div className="text-yellow-400 mb-3 font-bold text-xl group-hover:scale-110 transition-transform">?</div>
                  <h4 className="font-bold mb-1 text-white">Confusion Alerts</h4>
                  <p className="text-xs text-gray-500">Identifies complex topics that need extra review.</p>
                </div>
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors group">
                  <Layers className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={24} strokeWidth={1.5} />
                  <h4 className="font-bold mb-1 text-white">Auto-Timestamps</h4>
                  <p className="text-xs text-gray-500">Marks new topics, examples, and definitions.</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative h-[450px]"
            >
              {/* Abstract Timeline Visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-white/20 to-transparent relative">
                  {[0.2, 0.45, 0.75].map((top, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.3, type: "spring" }}
                      className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[#050505] z-10"
                      style={{ 
                        top: `${top * 100}%`,
                        backgroundColor: i === 1 ? '#ec4899' : i === 2 ? '#eab308' : '#6366f1',
                        boxShadow: `0 0 10px ${i === 1 ? '#ec4899' : i === 2 ? '#eab308' : '#6366f1'}`
                      }}
                    >
                      <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        whileInView={{ x: 30, opacity: 1 }}
                        transition={{ delay: i * 0.3 + 0.2 }}
                        className={`absolute top-1/2 -translate-y-1/2 left-0 w-56 p-4 rounded-xl border backdrop-blur-md ${
                        i === 1 ? 'bg-pink-500/10 border-pink-500/20' : 
                        i === 2 ? 'bg-yellow-500/10 border-yellow-500/20' : 
                        'bg-indigo-500/10 border-indigo-500/20'
                      }`}>
                        <div className={`text-[10px] font-bold mb-1 tracking-wider uppercase ${
                          i === 1 ? 'text-pink-400' : i === 2 ? 'text-yellow-400' : 'text-indigo-400'
                        }`}>
                          {i === 1 ? 'TEST ALERT' : i === 2 ? 'CONFUSION DETECTED' : 'NEW TOPIC'}
                        </div>
                        <div className="text-xs text-gray-300 font-light leading-relaxed">
                          {i === 1 ? 'Prof: "You WILL see this on the final."' : 
                           i === 2 ? 'Complex explanation detected. 3 students asked questions.' : 'Topic: Introduction to Derivatives'}
                        </div>
                      </motion.div>
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
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent -z-10" />
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
              className="group relative px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
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
              <span className="flex items-center gap-3">
                {isDownloading ? 'Starting Download...' : 'Get Visnly for Windows'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
              </span>
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
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-medium">
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

