import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
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

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16 md:text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            Zero Friction. <br/>
            <span className="text-gray-500">Maximum Intelligence.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400">
            We designed Visnly to be the fastest way to get answers without leaving your workflow.
          </p>
        </div>

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
                <div className="text-xs md:text-sm font-mono text-primary mb-2">STEP {step.id}</div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white">{step.title}</h3>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed">{step.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

