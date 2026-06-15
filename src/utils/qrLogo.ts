/**
 * Convert the blue-on-white QR from Evolution API to forest-deep brown
 * (matching the modal's dark background), then overlay the transparent logo
 * in a recess of the same color so it blends in seamlessly.
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

      // Change blue QR modules to forest-deep brown (#14130a)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (b > r && b > g && b > 80 && r < 200) {
          data[i] = 20;     // #14130a
          data[i + 1] = 19;
          data[i + 2] = 10;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Overlay transparent logo — larger, in a recess of the same QR-module color
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoSize = Math.round(canvas.width * 0.22); // 22% — bigger
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Recess square in the same forest-deep color (same as QR modules)
        // This makes the logo look like it sits flush in the QR — no border, no contrast
        ctx.fillStyle = '#14130a';
        ctx.fillRect(
          cx - logoSize / 2,
          cy - logoSize / 2,
          logoSize,
          logoSize
        );

        // Draw logo on top, filling the recess
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