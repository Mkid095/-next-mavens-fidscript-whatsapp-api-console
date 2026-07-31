import React from 'react';
import { motion } from 'motion/react';

interface UseCase {
  title: string;
  description: string;
  image: string;
}

interface UseCasesSectionProps {
  useCases: UseCase[];
}

export default function UseCasesSection({ useCases }: UseCasesSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-[clamp(48px,6vw,74px)] font-bold text-[#1a1a1a] leading-[110%] tracking-[-2px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Built for <span className="text-[#eab308]">every industry</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`group relative overflow-hidden rounded-[28px] ${
                idx === 0 ? 'md:row-span-2' : ''
              }`}
            >
              <img
                src={useCase.image}
                alt={useCase.title}
                className="w-full h-full object-cover"
                style={{ minHeight: idx === 0 ? '400px' : '240px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{useCase.title}</h3>
                <p className="text-sm text-white/75">{useCase.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
