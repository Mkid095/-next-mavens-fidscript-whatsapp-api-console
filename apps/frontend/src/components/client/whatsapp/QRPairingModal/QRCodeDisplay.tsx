import React from 'react';

const QR_TTL_SECONDS = 300; // 5 minutes
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface QRCodeDisplayProps {
  qrWithLogo: string;
  qrCode: string;
  generatingQR: boolean;
  regeneratingQR: boolean;
  secondsLeft: number;
}

export function QRCodeDisplay({
  qrWithLogo,
  qrCode,
  generatingQR,
  regeneratingQR,
  secondsLeft,
}: QRCodeDisplayProps) {
  const strokeDashoffset = CIRCUMFERENCE * (1 - secondsLeft / QR_TTL_SECONDS);

  return (
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
          {`${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`}
        </div>
      )}
    </div>
  );
}
