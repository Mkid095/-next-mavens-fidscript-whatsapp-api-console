import React from 'react';

const trustedBrands = ['Soostori.co.ke', 'Power-Logistic.com', 'SwaySuite.com', 'NearSkool.com'];

export default function TestimonialsSection() {
  return (
    <section className="py-12 border-y border-[#262413] bg-[#12110c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-[#85826f] uppercase tracking-widest mb-8">
          Trusted by Kenyan businesses
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
          {trustedBrands.map((brand) => (
            <span key={brand} className="text-sm md:text-base font-semibold text-[#6a6c5d]">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
