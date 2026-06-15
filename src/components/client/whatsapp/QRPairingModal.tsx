import React, { useState, useEffect } from 'react';
import { X, QrCode, RefreshCw, Info } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';
import { overlayLogoOnQR } from '../../../utils/qrLogo';

interface QRPairingModalProps {
  instance: Instance;
  qrCode: string;
  generatingQR: boolean;
  regeneratingQR: boolean;
  connectionError: string;
  onClose: () => void;
  onCheckConnection: () => void;
  onRegenerate: () => void;
}

const QR_TTL_SECONDS = 300; // 5 minutes

// SVG circle progress — r=44, circumference = 2π × 44 ≈ 276.46
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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

  const strokeDashoffset = CIRCUMFERENCE * (1 - secondsLeft / QR_TTL_SECONDS);
  const formattedTime = `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`;

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

        <div className="space-y-3">
          <p className="text-[11px] text-graphite text-left">
            Scan this QR code with your WhatsApp app to link your account.
          </p>

          {/* QR with countdown ring */}
          <div className="relative inline-block mx-auto">
            {/* SVG countdown ring — positioned behind the QR */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 100 100"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track circle */}
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="50" cy="50"
                r={RADIUS}
                fill="none"
                stroke={secondsLeft <= 10 ? '#ef4444' : '#eab308'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.3s ease' }}
              />
            </svg>

            {/* QR + spinner overlay */}
            <div className="w-52 h-52 flex items-center justify-center rounded-2xl bg-stone-50 border border-[#eaebe4] relative overflow-hidden">
              {generatingQR || regeneratingQR ? (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                  <span className="w-8 h-8 border-[3px] border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-stone-500 font-semibold">
                    {regeneratingQR ? 'Getting new QR...' : 'Generating...'}
                  </span>
                </div>
              ) : qrWithLogo ? (
                <img src={qrWithLogo} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-stone-400 text-xs">No QR code</div>
              )}
            </div>

            {/* Time badge overlaid bottom-center of the QR box */}
            {qrCode && !generatingQR && !regeneratingQR && (
              <div
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border"
                style={{
                  background: secondsLeft <= 10 ? '#fef2f2' : '#fffbeb',
                  borderColor: secondsLeft <= 10 ? '#fecaca' : '#fde68a',
                  color: secondsLeft <= 10 ? '#dc2626' : '#92400e',
                }}
              >
                {formattedTime}
              </div>
            )}
          </div>

          {/* Regenerate button */}
          <button
            onClick={onRegenerate}
            disabled={generatingQR || regeneratingQR || !qrCode}
            className="w-full py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed text-stone-600 hover:text-stone-800 font-bold text-[10px] rounded-xl border border-stone-200 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${regeneratingQR ? 'animate-spin' : ''}`} />
            {regeneratingQR ? 'Getting new QR...' : 'Regenerate QR'}
          </button>

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
              <li>4. Point your phone at the QR code</li>
            </ol>
          </div>

          <button
            onClick={onCheckConnection}
            className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold text-xs rounded-xl transition-all"
          >
            Check Connection Status
          </button>
        </div>
      </motion.div>
    </div>
  );
}
