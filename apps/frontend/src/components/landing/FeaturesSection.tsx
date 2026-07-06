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
    <section id="features" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need to <span className="gradient-headline-text">scale</span>
          </h2>
          <p className="text-[#a8a594] max-w-2xl mx-auto">
            Powerful features designed for Kenyan businesses. From instant API access to real-time webhooks, we've got you covered.
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
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  activeFeature === idx
                    ? 'bg-[#1b1910] wastes-yellow-500/30'
                    : 'bg-[#12110c] border-[#262413] hover:border-[#383416]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${activeFeature === idx ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#1b1910] text-[#85826f]'}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-[#85826f]">{feature.description}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${activeFeature === idx ? 'text-yellow-500 rotate-90' : 'text-[#6a6c5d]'}`} />
                </div>
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#0b0a07] rounded-2xl border border-[#262413] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262413]">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#3d3520]" />
                <span className="w-3 h-3 rounded-full bg-[#3d3520]" />
                <span className="w-3 h-3 rounded-full bg-[#3d3520]" />
              </div>
              <span className="text-xs text-[#6a6c5d] font-mono ml-2">
                {features[activeFeature].title.toLowerCase().replace(/\s+/g, '-')}.js
              </span>
            </div>
            <pre className="p-5 text-sm font-mono text-[#cbd3cf] overflow-x-auto">
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
    <section className="py-16 md:py-24 bg-[#12110c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get started in <span className="gradient-headline-text">minutes</span>
          </h2>
          <p className="text-[#a8a594] max-w-2xl mx-auto">
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
              className="relative p-6 bg-[#11110a] rounded-2xl border border-[#262413]"
            >
              <div className="absolute -top-4 left-6 px-3 py-1 bg-yellow-500 text-stone-950 text-xs font-bold rounded-full">
                {item.step}
              </div>
              <div className="pt-2">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#85826f]">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
