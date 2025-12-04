import { motion } from 'framer-motion';
import { Play, Command } from 'lucide-react';

export const HeroMockup = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1000">
      <motion.div
        initial={{ rotateX: 5, opacity: 0, y: 50 }}
        animate={{ rotateX: 0, opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden aspect-video group"
      >
        {/* Window Controls */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
        </div>

        {/* Main Content Placeholder */}
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-[#0f0f0f] to-black flex items-center justify-center overflow-hidden">
          
          {/* Background Mesh/Noise */}
          <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-sky-500/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />

          {/* Central "App" Interface simulation */}
          <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-lg">
             
             {/* The "Question & Answer" Card */}
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.5, duration: 0.5 }}
               className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-400" />
                
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-500/15 flex items-center justify-center text-sky-300">
                           <Command size={16} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">Visnly AI</div>
                            <div className="text-xs text-sky-200">Thinking...</div>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md">0.2s</span>
                </div>

                {/* Simulated Question */}
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/5">
                   <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Detected Question</div>
                   <div className="text-sm text-gray-200 font-medium">"Which of the following is a primary function of the mitochondria?"</div>
                </div>

                {/* Simulated Answer Loading/Result */}
                <div className="space-y-3">
                    <div className="h-20 bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-3 border border-white/5">
                       <div className="flex gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <div className="text-xs text-green-400 font-medium">Best Answer Found</div>
                       </div>
                       <div className="h-2 bg-white/20 rounded w-3/4 mb-2" />
                       <div className="h-2 bg-white/20 rounded w-1/2" />
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                       98% Match
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400">
                       Source: Verified
                    </div>
                </div>
             </motion.div>

             {/* Floating Action Button */}
             <motion.div
               whileHover={{ scale: 1.05 }}
               className="flex items-center gap-2 px-5 py-2.5 bg-sky-500/15 border border-sky-500/30 text-sky-200 rounded-full text-sm cursor-pointer hover:bg-sky-500/20 transition-colors"
             >
                <Play size={14} fill="currentColor" />
                <span className="font-medium">See it in action</span>
             </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};
