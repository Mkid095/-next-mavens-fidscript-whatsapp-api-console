import React from 'react';

export default function ProductIntroSection() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-2">
            <h2
              className="text-[clamp(22px,2.5vw,32px)] font-semibold text-[#1a1a1a] leading-[120%]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              The WhatsApp API built for{' '}
              <span className="text-[#f97316]">Kenyan businesses</span>
            </h2>
          </div>
          <div className="md:col-span-3">
            <p className="text-base text-[#525252] leading-relaxed">
              FIDScript gives your business a powerful WhatsApp integration without the
              complexity. Send notifications, automate responses, and reach customers directly
              where they already are - on WhatsApp. With transparent per-message pricing and
              M-Pesa token billing, you pay only for what you use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
