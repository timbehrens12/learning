import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, CreditCard, Download, Loader2, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { LiquidBackground } from '../components/LiquidBackground';

export const AccountPage = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate('/signin');
      return;
    }

    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/signin');
        return;
      }

      setUser(session.user);
      loadCredits(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/signin');
      } else {
        setUser(session.user);
        loadCredits(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCredits = async (userId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading credits:', error);
        setCredits(0);
      } else {
        setCredits(data?.credits_remaining || 0);
      }
    } catch (err) {
      console.error('Error:', err);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
        <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
        <LiquidBackground />
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
      <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
      <LiquidBackground />
      <Navbar />
      <div className="min-h-screen px-4 py-12 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-white">Account</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

        {/* Account Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <p className="text-white font-medium">{user?.user_metadata?.full_name || user?.user_metadata?.name || 'Not set'}</p>
            </div>
          </div>
        </motion.div>

        {/* Credits Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Credits</h2>
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Buy Credits
            </button>
          </div>

          <div className="text-center py-8">
            <div className="text-6xl font-bold text-white mb-2">
              {credits !== null ? credits : '...'}
            </div>
            <p className="text-gray-400">Credits Remaining</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-left"
            >
              <CreditCard className="w-5 h-5" />
              <div>
                <div className="font-semibold">Buy Credits</div>
                <div className="text-sm text-gray-400">Purchase more credits</div>
              </div>
            </button>

            <button
              onClick={() => window.open('https://github.com/yourusername/study-layer/releases/latest/download/StudyLayer-Setup.exe', '_blank')}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-left"
            >
              <Download className="w-5 h-5" />
              <div>
                <div className="font-semibold">Download App</div>
                <div className="text-sm text-gray-400">Get the desktop app</div>
              </div>
            </button>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

