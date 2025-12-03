import { motion } from 'framer-motion';

const universities = [
  {
    name: 'MIT',
    logo: (
      <div className="text-white font-bold text-3xl tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.5px' }}>
        MIT
      </div>
    ),
  },
  {
    name: 'Stanford',
    logo: (
      <div className="text-white font-semibold text-sm tracking-[0.15em] uppercase" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="leading-tight">STANFORD</div>
        <div className="text-[10px] font-normal tracking-[0.1em] mt-0.5 opacity-80">UNIVERSITY</div>
      </div>
    ),
  },
  {
    name: 'Harvard',
    logo: (
      <div className="text-white font-bold text-2xl italic" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        Harvard
      </div>
    ),
  },
  {
    name: 'UC Berkeley',
    logo: (
      <div className="text-white font-bold text-[11px] tracking-[0.12em] uppercase leading-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div>UNIVERSITY OF CALIFORNIA</div>
        <div className="text-base mt-1 tracking-normal">BERKELEY</div>
      </div>
    ),
  },
];

export const TrustedBy = () => {
  return (
    <section className="py-12 md:py-16 border-y border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-xs text-gray-500 mb-6 md:mb-10 font-mono uppercase tracking-widest">Trusted by 10,000+ Students</p>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 md:gap-20 opacity-50 hover:opacity-70 transition-opacity">
          {universities.map((uni, i) => (
            <motion.div
              key={uni.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="hover:opacity-100 transition-all duration-300 cursor-default"
            >
              {uni.logo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
