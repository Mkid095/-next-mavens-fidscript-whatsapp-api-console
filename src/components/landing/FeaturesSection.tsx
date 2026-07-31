import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { features, howItWorksSteps } from './featuresData';

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
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-[clamp(48px,6vw,74px)] font-bold text-[#1a1a1a] leading-[110%] tracking-[-2px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Everything you need to <span className="text-[#eab308]">scale</span>
          </h2>
          <p className="mt-6 text-[20px] text-[#1a1a1a]/75 leading-[150%] max-w-2xl mx-auto">
            Powerful features designed for Kenyan businesses. From instant API access to real-time webhooks, we have got you covered.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                onClick={() => setActiveFeature(idx)}
                className={`w-full text-left p-5 rounded-[28px] border transition-all ${
                  activeFeature === idx
                    ? 'bg-[#facc15]/10 border-[#eab308]/30'
                    : 'bg-white border-[#e5e5e5] hover:border-[#d4d4d4]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${activeFeature === idx ? 'bg-[#eab308]/20 text-[#eab308]' : 'bg-[#f5f5f5] text-[#525252]'}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">{feature.title}</h3>
                    <p className="text-sm text-[#525252]">{feature.description}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${activeFeature === idx ? 'text-[#eab308] rotate-90' : 'text-[#a0a0a0]'}`} />
                </div>
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#fafafa] rounded-[28px] border border-[#e5e5e5] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e5e5e5]">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
                <span className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
                <span className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
              </div>
              <span className="text-xs text-[#a0a0a0] font-mono ml-2">
                {features[activeFeature].title.toLowerCase().replace(/\s+/g, '-')}.js
              </span>
            </div>
            <pre className="p-5 text-sm font-mono text-[#1a1a1a] overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
    <section className="py-16 md:py-24 bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-[clamp(48px,6vw,74px)] font-bold text-[#1a1a1a] leading-[110%] tracking-[-2px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Get started in <span className="text-[#eab308]">minutes</span>
          </h2>
          <p className="mt-6 text-[20px] text-[#1a1a1a]/75 leading-[150%] max-w-2xl mx-auto">
            No complex setup required. Connect your WhatsApp and start sending messages in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {howItWorksSteps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative p-6 bg-white rounded-[28px] border border-[#e5e5e5]"
            >
              <div className="absolute -top-4 left-6 px-3 py-1 bg-[#eab308] text-[#1a1a1a] text-xs font-bold rounded-full">
                {item.step}
              </div>
              <div className="pt-2">
                <div className="w-12 h-12 rounded-xl bg-[#facc15]/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#eab308]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-sm text-[#525252]">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
