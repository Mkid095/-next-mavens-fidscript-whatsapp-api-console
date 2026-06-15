/**
 * Convert the blue-on-white QR from Evolution API to forest-deep brown,
 * then overlay a transparent logo in the center (white backing for contrast).
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

      // Iterate every pixel: if it's blue-ish (the QR modules), make it forest-deep brown
      // Evolution QR uses blue modules — detect via B > R and B > G
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Blue module: B is dominant, R is low (white bg has high R, blue modules have low R)
        if (b > r && b > g && b > 80 && r < 200) {
          data[i] = 20;     // R = 20  (forest-deep: #14130a)
          data[i + 1] = 19; // G = 19
          data[i + 2] = 10; // B = 10
        }
        // White/light background: leave as-is
      }

      ctx.putImageData(imageData, 0, 0);

      // Overlay transparent logo — larger and with a white backing rectangle
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoSize = Math.round(canvas.width * 0.22); // 22% of QR size — bigger
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // White backing rectangle so logo stands out against QR modules
        const padding = Math.round(logoSize * 0.12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
          cx - logoSize / 2 - padding,
          cy - logoSize / 2 - padding,
          logoSize + padding * 2,
          logoSize + padding * 2
        );

        // Draw logo as plain square on top
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
        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.src = logoUrl;
    };
    qrImg.onerror = () => reject(new Error('Failed to load QR image'));
    qrImg.src = qrDataUrl;
  });
}