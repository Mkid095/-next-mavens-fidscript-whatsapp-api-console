import React from 'react';

export function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold">
        <span className="text-yellow-500">{icon}</span> {label}
      </div>
      <div className="text-2xl font-black text-[#cbd3cf] mt-1">{value}</div>
    </div>
  );
}

export function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-[#cbd3cf] flex items-center gap-1.5 mb-3">
        <span className="text-yellow-500">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-[#6a6c5d] italic py-3 text-center">{text}</p>;
}

export function truncate(s: string | null, n: number): string {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}
