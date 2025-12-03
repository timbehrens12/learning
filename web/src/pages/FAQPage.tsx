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
    question: "How does Visnly work?",
    answer: "Visnly is an invisible overlay that runs on your computer. It uses OCR (Optical Character Recognition) to read text from your screen and AI to provide instant answers. Press Ctrl+Shift+Space to summon or hide the overlay during any meeting or exam."
  },
  {
    question: "Is Visnly detectable by proctoring software?",
    answer: "Visnly is designed to be undetectable by most screen-sharing and proctoring software. However, with the Pro + Undetectability plan, Visnly becomes completely invisible to screen share during meetings. We recommend using this feature for maximum security."
  },
  {
    question: "What's the difference between Study, Solve, and Cheat modes?",
    answer: "Study mode provides detailed explanations to help you learn. Solve mode gives step-by-step solutions to problems. Cheat mode provides quick, direct answers without explanations. You can switch between modes instantly based on your needs."
  },
  {
    question: "Is there a free version?",
    answer: "Yes! Visnly offers a free tier with basic features including limited transcription and 5 questions per day. Upgrade to Pro for unlimited usage, access to newest AI models, and priority support."
  },
  {
    question: "Can I use Visnly on Mac or Linux?",
    answer: "Currently, Visnly is available for Windows. We're working on Mac and Linux versions and will announce them soon. Sign up for our newsletter to be notified when they're available."
  },
  {
    question: "How accurate is the OCR and AI?",
    answer: "Visnly uses advanced OCR technology to read text from your screen with high accuracy. Combined with GPT-4o-mini (or GPT-4 if you prefer), it provides reliable answers. Accuracy depends on screen quality and text clarity."
  },
  {
    question: "Will my data be stored or shared?",
    answer: "No. Visnly processes everything locally on your device. Your screen content and questions are sent directly to OpenAI's API (which you control with your own API key). We don't store, log, or share any of your data."
  },
  {
    question: "Can I use Visnly during online exams?",
    answer: "Visnly is designed to work during online meetings and exams. However, we recommend checking your institution's academic integrity policies. Visnly can be used as a study tool to help you learn, not just during exams."
  },
  {
    question: "What happens if I exceed my free tier limits?",
    answer: "If you reach your free tier limit (5 sessions), you'll need to upgrade to Pro for unlimited sessions. Your session history is saved, and you can continue where you left off after upgrading."
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
        title="FAQ - Visnly | Frequently Asked Questions"
        description="Get answers to common questions about Visnly: How it works, undetectability, pricing, compatibility, and more. Everything you need to know about the invisible study assistant."
        keywords="visnly faq, visnly questions, study assistant help, undetectable overlay, proctoring software, exam help"
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
            Frequently Asked <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Questions</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Visnly and how it works.
          </p>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-px">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5"
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full text-left py-5 flex items-start justify-between gap-4 group"
                >
                  <h3 className="text-base font-medium text-white/90 group-hover:text-white transition-colors flex-1">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-white/40 flex-shrink-0 mt-1 transition-all duration-200 ${
                      openIndex === index ? 'rotate-180 text-white/60' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    openIndex === index ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-sm text-white/60 leading-relaxed pr-8">
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
            className="text-center mt-12"
          >
            <a
              href="mailto:support@visnly.com"
              className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-4"
            >
              Contact support
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

