import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { LiquidBackground } from '../components/LiquidBackground';
import { GlassCard } from '../components/GlassCard';
import { SEO } from '../components/SEO';
import { Brain, MousePointer2, AlertCircle, ArrowRight, Zap, BookOpen, Target, Layers, HelpCircle, FileText, Ghost } from 'lucide-react';

const newFeatures = [
  {
    category: "Phase 1: Intelligence",
    icon: <Brain className="w-5 h-5 text-white/60" />,
    items: [
      {
        title: "Key Concepts Extraction",
        desc: "Automatically pulls out the most important topics and definitions from lectures.",
        icon: <Zap className="w-5 h-5" />
      },
      {
        title: "One-Click Study Guide",
        desc: "Turns an entire lecture into a comprehensive study guide with formulas and takeaways.",
        icon: <BookOpen className="w-5 h-5" />
      },
      {
        title: "End-of-Lecture Recap",
        desc: "Instantly summarizes what was covered and suggests what to review next.",
        icon: <FileText className="w-5 h-5" />
      }
    ]
  },
  {
    category: "Phase 2: Interaction",
    icon: <MousePointer2 className="w-5 h-5 text-white/60" />,
    items: [
      {
        title: "Tap-to-Explain",
        desc: "Click any line in the transcript to get an instant, focused explanation.",
        icon: <MousePointer2 className="w-5 h-5" />
      },
      {
        title: "Context Tools",
        desc: "Ask \"What does the teacher mean here?\" or \"Give me context from before.\"",
        icon: <HelpCircle className="w-5 h-5" />
      },
      {
        title: "Adaptive Learning Styles",
        desc: "Rewrite notes in simpler terms, analogies, or step-by-step instructions.",
        icon: <Layers className="w-5 h-5" />
      }
    ]
  },
  {
    category: "Phase 3: Detection",
    icon: <AlertCircle className="w-5 h-5 text-red-400" />,
    items: [
      {
        title: "Test-Worthy Detection",
        desc: "Flags content when the professor says \"this will be on the exam.\"",
        icon: <Target className="w-5 h-5" />
      },
      {
        title: "Confusion Alerts",
        desc: "Identifies complex sections where the professor struggled or repeated themselves.",
        icon: <AlertCircle className="w-5 h-5" />
      },
      {
        title: "Auto-Timestamps",
        desc: "Automatically marks new topics, examples, and definitions in the timeline.",
        icon: <Layers className="w-5 h-5" />
      }
    ]
  }
];

export const FeaturesPage = () => {
  return (
    <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
      <SEO
        title="Features - Visnly | Intelligent AI Study Companion"
        description="Explore Visnly's advanced features: Real-time lecture analysis, Tap-to-Explain interaction, and smart Test-Worthy detection. The ultimate study advantage."
        keywords="ai study features, lecture analysis, tap to explain, study guide generator, undetectable overlay"
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
            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Visnly 2.0 Features</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
            Intelligence. Interaction. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/60">Detection.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            Visnly isn't just an answer bot. It's a complete intelligent layer that sits on top of your education,
            turning passive lectures into active knowledge.
          </p>
        </motion.div>
      </section>

      {/* Core Stealth Features (Legacy but important) */}
      <section className="py-24 border-y border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Foundation</h2>
            <p className="text-gray-400">Built on our proprietary undetectable technology.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/60 mb-4">
                <Ghost size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Ghost Mode Overlay</h3>
              <p className="text-gray-400 leading-relaxed">
                Draws directly to the GPU buffer, making it completely invisible to screen sharing and proctoring software.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <ArrowRight size={24} className="-rotate-45" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time OCR</h3>
              <p className="text-gray-400 leading-relaxed">
                Reads your screen 60 times per second. No need to type questions manually—Visnly sees what you see.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Grid */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto space-y-24">
          {newFeatures.map((section, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-200">{section.category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {section.items.map((feature, j) => (
                  <GlassCard 
                    key={j} 
                    className="p-6 group hover:border-white/20 transition-all duration-300"
                  >
                    <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 group-hover:text-white/60 group-hover:scale-110 transition-all mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

