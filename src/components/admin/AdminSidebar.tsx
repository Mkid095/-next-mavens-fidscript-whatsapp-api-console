import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, LogOut } from 'lucide-react';
import { adminNavItems } from './adminNavItems';

interface Props {
  sidebarOpen: boolean;
  currentUser: { email: string; role: 'admin' | 'client'; name: string } | null;
  handleLogout: () => void;
  currentTab: string;
  activeUnreadInboxes: number;
}

export function AdminSidebar({ sidebarOpen, currentUser, handleLogout, currentTab, activeUnreadInboxes }: Props) {
  const initial = currentUser?.name?.charAt(0).toUpperCase() ?? '?';
  return (
    <aside className={`fixed inset-y-0 left-0 md:relative md:translate-x-0 z-40 md:z-20 h-screen flex flex-col justify-between transition-all duration-300 shrink-0 border-r border-[#262413] bg-[#12110c] ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'}`}>
      <div className="flex-1 overflow-y-auto space-y-4 pt-4 pb-4">
        <div className="px-4 py-2 flex items-center gap-2">
          <img src="/logo.png" alt="FIDScript" className={sidebarOpen ? 'h-7' : 'h-6 mx-auto'} />
          {sidebarOpen && <div className="flex flex-col"><span className="font-bold text-[14px] text-white leading-none">FIDSCRIPT WHATSAPP</span><span className="text-[9px] text-yellow-500">by Next Mavens</span></div>}
        </div>
        <div className="px-2.5">
          <Link to="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[13px] text-[#a8a594] hover:text-white transition-colors"><Globe className="w-4 h-4" />{sidebarOpen && <span>Home</span>}</Link>
        </div>
        {sidebarOpen && <div className="px-4 pt-2"><span className="text-[10px] uppercase font-bold tracking-widest text-[#8e8555]">Navigation</span></div>}
        <nav className="px-2.5 space-y-1">
          {adminNavItems.map((item) => {
            const isSelected = currentTab === item.name;
            const Icon = item.icon;
            return (
              <Link key={item.name} to={item.path} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-[13px] transition-colors ${isSelected ? 'text-white font-semibold bg-[#1b1a11] border border-[#33301a]' : 'text-[#a8a594] hover:text-white'}`}>
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-yellow-400' : ''}`} />
                {sidebarOpen && <span>{item.name}</span>}
                {sidebarOpen && item.name === 'Inbox' && activeUnreadInboxes > 0 && <span className="ml-auto bg-yellow-500 text-stone-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{activeUnreadInboxes}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-[#262413]">
        {sidebarOpen ? (
          <div className="p-2.5 bg-[#1a1910] rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-white font-bold text-xs">{initial}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{currentUser.name}</p><p className="text-[10px] text-yellow-500">Admin</p></div>
            <button onClick={handleLogout} className="text-[#b0ae9f] hover:text-white p-1"><LogOut className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-300 font-bold text-xs">{initial}</div>
            <button onClick={handleLogout} className="p-1 text-red-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    </aside>
  );
}
