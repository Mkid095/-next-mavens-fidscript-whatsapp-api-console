import React from 'react';
import { X, QrCode, Smartphone, Info } from 'lucide-react';
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
        className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h4 className="font-bold text-xs uppercase tracking-widest">Connect WhatsApp</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-bold text-left">
          Container: <code className="font-mono text-yellow-800 bg-yellow-50 px-1.5 py-0.5 rounded">{instance.name}</code>
        </p>

        {mode === 'qr' ? (
          <div className="space-y-3">
            <p className="text-[11px] text-graphite text-left">
              Scan this QR code with your WhatsApp app to link your account.
            </p>
            <div className="border border-[#eaebe4] rounded-2xl bg-stone-50 mx-auto p-5 flex items-center justify-center">
              {generatingQR ? (
                <div className="space-y-2 text-center text-[10px] text-graphite font-bold py-8">
                  <span className="block w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <span>Generating QR code...</span>
                </div>
              ) : qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-52 h-52 mx-auto"
                />
              ) : (
                <div className="text-center text-stone-400 text-xs py-8">No QR code available</div>
              )}
            </div>
            {connectionError && (
              <p className="text-[10px] text-red-600 font-semibold text-left">{connectionError}</p>
            )}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
              <p className="text-[10px] text-blue-700 font-bold mb-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                How to scan
              </p>
              <ol className="text-[10px] text-blue-600 space-y-0.5">
                <li>1. Open WhatsApp on your phone</li>
                <li>2. Tap <strong>Menu → Linked Devices</strong></li>
                <li>3. Tap <strong>"Link a Device"</strong></li>
                <li>4. Point your phone at the QR code above</li>
              </ol>
            </div>
            <button
              onClick={onCheckConnection}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold text-xs rounded-xl transition-all"
            >
              Check Connection Status
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
              <p className="text-[10px] text-amber-700 font-bold mb-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                About Link Code
              </p>
              <p className="text-[10px] text-amber-600 leading-relaxed">
                Link Code requires a <strong>WhatsApp Business API</strong> integration, which needs a Meta Business Account and access token. This container uses the standard WhatsApp Web (Baileys) integration, which only supports QR code scanning.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 py-2">
              <Smartphone className="w-10 h-10 text-stone-300" />
              <p className="text-xs text-stone-500">Use <strong>QR Code</strong> mode to connect this container</p>
            </div>

            {linkCode && linkCode !== 'CODE_REQUESTED' ? (
              <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4">
                <p className="text-[9px] text-stone-500 uppercase font-bold mb-2">Your Link Code</p>
                <p className="text-2xl font-black font-mono text-forest-deep tracking-widest">{linkCode}</p>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </div>
  );
}
