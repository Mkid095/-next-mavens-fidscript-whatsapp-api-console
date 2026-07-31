import React from 'react';

interface TrustBrandsSectionProps {
  brands: string[];
}

export default function TrustBrandsSection({ brands }: TrustBrandsSectionProps) {
  return (
    <section className="py-12 border-y border-[#e5e5e5] bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-[#a0a0a0] uppercase tracking-widest mb-8">
          Trusted by Kenyan businesses
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {brands.map((brand) => (
            <span key={brand} className="text-sm md:text-base font-semibold text-[#a0a0a0]">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
