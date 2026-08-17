import React from 'react';
import { trustedBrands } from './brands-data';

export default function TrustBrandsSection() {
  const doubled = [...trustedBrands, ...trustedBrands];

  return (
    <section className="py-10 border-y border-[#e5e5e5] bg-white overflow-hidden">
      <p className="text-center text-xs text-[#a0a0a0] uppercase tracking-widest mb-6">
        Trusted by Kenyan businesses
      </p>
      <div className="relative">
        <div
          className="flex items-center gap-12 animate-marquee whitespace-nowrap"
          style={{ width: 'max-content' }}
        >
          {doubled.map((brand, idx) => (
            <span
              key={`${brand}-${idx}`}
              className="text-sm font-semibold text-[#a0a0a0] hover:text-[#f97316] transition-colors cursor-default"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
