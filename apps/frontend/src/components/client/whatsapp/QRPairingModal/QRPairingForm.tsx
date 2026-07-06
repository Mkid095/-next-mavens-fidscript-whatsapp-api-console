import React from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay';
import type { QRPairingModalProps } from './index';

const QR_TTL_SECONDS = 300; // 5 minutes

interface QRPairingFormProps extends Pick<QRPairingModalProps,
  | 'qrCode'
  | 'generatingQR'
  | 'regeneratingQR'
  | 'connectionError'
  | 'secondsLeft'
  | 'onRegenerate'
> {
  qrWithLogo: string;
}

export function QRPairingForm({
  qrCode,
  qrWithLogo,
  generatingQR,
  regeneratingQR,
  connectionError,
  secondsLeft,
  onRegenerate,
}: QRPairingFormProps) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-graphite text-left">
        Scan this QR code with your messaging app to link your account.
      </p>

      <QRCodeDisplay
        qrWithLogo={qrWithLogo}
        qrCode={qrCode}
        generatingQR={generatingQR}
        regeneratingQR={regeneratingQR}
        secondsLeft={secondsLeft}
      />

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
          <li>1. Open your messaging app on your phone</li>
          <li>2. Tap <strong>Menu → Linked Devices</strong></li>
          <li>3. Tap <strong>"Link a Device"</strong></li>
          <li>4. Point your phone at the QR code</li>
        </ol>
      </div>
    </div>
  );
}
