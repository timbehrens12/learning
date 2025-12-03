import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { motion } from 'framer-motion';
import { LiquidBackground } from './components/LiquidBackground';
import { HeroMockup } from './components/HeroMockup';
import { HowItWorks } from './components/HowItWorks';
import { FeatureBento } from './components/FeatureBento';
import { TrustedBy } from './components/TrustedBy';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { Logo } from './components/Logo';
import { DownloadModal } from './components/DownloadModal';
import { SuccessPage } from './components/SuccessPage';
import { Menu, X as XIcon, ArrowRight } from 'lucide-react';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle OAuth callback directly in App.tsx if hash contains access_token
  useEffect(() => {
    console.log('App.tsx useEffect running');
    console.log('Current hash:', window.location.hash);
    console.log('Current URL:', window.location.href);
    console.log('Supabase available:', !!supabase);
    
    const hash = window.location.hash;
    if (hash && hash.includes('access_token') && supabase) {
      console.log('=== OAuth callback detected ===');
      console.log('Full hash:', hash.substring(0, 100) + '...');
      
      // Process the OAuth callback immediately
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('Session result:', { hasSession: !!session, error });
        
        if (session) {
          console.log('User signed in via OAuth:', session.user.email);
          // Clean up the hash and redirect
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', newUrl);
          
          // Redirect to pricing if that's where they were going
          if (hash.includes('pricing') || window.location.pathname === '/') {
            console.log('Redirecting to pricing...');
            window.location.href = '/#pricing';
          } else {
            // Just reload to show signed in state
            window.location.reload();
          }
        } else if (error) {
          console.error('Session error:', error);
        } else {
          console.log('No session found, retrying...');
          // Retry after a delay
          if (supabase) {
            setTimeout(() => {
              if (!supabase) return;
              supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
                if (retrySession) {
                  console.log('Session found on retry');
                  window.location.href = '/#pricing';
                } else {
                  console.error('Still no session after retry');
                }
              });
            }, 1000);
          }
        }
      });
    } else {
      console.log('No OAuth callback detected');
    }
  }, []);

  // Check if we're on the success page (payment only now, not auth)
  const isSuccessPage = window.location.pathname === '/success' || 
    window.location.pathname.includes('/success') ||
    window.location.search.includes('success=true');

  // Show success page if on success route
  if (isSuccessPage) {
    return (
      <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
        <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
        <LiquidBackground />
        <SuccessPage />
      </div>
    );
  }

  return (
    <div 
      className="relative min-h-screen text-white font-sans overflow-x-hidden" 
      style={{ 
        backgroundColor: '#050505',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {/* Smoother, more subtle background */}
      <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
      <LiquidBackground />

      {/* Navbar - Updated for cleaner look */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
        <div className="flex items-center justify-between w-full max-w-6xl gap-4 md:gap-8 px-4 md:px-6 py-3 rounded-full backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl">
           <a href="#" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
             <Logo size={24} showText={false} />
             <span className="font-bold text-lg tracking-tight">Visnly</span>
           </a>
           <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
             <a href="#features" className="hover:text-white transition-colors">Features</a>
             <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
             <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
             <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
           </div>
           
           <div className="hidden md:block">
             <button 
               onClick={() => setIsModalOpen(true)}
               className="text-xs font-semibold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cta-pill"
             >
               Start for Free
             </button>
           </div>

           {/* Mobile Menu Button */}
           <button
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
             aria-label="Menu"
           >
             {isMobileMenuOpen ? (
               <XIcon className="w-4 h-4 text-white" />
             ) : (
               <Menu className="w-4 h-4 text-white" />
             )}
           </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 top-20"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="md:hidden fixed top-20 left-4 right-4 z-50 rounded-2xl backdrop-blur-xl bg-[#0A0A0A] border border-white/10 shadow-2xl p-6"
            >
              <div className="flex flex-col gap-4">
                <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 border-b border-white/5">Features</a>
                <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 border-b border-white/5">How It Works</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 border-b border-white/5">Pricing</a>
                <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2">FAQ</a>
                <button 
                   onClick={() => {
                     setIsMobileMenuOpen(false);
                     setIsModalOpen(true);
                   }}
                   className="mt-2 w-full text-center text-sm font-semibold bg-white text-black px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors cta-pill"
                 >
                   Start for Free
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </nav>

      {/* Cluely-Inspired Hero Section */}
      <section className="pt-36 md:pt-48 pb-12 md:pb-20 px-4 text-center relative z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto flex flex-col items-center relative"
        >
          {/* Decorative blur behind title */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/20 blur-[100px] -z-10" />

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1] px-2 text-white">
            The #1 AI assistant <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-cyan-300">invisible</span> for students.
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-normal px-4">
            Reads your screen in real time, provides instant answers, takes perfect notes, and stays completely undetectable—even during screen sharing.
            Use it for real studying, staying on top of classes, or as a silent backup when you decide to cheat on exams.
          </p>
          
          {/* Get for Windows Button - Centered */}
          <div className="btn-wrapper mb-16">
            <button className="btn" tabIndex={0} onClick={() => setIsModalOpen(true)}>
              <svg className="btn-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 3.449L9.75 2.1v9.451H0V3.449zm10.949-1.606L24 0v11.551H10.949V1.843zm-10.949 11.4h9.75V21.9L0 20.551V13.243zm10.949 0H24V24L10.949 22.157V13.243z" fill="currentColor"/>
              </svg>
              <span className="btn-text">Get for Windows</span>
            </button>
          </div>
          
          {/* Hero Mockup */}
          <div className="mt-8 relative w-full max-w-5xl px-2 sm:px-4">
            {/* Glow effect behind the mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] bg-indigo-500/10 blur-[100px] -z-10 rounded-full" />
            <HeroMockup />
          </div>

        </motion.div>
      </section>

      {/* Trusted By */}
      <TrustedBy />

      {/* Feature Highlights - Cluely Style */}
      <section className="py-24 bg-black/20 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Four ways we make you <br/> <span className="text-indigo-400">unstoppable</span>.</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Feature 1 */}
                <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                        <ArrowRight size={24} className="-rotate-45" />
                    </div>
                    <h3 className="text-2xl font-bold">AI that answers questions, real-time</h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Visnly uses the screen, text, and visual context to answer questions for you, live. No typing required.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                     <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 9l3 3-3 3"/><path d="M12 6L2 12l10 6"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold">Undetectable Overlay</h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Completely invisible to screen sharing and proctoring software. It draws directly to the GPU buffer.
                    </p>
                </div>

                 {/* Feature 3 */}
                 <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                     <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold">Instant Explanations</h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                       Don't just get the answer—understand the 'why'. Detailed breakdowns for every solution.
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="flex flex-col gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                     <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold">Automated Note Taking</h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Save every question and answer automatically. Build a study guide while you work.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* How It Works - "3 Steps" */}
      <HowItWorks />

      {/* Feature Grid (Bento) */}
      <FeatureBento />

      {/* Pricing */}
      <Pricing />

      {/* FAQ */}
      <FAQ />

      {/* Study or Never Study Again CTA Section */}
      <section className="py-20 md:py-32 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 tracking-tight px-4"
          >
            Study or <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Never Study Again.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-10 md:mb-14 max-w-2xl mx-auto leading-relaxed px-4"
          >
            The choice is yours. Visnly adapts to how you learn—whether you’re putting in real study hours or using it as an invisible edge during school exams.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="btn-wrapper">
              <button 
                className="btn" 
                tabIndex={0} 
                onMouseDown={() => setIsDownloading(true)}
                onMouseUp={() => setIsDownloading(false)}
                onMouseLeave={() => setIsDownloading(false)}
                onClick={() => setIsModalOpen(true)}
              >
                <svg className="btn-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 3.449L9.75 2.1v9.451H0V3.449zm10.949-1.606L24 0v11.551H10.949V1.843zm-10.949 11.4h9.75V21.9L0 20.551V13.243zm10.949 0H24V24L10.949 22.157V13.243z" fill="currentColor"/>
                </svg>
                <span className="btn-text">{isDownloading ? 'Downloading' : 'Get for Windows'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 border-t border-white/5 relative z-10 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Logo size={24} />
                <div className="font-bold text-xl tracking-tight">Visnly</div>
              </div>
              <p className="text-sm text-gray-400">The invisible second brain for students.</p>
            </div>
            
            {/* Social Media Links - circular icon buttons with btn-like press style */}
            <div className="flex items-center gap-4 sm:gap-5 flex-wrap justify-center md:justify-start">
              <a 
                href="#" 
                className="icon-btn group"
                aria-label="Twitter / X"
              >
                <svg className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="icon-btn group"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="icon-btn group"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Row */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-sm text-gray-500 mb-8 sm:mb-12">
            <a href="#" className="hover:text-white transition-colors px-2">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors px-2">Terms of Service</a>
            <a href="#pricing" className="hover:text-white transition-colors px-2">Pricing</a>
            <a href="mailto:support@visnly.com" className="hover:text-white transition-colors px-2">Contact</a>
            <a href="mailto:support@visnly.com" className="hover:text-white transition-colors px-2">Support</a>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-white/5 pt-6 sm:pt-8">
            <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed px-2">
              <span className="text-gray-400 font-medium">Visnly is not affiliated with, endorsed by, or sponsored by Honorlock, Respondus, Proctorio, Canvas, Zoom, or any other trademarks mentioned on the site.</span> All trademarks are the property of their respective owners. Visnly is designed to support both traditional studying methods and provide instant assistance when needed. <span className="text-white">You can still study the correct way—Visnly enhances your learning experience for both purposes.</span>
            </p>
            <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
              © 2025 Visnly Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Download Modal */}
      <DownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App;
