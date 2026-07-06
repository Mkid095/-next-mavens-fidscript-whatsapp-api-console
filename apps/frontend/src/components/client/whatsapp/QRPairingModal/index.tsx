import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../../services/api';
import { overlayLogoOnQR } from '../../../../utils/qrLogo';
import { QRPairingForm } from './QRPairingForm';

const QR_TTL_SECONDS = 300; // 5 minutes

export interface QRPairingModalProps {
  instance: Instance;
  qrCode: string;
  generatingQR: boolean;
  regeneratingQR: boolean;
  connectionError: string;
  onClose: () => void;
  onCheckConnection: () => void;
  onRegenerate: () => void;
}

export default function QRPairingModal({
  instance,
  qrCode,
  generatingQR,
  regeneratingQR,
  connectionError,
  onClose,
  onCheckConnection,
  onRegenerate,
}: QRPairingModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(QR_TTL_SECONDS);
  const [qrWithLogo, setQrWithLogo] = useState('');

  // Apply logo overlay whenever QR code changes
  useEffect(() => {
    if (!qrCode) return;
    overlayLogoOnQR(qrCode).then(setQrWithLogo).catch(() => setQrWithLogo(qrCode));
  }, [qrCode]);

  // Reset and start countdown whenever a new QR arrives
  useEffect(() => {
    if (qrCode) {
      setSecondsLeft(QR_TTL_SECONDS);
    }
  }, [qrCode]);

  // Countdown tick
  useEffect(() => {
    if (!qrCode || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          onRegenerate();
          return QR_TTL_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [qrCode, secondsLeft, onRegenerate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h4 className="font-bold text-xs uppercase tracking-widest">Pair container</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-bold text-left">
          Container: <code className="font-mono text-yellow-800 bg-yellow-50 px-1.5 py-0.5 rounded">{instance.name}</code>
        </p>

        <QRPairingForm
          qrCode={qrCode}
          qrWithLogo={qrWithLogo}
          generatingQR={generatingQR}
          regeneratingQR={regeneratingQR}
          connectionError={connectionError}
          secondsLeft={secondsLeft}
          onRegenerate={onRegenerate}
        />

        <button
          onClick={onCheckConnection}
          className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold text-xs rounded-xl transition-all"
        >
          Check Connection Status
        </button>
      </motion.div>
    </div>
  );
}
