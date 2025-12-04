import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { LiquidBackground } from '../components/LiquidBackground';
import { SEO } from '../components/SEO';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How does the 'Undetectable' overlay work?",
    answer: "Visnly's overlay is drawn directly to the GPU buffer rather than the standard operating system composition layer. This means screen capture software (like Zoom, Teams, Discord, OBS, and proctoring tools) literally cannot see it. To them, it's invisible."
  },
  {
    question: "Does it work with lockdown browsers?",
    answer: "Yes. Visnly is a completely external overlay. Since it doesn't hook into the browser process or modify web pages, it remains undetected by browser-level checks. However, always use at your own discretion."
  },
  {
    question: "What is 'Phase 3' Detection?",
    answer: "Phase 3 features include Test-Worthy Detection (flags exam material), Confusion Alerts (identifies complex topics), and Auto-Timestamps. It uses advanced AI to analyze the professor's speech patterns and emphasis."
  },
  {
    question: "How does the Real-Time OCR work?",
    answer: "Visnly captures your screen content 60 times per second and uses lightweight local processing to extract text. This text is then sent to our AI models along with your audio transcript for context-aware answers."
  },
  {
    question: "Can I use it on Mac?",
    answer: "Visnly is currently Windows-only due to the specific GPU-level access required for the undetectable overlay. A Mac version is in development but does not have an ETA yet."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Every new account gets 25 free credits to test all features, including the premium AI models. No credit card required to start."
  },
  {
    question: "What if the professor has a thick accent?",
    answer: "Our transcription engine is powered by OpenAI's Whisper model, which is industry-leading for handling accents, fast speech, and technical jargon. It adapts remarkably well to various speaking styles."
  }
];

export const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="relative min-h-screen text-white font-sans" style={{ backgroundColor: '#050505' }}>
      <SEO
        title="FAQ - Visnly | Common Questions"
        description="Answers to your questions about Visnly's undetectable overlay, AI features, and compatibility."
        keywords="visnly faq, undetectable overlay, proctoring software, exam help, ai tutor"
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
            <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">Support</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
            Frequently Asked <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/60">Questions.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            Everything you need to know about how Visnly keeps you ahead.
          </p>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-colors"
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full text-left p-6 flex items-start justify-between gap-4 group"
                >
                  <h3 className="text-base font-medium text-white/90 group-hover:text-white transition-colors flex-1 pr-4">
                    {faq.question}
                  </h3>
                  <div className={`p-1 rounded-full bg-white/5 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180 bg-white/10 text-white/60' : 'text-gray-400'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-sm text-gray-400 leading-relaxed px-6 pb-6 pt-0 border-t border-white/5 mt-2">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16 p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10"
          >
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-gray-400 mb-6">We're here to help you get set up.</p>
            <a
              href="mailto:support@visnly.com"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
            >
              Contact Support
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

