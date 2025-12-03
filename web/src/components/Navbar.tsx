import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X as XIcon, User } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../lib/supabase';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
      <div className="flex items-center justify-between w-full max-w-6xl gap-4 md:gap-6 px-4 md:px-6 py-3 rounded-full backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <Logo size={24} showText={false} />
          <span className="font-bold text-lg tracking-tight">Visnly</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300 flex-shrink-0">
          <Link to="/features" className="hover:text-white transition-colors whitespace-nowrap">Features</Link>
          <Link to="/how-it-works" className="hover:text-white transition-colors whitespace-nowrap">How it works</Link>
          <Link to="/pricing" className="hover:text-white transition-colors whitespace-nowrap">Pricing</Link>
          <Link to="/faq" className="hover:text-white transition-colors whitespace-nowrap">FAQ</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {user ? (
            <Link
              to="/account"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-all"
            >
              <User className="w-4 h-4" />
              Account
            </Link>
          ) : (
            <Link
              to="/signin"
              className="text-xs font-semibold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors cta-pill"
            >
              Sign In
            </Link>
          )}
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
              <Link to="/features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 border-b border-white/5">Features</Link>
              <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 border-b border-white/5">How It Works</Link>
              <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2 border-b border-white/5">Pricing</Link>
              <Link to="/faq" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-2">FAQ</Link>
              {user ? (
                <Link
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 w-full text-center text-sm font-semibold bg-white text-black px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors cta-pill"
                >
                  Account
                </Link>
              ) : (
                <Link
                  to="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-2 w-full text-center text-sm font-semibold bg-white text-black px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors cta-pill"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </nav>
  );
};

