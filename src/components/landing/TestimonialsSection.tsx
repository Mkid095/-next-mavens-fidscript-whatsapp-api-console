import React from 'react';
import { motion } from 'motion/react';
import { testimonials } from './testimonials-data';

export default function TestimonialsSection() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2
            className="text-[clamp(24px,3vw,40px)] font-bold text-[#1a1a1a] leading-[120%] tracking-[-1px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Trusted by <span className="text-[#f97316]">businesses</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="p-5 bg-[#fafafa] rounded-2xl border border-[#e5e5e5]"
            >
              <p
                className="text-[15px] text-[#1a1a1a]/70 leading-relaxed mb-5"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
              >
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#fb923c]/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#f97316]">{testimonial.author.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a]">{testimonial.author}</div>
                  <div className="text-xs text-[#525252]">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
