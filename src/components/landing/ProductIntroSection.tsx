import React from 'react';

export default function ProductIntroSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-2">
            <h2
              className="text-[36px] font-semibold text-[#1a1a1a] leading-[120%] tracking-[-1px]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              The WhatsApp API built for{' '}
              <span className="text-[#eab308]">Kenyan businesses</span>
            </h2>
          </div>
          <div className="md:col-span-3">
            <p className="text-[20px] text-[#1a1a1a]/75 leading-[150%]">
              FIDScript gives your business a powerful WhatsApp integration without the
              complexity. Send notifications, automate responses, and reach customers directly
              where they already are — on WhatsApp. With transparent per-message pricing and
              M-Pesa token billing, you pay only for what you use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
