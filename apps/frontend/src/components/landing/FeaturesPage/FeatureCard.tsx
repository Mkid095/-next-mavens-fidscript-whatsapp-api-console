import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ReactNode } from 'lucide-react';

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  details: string[];
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

export default function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-[#11110a] border border-[#262413] rounded-2xl p-6 hover:border-[#3d3a1e] transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
          {feature.icon}
        </div>
        <div>
          <h3 className="text-white font-bold text-base mb-2">{feature.title}</h3>
          <p className="text-[#8a886a] text-sm mb-4 leading-relaxed">{feature.description}</p>
          <ul className="space-y-1.5">
            {feature.details.map(d => (
              <li key={d} className="flex items-center gap-2 text-xs text-[#6a6c5d]">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
