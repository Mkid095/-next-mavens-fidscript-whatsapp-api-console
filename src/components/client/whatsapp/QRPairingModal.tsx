import React, { useState, useEffect } from 'react';
import { X, QrCode, RefreshCw, Info, AlertCircle, Wifi, WifiOff, Smartphone } from 'lucide-react';
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

const QR_TTL_SECONDS = 60;
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const QR_SIZE = 208; // px — matches SVG viewBox 100 scaled to ~208px

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

  useEffect(() => {
    if (!qrCode) return;
    overlayLogoOnQR(qrCode).then(setQrWithLogo).catch(() => setQrWithLogo(qrCode));
  }, [qrCode]);

  useEffect(() => {
    if (qrCode) setSecondsLeft(QR_TTL_SECONDS);
  }, [qrCode]);

  useEffect(() => {
    if (!qrCode || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { onRegenerate(); return QR_TTL_SECONDS; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [qrCode, secondsLeft, onRegenerate]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - secondsLeft / QR_TTL_SECONDS);
  const formattedTime = `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`;
  const isLoading = generatingQR || regeneratingQR;
  const isExpired = secondsLeft <= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1915] border border-[#2d2813] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2813]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#a8a99e]">Scan QR Code</h3>
              <code className="text-[10px] text-[#6e684a] font-mono">{instance.name}</code>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* QR code area — centered, fixed size */}
          <div className="flex flex-col items-center gap-3">
            {/* Ring + QR container */}
            <div className="relative" style={{ width: QR_SIZE, height: QR_SIZE }}>
              {/* Countdown ring — SVG coordinate space 100×100, scaled to QR_SIZE */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: QR_SIZE, height: QR_SIZE }}
                viewBox="0 0 100 100"
              >
                {/* Track */}
                <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#2d2813" strokeWidth="5.5" />
                {/* Progress */}
                {qrCode && !isLoading && (
                  <circle
                    cx="50" cy="50" r={RADIUS} fill="none"
                    stroke={isExpired ? '#ef4444' : '#eab308'}
                    strokeWidth="5.5" strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      transition: 'stroke-dashoffset 0.95s linear, stroke 0.3s ease',
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50px 50px',
                    }}
                  />
                )}
              </svg>

              {/* QR or placeholder */}
              {isLoading ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#2d2813] bg-[#1a1915]"
                >
                  <span className="w-7 h-7 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                  <span className="text-[10px] text-[#6e684a] font-semibold">
                    {regeneratingQR ? 'Getting new QR…' : 'Generating…'}
                  </span>
                </div>
              ) : qrWithLogo ? (
                <div className="absolute inset-0 rounded-2xl overflow-hidden border border-[#2d2813]">
                  <img
                    src={qrWithLogo}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#2d2813] bg-[#1a1915] px-4">
                  {connectionError ? (
                    <>
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <p className="text-[10px] text-red-400 font-bold leading-tight text-center">{connectionError}</p>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-8 h-8 text-[#3d3a1e]" />
                      <p className="text-[10px] text-[#6e684a] text-center leading-tight">QR not available</p>
                    </>
                  )}
                </div>
              )}

              {/* Time badge */}
              {qrCode && !isLoading && (
                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap"
                  style={{
                    background: isExpired ? '#450a0a' : '#1c1917',
                    borderColor: isExpired ? '#7f1d1d' : '#2d2813',
                    color: isExpired ? '#fca5a5' : '#a8a99e',
                  }}
                >
                  {formattedTime}
                </div>
              )}
            </div>
          </div>

          {/* Connection status pill */}
          <div className="flex items-center justify-center">
            {instance.status === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-green-900/30 text-green-400 border border-green-800/40">
                <Wifi className="w-3 h-3" /> Connected
              </span>
            ) : instance.status === 'connecting' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-yellow-900/30 text-yellow-500 border border-yellow-700/40 animate-pulse">
                <RefreshCw className="w-3 h-3" /> Connecting…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-900/30 text-red-400 border border-red-800/40">
                <WifiOff className="w-3 h-3" /> Disconnected
              </span>
            )}
          </div>

          {/* Error alert — only when no QR */}
          {!qrCode && connectionError && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] text-red-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {connectionError}
              </p>
              <p className="text-[10px] text-red-400/70">Try regenerating or check your WhatsApp number.</p>
            </div>
          )}

          {/* How to scan */}
          {qrCode && !isLoading && (
            <div className="bg-[#2d2813]/50 border border-[#3d3a1e] rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] text-[#a8a99e] font-bold flex items-center gap-1.5">
                <Info className="w-3 h-3 text-[#6e684a]" />
                How to scan
              </p>
              <ol className="text-[10px] text-[#6e684a] space-y-0.5 list-decimal list-inside pl-2">
                <li>Open WhatsApp on your phone</li>
                <li>Tap <strong className="text-[#a8a99e]">⋮ Menu</strong> → <strong className="text-[#a8a99e]">Linked Devices</strong></li>
                <li>Tap <strong className="text-[#a8a99e]">Link a Device</strong></li>
                <li>Point your phone at the QR code</li>
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {qrCode && !isLoading && (
              <button
                onClick={onRegenerate}
                disabled={regeneratingQR}
                className="w-full py-2 bg-[#2d2813] hover:bg-[#3d3a1e] disabled:opacity-50 text-[#a8a99e] font-bold text-[10px] rounded-xl border border-[#3d3a1e] transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${regeneratingQR ? 'animate-spin' : ''}`} />
                {regeneratingQR ? 'Getting new QR…' : 'Regenerate QR'}
              </button>
            )}

            {(!qrCode || connectionError) && !isLoading && (
              <button
                onClick={onRegenerate}
                className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingQR ? 'animate-spin' : ''}`} />
                {regeneratingQR ? 'Retrying…' : 'Try Again'}
              </button>
            )}

            <button
              onClick={onCheckConnection}
              className="w-full py-2 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#a8a99e] font-bold text-[10px] rounded-xl border border-[#3d3a1e] transition-all"
            >
              Check Connection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
