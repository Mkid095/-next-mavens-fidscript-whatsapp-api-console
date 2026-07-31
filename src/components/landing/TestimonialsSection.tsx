import React from 'react';
import { motion } from 'motion/react';
import { testimonials } from './featuresData';

export default function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2
            className="text-[clamp(48px,6vw,74px)] font-bold text-[#1a1a1a] leading-[110%] tracking-[-2px]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Trusted by <span className="text-[#eab308]">businesses</span>
          </h2>
          <p className="mt-6 text-[20px] text-[#1a1a1a]/75 leading-[150%] max-w-2xl mx-auto">
            Kenyan businesses rely on FIDScript to power their WhatsApp communication.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="p-6 bg-[#fafafa] rounded-[28px] border border-[#e5e5e5]"
            >
              <blockquote className="text-[20px] text-[#1a1a1a]/75 leading-[150%] mb-6" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#eab308]">{testimonial.author.charAt(0)}</span>
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
