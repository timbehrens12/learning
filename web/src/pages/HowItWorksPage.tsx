import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { LiquidBackground } from '../components/LiquidBackground';
import { GlassCard } from '../components/GlassCard';
import { SEO } from '../components/SEO';
import { Download, Zap, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    id: '01',
    title: 'Install & Launch',
    description: 'Download the lightweight desktop app. No admin rights required. Runs silently in the background.',
    icon: <Download className="text-white" size={24} />,
  },
  {
    id: '02',
    title: 'Select Area',
    description: 'Drag the overlay frame over your exam question, Zoom meeting, or canvas. It stays on top but invisible to sharing.',
    icon: <Zap className="text-white" size={24} />,
  },
  {
    id: '03',
    title: 'Instant Answers',
    description: 'Visnly analyzes the text or visual context and displays the correct answer instantly within the overlay.',
    icon: <CheckCircle2 className="text-white" size={24} />,
  },
];

export const HowItWorksPage = () => {
  return (
    <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
      <SEO
        title="How It Works - Visnly | Get Started in 3 Simple Steps"
        description="Learn how Visnly works: Install the app, select your exam area, and get instant AI-powered answers. Zero friction, maximum intelligence for students."
        keywords="how visnly works, visnly tutorial, install visnly, study assistant guide, ai exam help"
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
            Zero Friction. <br/>
            <span className="text-gray-500">Maximum Intelligence.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            We designed Visnly to be the fastest way to get answers without leaving your workflow.
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
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 md:mb-6 backdrop-blur-md">
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
    </div>
  );
};

