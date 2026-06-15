import React from 'react';

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export default function TabBtn({ active, onClick, icon, label }: TabBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
        active ? 'bg-white text-forest-deep shadow-sm' : 'text-stone-500 hover:text-forest-deep'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
