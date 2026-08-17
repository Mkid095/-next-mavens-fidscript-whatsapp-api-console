import React from 'react';
import { motion } from 'motion/react';
import { useCases } from './useCases-data';

export default function UseCasesSection() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2
            className="text-[clamp(24px,3vw,40px)] font-bold text-[#1a1a1a] leading-[120%] tracking-[-1px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Built for <span className="text-[#f97316]">every industry</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {useCases.map((useCase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer"
            >
              <img
                src={useCase.image}
                alt={useCase.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-sm font-semibold text-white leading-tight">{useCase.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
