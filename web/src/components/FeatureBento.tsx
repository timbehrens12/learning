import { GlassCard } from './GlassCard';
import { Ghost, Cpu, MousePointer2, EyeOff } from 'lucide-react';

const features = [
  {
    title: "Ghost Mode",
    desc: "Completely undetectable by Proctorio, Honorlock, and other screen monitoring tools. The overlay draws directly to the GPU buffer, bypassing standard capture methods.",
    icon: <Ghost className="w-6 h-6" />,
    colSpan: "md:col-span-2",
    bg: "bg-gradient-to-br from-sky-500/15 to-black/40",
    border: "border-sky-500/20"
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

export const FeatureBento = () => {
  return (
    <section id="features" className="py-24 md:py-32 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
            <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                Unfair Advantage. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-sky-200">Engineered for Stealth.</span>
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                The only study assistant built with proprietary "Anti-Proctor" technology at its core. 
                We don't just help you answer questions; we ensure you're never flagged while doing it.
                </p>
            </div>
            {/* <button className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium whitespace-nowrap text-white">
                View Technical Specs
            </button> */}
        </div>

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
                
                {/* Decorative Gradient Blob on Hover */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-sky-500/10 blur-[100px] group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};
