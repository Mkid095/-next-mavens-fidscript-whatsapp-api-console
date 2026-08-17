/**
 * ConfidenceBadge - colored confidence level indicator.
 * Shared between ConversationInspector and TestStep.
 */
import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number; // 0–1
  className?: string;
}

export default function ConfidenceBadge({ confidence, className = '' }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  const colorClass =
    confidence >= 0.8 ? 'bg-green-900/40 text-green-400 border-green-900/50'
    : confidence >= 0.5 ? 'bg-yellow-900/40 text-yellow-400 border-yellow-900/50'
    : 'bg-red-900/40 text-red-400 border-red-900/50';

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold border rounded-full ${colorClass} ${className}`}>
      {pct}%
    </span>
  );
}
