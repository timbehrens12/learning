import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { LiquidBackground } from '../components/LiquidBackground';
import { GlassCard } from '../components/GlassCard';
import { SEO } from '../components/SEO';
import { Download, Brain, Zap, Target, BookOpen } from 'lucide-react';

const steps = [
  {
    id: '01',
    title: 'Install & Connect',
    description: 'Download the lightweight app. It runs silently in the background and connects to your audio output.',
    icon: <Download className="text-white" size={24} />,
  },
  {
    id: '02',
    title: 'Listen & Analyze',
    description: 'Visnly listens to your lecture in real-time and OCRs your screen to build a complete context.',
    icon: <Brain className="text-white" size={24} />,
  },
  {
    id: '03',
    title: 'Interact Instantly',
    description: 'Tap any confusing part for an explanation, or use the "Cheat" mode for instant answers.',
    icon: <Zap className="text-white" size={24} />,
  },
];

const features = [
  {
    title: "Lecture Mode",
    desc: "Auto-tags new topics and generates study guides.",
    icon: <BookOpen className="w-5 h-5" />,
    color: "indigo"
  },
  {
    title: "Study Mode",
    desc: "Interactive tutor that explains concepts step-by-step.",
    icon: <Brain className="w-5 h-5" />,
    color: "purple"
  },
  {
    title: "Detection Mode",
    desc: "Flags test-worthy material and confusing sections.",
    icon: <Target className="w-5 h-5" />,
    color: "pink"
  }
];

export const HowItWorksPage = () => {
  return (
    <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
      <SEO
        title="How It Works - Visnly | From Lecture to Mastery"
        description="See how Visnly transforms your study workflow: Install, Analyze, and Interact. The smartest way to master your classes."
        keywords="how visnly works, study workflow, ai tutor guide, lecture analysis tutorial"
      />
      <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(circle at 50% 0%, #1a1a2e 0%, #050505 60%)' }} />
      <LiquidBackground />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-36 md:pt-48 pb-12 md:pb-20 px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Workflow</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
            Zero Friction. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Maximum Intelligence.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            We designed Visnly to be the fastest way to get answers and understand complex topics without breaking your flow.
          </p>
        </motion.div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />

            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <GlassCard className="h-full p-6 md:p-8 hover:border-white/20 transition-colors bg-black/40">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 md:mb-6 backdrop-blur-md relative z-10">
                    {step.icon}
                  </div>
                  <div className="text-xs md:text-sm font-mono text-indigo-400 mb-2">STEP {step.id}</div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white">{step.title}</h3>
                  <p className="text-sm md:text-base text-gray-400 leading-relaxed">{step.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modes Section */}
      <section className="py-24 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Three Ways to Win</h2>
              <div className="space-y-6">
                {features.map((feature, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      feature.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
                      feature.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-pink-500/20 text-pink-400'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />
              <GlassCard className="relative p-8 border-white/10 bg-black/60 backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="ml-auto text-xs text-gray-500">Visnly Overlay</div>
                  </div>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <div className="text-xs text-indigo-400 font-bold mb-1">LECTURE DETECTED</div>
                    <div className="text-sm text-gray-300">Topic: Introduction to Quantum Mechanics</div>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs text-gray-400 font-bold">LIVE TRANSCRIPT</div>
                      <div className="text-[10px] text-green-400 animate-pulse">● Recording</div>
                    </div>
                    <div className="text-sm text-gray-300">"...and this is what we call the Heisenberg Uncertainty Principle..."</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

