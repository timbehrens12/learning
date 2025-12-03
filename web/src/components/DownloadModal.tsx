import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal = ({ isOpen, onClose }: DownloadModalProps) => {

  const handleDownload = () => {
    // TODO: Replace with actual download URL (GitHub releases, S3, etc.)
    const downloadUrl = 'https://github.com/yourusername/study-layer/releases/latest/download/StudyLayer-Setup.exe';
    window.open(downloadUrl, '_blank');
  };

  const handleGoogleSignUp = () => {
    // Redirect to Electron app download or open app with OAuth
    // For now, just download
    handleDownload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-8 border-white/10 relative">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white/80" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">
                    Get StudyLayer
                  </h2>
                  <p className="text-sm text-gray-400">
                    Download the app and start with 25 free credits
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full py-4 rounded-xl font-semibold text-base bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white mb-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Download className="w-5 h-5" />
                  Download for Windows
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500">OR</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Sign Up Option */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 text-center mb-4">
                    Sign up to sync your credits and access your account from any device
                  </p>
                  
                  <button
                    onClick={handleGoogleSignUp}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={() => window.open('#pricing', '_blank')}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <span>View Pricing</span>
                  </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-500 text-center mt-6">
                  By downloading, you agree to our Terms of Service and Privacy Policy
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

