/**
 * Overlays a centered circular logo onto a QR code data URL.
 * Call with the raw base64 or data URI from Evolution API, returns a new data URI.
 */
export async function overlayLogoOnQR(
  qrDataUrl: string,
  logoUrl: string = '/logo.png'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      const canvas = document.createElement('canvas');
      const size = qrImg.width;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(qrImg, 0, 0, size, size);

      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoSize = Math.round(size * 0.18); // logo is 18% of QR size
        const cx = size / 2;
        const cy = size / 2;
        const r = logoSize / 2;

        // Circular clip — draw white circle first as background
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Clip to circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // Draw logo scaled to fit
        ctx.drawImage(logoImg, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.onerror = () => {
        // Logo failed to load — return QR without overlay
        resolve(qrDataUrl);
      };
      logoImg.src = logoUrl;
    };
    qrImg.onerror = () => reject(new Error('Failed to load QR image'));
    qrImg.src = qrDataUrl;
  });
}