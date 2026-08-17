import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { features, howItWorksSteps } from './features-data';

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <>
      <FeaturesGrid activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <HowItWorksSection />
    </>
  );
}

function FeaturesGrid({ activeFeature, setActiveFeature }: { activeFeature: number; setActiveFeature: (idx: number) => void }) {
  return (
    <section id="features" className="py-12 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2
            className="text-[clamp(24px,3vw,40px)] font-bold text-[#1a1a1a] leading-[120%] tracking-[-1px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Everything you need to <span className="text-[#f97316]">scale</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                onClick={() => setActiveFeature(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                  activeFeature === idx
                    ? 'bg-[#fb923c]/8 border-[#f97316]/30'
                    : 'bg-white border-[#e5e5e5] hover:border-[#d4d4d4]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeFeature === idx ? 'bg-[#f97316]/15' : 'bg-[#f5f5f5]'}`}>
                  <feature.icon className={`w-4 h-4 ${activeFeature === idx ? 'text-[#f97316]' : 'text-[#525252]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{feature.title}</p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${activeFeature === idx ? 'text-[#f97316] rotate-90' : 'text-[#a0a0a0]'}`} />
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-[#fafafa] rounded-2xl border border-[#e5e5e5] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e5e5e5]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5]" />
              </div>
              <span className="text-xs text-[#a0a0a0] font-mono">
                {features[activeFeature].title.toLowerCase().replace(/\s+/g, '-')}.js
              </span>
            </div>
            <pre className="p-4 text-xs font-mono text-[#1a1a1a] overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <code>{features[activeFeature].code}</code>
            </pre>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-12 md:py-20 bg-[#f8f8f8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2
            className="text-[clamp(24px,3vw,40px)] font-bold text-[#1a1a1a] leading-[120%] tracking-[-1px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Get started in <span className="text-[#f97316]">minutes</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {howItWorksSteps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="p-5 bg-white rounded-2xl border border-[#e5e5e5] text-center"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#fb923c]/10 mb-4">
                <item.icon className="w-5 h-5 text-[#f97316]" />
              </div>
              <p className="text-xs font-bold text-[#f97316] mb-2">{item.step}</p>
              <p className="text-sm font-semibold text-[#1a1a1a] mb-1">{item.title}</p>
              <p className="text-xs text-[#525252] leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
