import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';

interface QRPairingModalProps {
  instance: Instance;
  mode: 'qr' | 'code';
  qrCode: string;
  linkCode: string;
  generatingQR: boolean;
  connectionError: string;
  onClose: () => void;
  onCheckConnection: () => void;
}

export default function QRPairingModal({
  instance,
  mode,
  qrCode,
  linkCode,
  generatingQR,
  connectionError,
  onClose,
  onCheckConnection,
}: QRPairingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h4 className="font-bold text-xs uppercase tracking-widest">Connect WhatsApp</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs font-bold">Container: <code className="font-mono text-yellow-800 bg-yellow-50 px-1.5 py-0.5 rounded">{instance.name}</code></p>

        {mode === 'qr' ? (
          <div className="space-y-3">
            <p className="text-[11px] text-graphite">Scan this QR code with your WhatsApp app to link your account.</p>
            <div className="w-44 h-44 border border-[#eaebe4] rounded-2xl bg-stone-50 mx-auto flex items-center justify-center p-4">
              {generatingQR ? (
                <div className="space-y-2 text-center text-[10px] text-graphite font-bold">
                  <span className="block w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <span>Generating QR...</span>
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="QR Code" className="w-full h-full" />
              ) : (
                <div className="text-center text-stone-400 text-xs">No QR code available</div>
              )}
            </div>
            {connectionError && <p className="text-[10px] text-red-600 font-semibold">{connectionError}</p>}
            <button onClick={onCheckConnection} className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold text-xs rounded-xl">
              Check Connection Status
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-graphite">Enter this code in your WhatsApp app to link your account.</p>
            {linkCode ? (
              <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4">
                <p className="text-[9px] text-stone-500 uppercase font-bold mb-2">Your Link Code</p>
                <p className="text-2xl font-black font-mono text-forest-deep tracking-widest">{linkCode}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[10px] text-stone-500">Requesting link code...</p>
              </div>
            )}
            <div className="text-[10px] text-stone-500 text-left">
              <p>1. Open WhatsApp on your phone</p>
              <p>2. Tap Menu → Linked Devices</p>
              <p>3. Tap "Link a Device" and enter the code above</p>
            </div>
            <button onClick={onCheckConnection} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl">
              Check Connection Status
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
