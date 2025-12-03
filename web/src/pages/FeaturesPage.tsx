import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { LiquidBackground } from '../components/LiquidBackground';
import { GlassCard } from '../components/GlassCard';
import { SEO } from '../components/SEO';
import { Ghost, Cpu, MousePointer2, EyeOff, ArrowRight } from 'lucide-react';

const features = [
  {
    title: "Ghost Mode",
    desc: "Completely undetectable by Proctorio, Honorlock, and other screen monitoring tools. The overlay draws directly to the GPU buffer, bypassing standard capture methods.",
    icon: <Ghost className="w-6 h-6" />,
    colSpan: "md:col-span-2",
    bg: "bg-gradient-to-br from-indigo-900/20 to-black/40",
    border: "border-indigo-500/20"
  },
  {
    title: "Auto-Capture",
    desc: "No need to type. Visnly OCRs your screen 60 times per second to keep context fresh.",
    icon: <Cpu className="w-6 h-6" />,
    colSpan: "md:col-span-1",
    bg: "bg-black/20",
    border: "border-white/5"
  },
  {
    title: "Click-Through Overlay",
    desc: "Interact with windows behind the overlay seamlessly. It's there when you need it, invisible when you don't.",
    icon: <MousePointer2 className="w-6 h-6" />,
    colSpan: "md:col-span-1",
    bg: "bg-black/20",
    border: "border-white/5"
  },
  {
    title: "Stealth Browser",
    desc: "Built-in isolated browser for verifying answers without triggering 'tab switch' flags or leaving your exam environment.",
    icon: <EyeOff className="w-6 h-6" />,
    colSpan: "md:col-span-2",
    bg: "bg-gradient-to-br from-blue-900/20 to-black/40",
    border: "border-blue-500/20"
  },
];

const featureHighlights = [
  {
    title: "AI that answers questions, real-time",
    desc: "Visnly uses the screen, text, and visual context to answer questions for you, live. No typing required.",
    icon: <ArrowRight size={24} className="-rotate-45" />,
    color: "blue"
  },
  {
    title: "Undetectable Overlay",
    desc: "Completely invisible to screen sharing and proctoring software. It draws directly to the GPU buffer.",
    color: "purple"
  },
  {
    title: "Instant Explanations",
    desc: "Don't just get the answer—understand the 'why'. Detailed breakdowns for every solution.",
    color: "green"
  },
  {
    title: "Automated Note Taking",
    desc: "Save every question and answer automatically. Build a study guide while you work.",
    color: "pink"
  },
];

export const FeaturesPage = () => {
  return (
    <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
      <SEO
        title="Features - Visnly | Undetectable AI Study Assistant"
        description="Discover Visnly's powerful features: Ghost Mode for undetectability, Auto-Capture OCR, Click-Through Overlay, and Stealth Browser. Built for students who need an invisible advantage."
        keywords="visnly features, undetectable study assistant, ghost mode, anti-proctor technology, screen overlay, stealth browser"
      />
      <div className="fixed inset-0 -z-20" style={{ background: 'radial-gradient(ellipse at top, #13131f 0%, #050505 50%, #050505 100%)' }} />
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
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
            Unfair Advantage. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Engineered for Stealth.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            The only study assistant built with proprietary "Anti-Proctor" technology at its core. 
            We don't just help you answer questions; we ensure you're never flagged while doing it.
          </p>
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24 bg-black/20 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Four ways we make you <br/> <span className="text-indigo-400">unstoppable</span>.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {featureHighlights.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 ${
                  feature.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  feature.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  feature.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  'bg-pink-500/20 text-pink-400'
                }`}>
                  {feature.icon || <div className="w-6 h-6" />}
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features Grid */}
      <section className="py-24 md:py-32 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <GlassCard 
                key={i} 
                className={`${feature.colSpan} ${feature.bg} p-8 group hover:border-white/20 transition-all duration-500 overflow-hidden relative border ${feature.border || 'border-white/5'}`}
              >
                <div className="relative z-10 h-full flex flex-col justify-between min-h-[200px]">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    {feature.icon}
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm md:text-base">{feature.desc}</p>
                  </div>
                </div>
                
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-[100px] group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

