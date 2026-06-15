/**
 * Convert the blue-on-white QR from Evolution API to black-on-white,
 * then overlay a transparent logo square in the center (no circular clip, no padding).
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

      // Draw the original QR
      ctx.drawImage(qrImg, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Iterate every pixel: if it's blue-ish (the QR modules), make it black
      // Evolution QR uses blue modules — detect via high blue channel relative to red/green
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Blue module: B is dominant, R is low (blue = 0-120, R = 150-255 white background)
        if (b > r && b > g && b > 80 && r < 200) {
          data[i] = 0;     // R → 0 (black)
          data[i + 1] = 0; // G → 0
          data[i + 2] = 0; // B → 0
        }
        // White/light background: leave as-is
      }

      ctx.putImageData(imageData, 0, 0);

      // Overlay transparent logo as a square (no circular clip, no padding)
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoSize = Math.round(canvas.width * 0.16); // 16% of QR size
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.drawImage(
          logoImg,
          cx - logoSize / 2,
          cy - logoSize / 2,
          logoSize,
          logoSize
        );

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