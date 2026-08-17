import React from 'react';
import { motion } from 'motion/react';
import { stats } from './stats-data';

export default function StatsSection() {
  return (
    <section className="py-12 md:py-16 bg-[#f8f8f8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#e5e5e5] rounded-2xl overflow-hidden">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-white p-6 md:p-8 text-center"
            >
              <div
                className="text-3xl md:text-4xl font-bold text-[#1a1a1a] leading-none mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-[#1a1a1a] mb-1">{stat.label}</div>
              <div className="text-xs text-[#525252]">{stat.sublabel}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
