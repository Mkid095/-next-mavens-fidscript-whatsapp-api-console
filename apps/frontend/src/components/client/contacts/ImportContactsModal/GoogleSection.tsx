import React from 'react';
import { RefreshCw, Unlink, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { GoogleStatus, ImportResult } from './constants';

interface GoogleSectionProps {
  googleStatus: GoogleStatus | null;
  googleLoading: boolean;
  googleSyncing: boolean;
  googleError: string;
  googleResult: ImportResult | null;
  successMsg: string;
  onLink: () => void;
  onUnlink: () => void;
  onSync: () => void;
}

export function GoogleSection({
  googleStatus, googleLoading, googleSyncing, googleError,
  googleResult, successMsg, onLink, onUnlink, onSync,
}: GoogleSectionProps) {
  return (
    <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M44 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11.3c-.5 2.7-2 5-4.2 6.5v5.4h6.8c4-3.7 6.3-9.2 6.3-15.5z"/>
          <path fill="#34A853" d="M24 46c5.9 0 10.8-1.9 14.4-5.2l-6.8-5.4c-1.9 1.3-4.4 2.1-7.6 2.1-5.8 0-10.8-3.9-12.6-9.2H4.4v5.6C7.2 41.8 15.2 46 24 46z"/>
          <path fill="#FBBC05" d="M11.4 28.6C11.1 28 10.9 27.3 10.9 26.5s.2-1.5.5-2.1V18.8H4.4C3.3 20.9 2.6 23.2 2.6 25.5s.7 4.6 1.8 6.3l7-.2z"/>
          <path fill="#EA4335" d="M24 12.2c3.2 0 6 1.1 8.2 3.3l6.1-6.1C34.7 5.1 29.8 3 24 3 15.2 3 7.2 7.2 4.4 12.8l6.9 5.4c1.8-5.3 6.8-9.2 12.7-9.2z"/>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#a8a99e]">Google Contacts</p>
          <p className="text-[10px] text-[#6e684a]">Read-only access to your contacts.</p>
        </div>
      </div>

      {googleError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 rounded-xl text-[11px] text-red-400 border border-red-900/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {googleError}
        </div>
      )}

      {successMsg && !googleError && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 rounded-xl text-[11px] text-green-400 border border-green-900/50">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {successMsg}
        </div>
      )}

      {!googleStatus ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#6e684a] border-t-[#eab308] rounded-full animate-spin" />
          <span className="text-[10px] text-[#6e684a]">Checking Google link status…</span>
        </div>
      ) : googleStatus.linked ? (
        <div className="flex items-center gap-3">
          {googleStatus.picture ? (
            <img src={googleStatus.picture} alt="" className="w-9 h-9 rounded-full border-2 border-[#2d2813]" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#2d2813] flex items-center justify-center text-[#eab308] text-xs font-bold border-2 border-[#3d3a1e]">
              {(googleStatus.name || googleStatus.email || 'G')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#a8a99e] truncate">{googleStatus.name || 'Google Account'}</p>
            <p className="text-[10px] text-[#6e684a] truncate">{googleStatus.email}</p>
          </div>
          <button
            onClick={onSync}
            disabled={googleSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eab308] text-[#181711] text-[10px] font-bold rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${googleSyncing ? 'animate-spin' : ''}`} />
            {googleSyncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button onClick={onUnlink} className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-[#6e684a] hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20" title="Unlink Google">
            <Unlink className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={onLink}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
          >
            {googleLoading ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Connecting…</>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#fff" d="M24 9.5c3.5 0 6.4 1.2 8.3 3.6L38.4 7.6C35.6 4.2 30.2 2 24 2 15.2 2 7.2 6.2 4.4 11.8L10.4 17C12.6 11.3 18 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M44 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11.3c-.5 2.7-2 5-4.2 6.5v5.4h6.8c4-3.7 6.3-9.2 6.3-15.5z"/>
                  <path fill="#34A853" d="M24 46c5.9 0 10.8-1.9 14.4-5.2l-6.8-5.4c-1.9 1.3-4.4 2.1-7.6 2.1-5.8 0-10.8-3.9-12.6-9.2H4.4v5.6C7.2 41.8 15.2 46 24 46z"/>
                  <path fill="#FBBC05" d="M11.4 28.6C11.1 28 10.9 27.3 10.9 26.5s.2-1.5.5-2.1V18.8H4.4C3.3 20.9 2.6 23.2 2.6 25.5s.7 4.6 1.8 6.3l7-.2z"/>
                  <path fill="#EA4335" d="M24 12.2c3.2 0 6 1.1 8.2 3.3l6.1-6.1C34.7 5.1 29.8 3 24 3 15.2 3 7.2 7.2 4.4 12.8l6.9 5.4c1.8-5.3 6.8-9.2 12.7-9.2z"/>
                </svg>
                Link Google Account
              </>
            )}
          </button>
          <p className="text-[9px] text-[#5a554a] leading-relaxed text-center px-2">
            By linking, you grant FIDScript read-only access to your Google Contacts.
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#eab308] hover:underline ml-1">Privacy Policy</a>
          </p>
        </>
      )}
    </div>
  );
}
