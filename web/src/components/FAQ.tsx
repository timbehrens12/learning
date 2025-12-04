import { useState } from 'react';
import { motion } from 'framer-motion';
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
    answer: "Visnly uses advanced OCR technology to read text from your screen with high accuracy. Combined with DeepSeek's AI models, it provides reliable answers. Accuracy depends on screen quality and text clarity."
  },
  {
    question: "Will my data be stored or shared?",
    answer: "No. Visnly processes everything locally on your device. Your screen content and questions are sent directly to DeepSeek's API (which you control with your own API key). We don't store, log, or share any of your data."
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

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 px-4 relative z-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
            FAQ
          </h2>
        </motion.div>

        {/* FAQ Items */}
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
  );
};

