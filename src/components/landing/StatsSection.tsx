import React from 'react';
import { motion } from 'motion/react';

interface Stat {
  value: string;
  label: string;
  sublabel: string;
}

interface StatsSectionProps {
  stats: Stat[];
}

export default function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`p-6 bg-white rounded-[28px] border border-[#e5e5e5] ${
                idx === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <div
                className={`font-bold text-[#1a1a1a] ${idx === 0 ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'}`}
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {stat.value}
              </div>
              <div className="mt-2 text-base font-semibold text-[#1a1a1a]">{stat.label}</div>
              <div className="mt-1 text-sm text-[#525252]">{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
