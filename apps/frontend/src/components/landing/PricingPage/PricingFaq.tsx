import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface FaqItem {
  q: string;
  a: string;
}

interface PricingFaqProps {
  items: FaqItem[];
}

export default function PricingFaq({ items }: PricingFaqProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-16 max-w-2xl mx-auto text-center"
    >
      <h2 className="text-xl font-bold text-white mb-3">Frequently Asked Questions</h2>
      <div className="space-y-4 text-left mt-6">
        {items.map(({ q, a }) => (
          <div key={q} className="bg-[#11110a] border border-[#262413] rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-1">{q}</div>
            <div className="text-xs text-[#8a886a]">{a}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-[#6a6c5d] mt-6">
        More questions?{' '}
        <Link to="/contact" className="text-yellow-500 hover:text-yellow-400 font-semibold">Contact our team</Link>
        {' '}— we respond within 1–2 business days.
      </p>
    </motion.div>
  );
}
