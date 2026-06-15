import jsQR from 'jsqr';

/**
 * Transform a blue-on-white QR code data URL into a black-on-white QR,
 * then overlay a transparent PNG logo in the center.
 *
 * Pipeline:
 *   1. Decode QR from image pixels using jsQR
 *   2. Redraw QR modules as black squares on a fresh canvas
 *   3. Overlay the transparent logo centered on top (no background circle)
 */
export async function overlayLogoOnQR(
  qrDataUrl: string,
  logoUrl: string = '/logo.png'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = qrImg.width;
      canvas.height = qrImg.height;
      const ctx = canvas.getContext('2d')!;

      // Step 1: Draw the original QR (blue modules on white)
      ctx.drawImage(qrImg, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Step 2: Decode the QR
      const qr = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: 'dontInvert',
      });

      if (!qr) {
        // Fallback: return original if decode fails
        resolve(qrDataUrl);
        return;
      }

      // Step 3: Clear canvas to white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Step 4: Redraw QR modules as BLACK
      const moduleSize = Math.floor(canvas.width / qr.width);
      ctx.fillStyle = '#000000';
      for (let y = 0; y < qr.height; y++) {
        for (let x = 0; x < qr.width; x++) {
          if (qr.data[y * qr.width + x]) {
            ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
          }
        }
      }

      // Step 5: Overlay transparent logo (no background circle)
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoSize = Math.round(canvas.width * 0.18);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.onerror = () => {
        // Logo failed — return black QR without overlay
        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.src = logoUrl;
    };
    qrImg.onerror = () => reject(new Error('Failed to load QR image'));
    qrImg.src = qrDataUrl;
  });
}