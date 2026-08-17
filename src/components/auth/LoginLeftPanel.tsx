/**
 * LoginLeftPanel.tsx — desktop marketing panel shown left of the auth form.
 *
 * Sized to fit 100vh without scrolling. Renders: brand eyebrow, editorial
 * headline, lead paragraph, feature list, and a customer testimonial.
 * Decorative gradient orbs add visual interest without imagery.
 */
import React from 'react';
import {
  Smartphone, MessageSquare, CreditCard,
  Gift, Shield, CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  { icon: Smartphone, text: 'QR-code WhatsApp pairing in seconds' },
  { icon: MessageSquare, text: 'Send text, media, polls & more via REST API' },
  { icon: CreditCard, text: 'KSh 100 for 1,000 tokens — no monthly fees' },
  { icon: Gift, text: '500 free welcome tokens on signup' },
  { icon: Shield, text: 'M-Pesa STK Push — M-Pesa-only billing' },
  { icon: CheckCircle2, text: 'Tokens never expire — no time limits' },
];

export default function LoginLeftPanel() {
  return (
    <aside className="hidden lg:flex flex-col w-[460px] xl:w-[500px] shrink-0 border-r border-[#e5e5e5] px-8 xl:px-10 py-6 bg-gradient-to-br from-[#fff7ed] via-[#fffbf6] to-white relative overflow-hidden min-h-0">
      <div className="absolute -top-32 -right-24 w-[420px] h-[420px] bg-[#f97316] opacity-[0.08] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-24 w-[420px] h-[420px] bg-[#fb923c] opacity-[0.06] rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col h-full min-h-0">
        <div className="inline-flex items-center gap-2 self-start px-2.5 py-1 bg-white border border-[#fed7aa] rounded-full mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
          <span className="text-[9px] font-bold text-[#f97316] uppercase tracking-widest">FIDScript Platform</span>
        </div>

        <h2
          className="text-[clamp(24px,2.6vw,32px)] font-bold text-[#1a1a1a] leading-[1.05] tracking-[-1px] mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          The WhatsApp API built for{' '}
          <span className="text-[#f97316]">Kenyan businesses</span>
        </h2>

        <p className="text-[13px] text-[#525252] leading-relaxed mb-5 max-w-md">
          Send transactional messages, run marketing campaigns, and automate customer support — all from one developer-first API with M-Pesa billing built in.
        </p>

        <ul className="space-y-1.5 mb-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-2.5 px-2.5 py-1.5 bg-white border border-[#e5e5e5] rounded-lg"
            >
              <div className="w-6 h-6 rounded-md bg-[#fff7ed] flex items-center justify-center text-[#f97316] shrink-0">
                <Icon className="w-3 h-3" />
              </div>
              <span className="text-[12px] text-[#1a1a1a] font-medium">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-3 border-t border-[#e5e5e5]">
          <p className="text-[11px] text-[#1a1a1a] leading-snug font-medium">
            "FIDScript cut our customer notification costs by 70% — M-Pesa billing means no invoice chasing."
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-[#fff7ed] flex items-center justify-center text-[#f97316] font-bold text-[9px] shrink-0">
              JM
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#1a1a1a] truncate">Joyce Mwangi</p>
              <p className="text-[9px] text-[#a0a0a0] truncate">CTO, RetailSaaS Kenya</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}