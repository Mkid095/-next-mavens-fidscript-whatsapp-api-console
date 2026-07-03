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
        active
          ? 'bg-yellow-500 text-[#181711] shadow-sm'
          : 'text-[#6e684a] hover:text-[#a8a99e]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}