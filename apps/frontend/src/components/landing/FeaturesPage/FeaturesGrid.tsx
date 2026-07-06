import React from 'react';
import FeatureCard, { Feature } from './FeatureCard';

interface FeaturesGridProps {
  features: Feature[];
}

export default function FeaturesGrid({ features }: FeaturesGridProps) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      {features.map((feature, idx) => (
        <FeatureCard key={feature.title} feature={feature} index={idx} />
      ))}
    </div>
  );
}
