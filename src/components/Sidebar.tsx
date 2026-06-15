import React from 'react';
import SidebarNav from './shared/SidebarNav';
import BottomNav from './shared/BottomNav';
import type { ClientSection } from './shared/SidebarNav';
export type { ClientSection };

interface SidebarProps {
  activeSection: ClientSection;
  collapsed: boolean;
  onToggleCollapse: () => void;
  clientName: string;
  tokenBalance: number;
  onLogout: () => void;
}

export default function Sidebar({
  activeSection,
  collapsed,
  onToggleCollapse,
  clientName,
  tokenBalance,
  onLogout,
}: SidebarProps) {
  return (
    <>
      <aside
        className={`hidden lg:flex flex-col bg-[#13120d] border-r border-[#2d2813] transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        <div className="p-4 border-b border-[#2d2813]">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="FidScript" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="text-sm font-bold text-white">FidScript</h1>
                  <p className="text-[9px] text-[#8f834a]">Messaging gateway</p>
                </div>
              </div>
              <p className="text-[10px] text-[#6e684a] mt-2 truncate">{clientName}</p>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto">
              <img src="/logo.png" alt="FidScript" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <SidebarNav activeSection={activeSection} collapsed={collapsed} />

        <div className="p-3 border-t border-[#2d2813]">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="bg-[#1f1d0b] border border-yellow-500/10 rounded-xl p-3 text-center">
                <p className="text-[9px] text-[#8f834a] font-bold uppercase tracking-wider">Token Balance</p>
                <p className="text-lg font-black text-yellow-400 font-mono">{tokenBalance.toLocaleString()}</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full py-2 text-[10px] font-bold text-[#6e684a] hover:text-white bg-[#1f1d0b] border border-[#2d2813] rounded-xl transition-all"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="bg-[#1f1d0b] border border-yellow-500/10 rounded-xl p-2 text-center">
              <p className="text-xs font-black text-yellow-400 font-mono">{tokenBalance}</p>
            </div>
          )}
        </div>
      </aside>

      <BottomNav
        activeMenuItem={activeSection}
        onMenuItemChange={() => {}}
        onLogout={onLogout}
      />
    </>
  );
}
