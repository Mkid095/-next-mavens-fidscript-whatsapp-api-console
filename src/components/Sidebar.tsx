import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import SidebarNav from './shared/SidebarNav';
import { useCommandK } from '../features/search/index.js';
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
  const { openPalette } = useCommandK();

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col bg-[#13120d] border-r border-[#2d2813] transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {/* Header with logo + collapse toggle */}
        <div className="p-3 border-b border-[#2d2813] flex items-center justify-between gap-2">
          {/* Logo */}
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img src="/logo.png" alt="FidScript" className="w-8 h-8 object-contain shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-white leading-tight">FidScript</h1>
                <p className="text-[9px] text-[#8f834a] leading-tight">Messaging gateway</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto">
              <img src="/logo.png" alt="FidScript" className="w-full h-full object-contain" />
            </div>
          )}
          {/* Collapse toggle button */}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="shrink-0 w-7 h-7 rounded-lg bg-[#1f1d0b] border border-[#2d2813] flex items-center justify-center text-[#6e684a] hover:text-white hover:border-[#eab308]/30 transition-all"
          >
            {collapsed
              ? <ChevronRight size={13} />
              : <ChevronLeft size={13} />
            }
          </button>
        </div>

        {/* Client name - below header, only when expanded */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-[#2d2813]">
            <p className="text-[10px] text-[#6e684a] truncate" title={clientName}>
              {clientName}
            </p>
          </div>
        )}

        {/* Global ⌘K search trigger */}
        <div className="px-3 py-2">
          {collapsed ? (
            <button
              onClick={openPalette}
              aria-label="Search (⌘K)"
              title="Search (⌘K)"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-[#2d2813] bg-[#1f1d0b] text-[#8f834a] transition hover:border-yellow-500/30 hover:text-white"
            >
              <Search size={14} />
            </button>
          ) : (
            <button
              onClick={openPalette}
              className="flex w-full items-center gap-2 rounded-xl border border-[#2d2813] bg-[#1f1d0b] px-3 py-2 text-xs text-[#8f834a] transition hover:border-yellow-500/30 hover:text-white"
            >
              <Search size={13} />
              <span>Search…</span>
              <kbd className="ml-auto rounded border border-[#2d2813] bg-[#13120d] px-1.5 py-0.5 text-[9px] text-[#6e684a]">⌘K</kbd>
            </button>
          )}
        </div>

        <SidebarNav activeSection={activeSection} collapsed={collapsed} />

        {/* Footer */}
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
            <div className="relative group">
              <div className="bg-[#1f1d0b] border border-yellow-500/10 rounded-xl p-2 text-center cursor-default">
                <p className="text-xs font-black text-yellow-400 font-mono">{tokenBalance.toLocaleString()}</p>
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1f1d0b] border border-[#2d2813] rounded-lg text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Token Balance
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
