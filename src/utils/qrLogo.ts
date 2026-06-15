/**
 * Convert the blue-on-white QR from Evolution API to forest-deep brown.
 * Simple approach: any pixel that isn't close to white → QR module → recolor.
 * Then cut a recess for the logo in the same color.
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

      ctx.drawImage(qrImg, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Replace any pixel that is not near-white with forest-deep brown (#14130a)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If pixel is not close to white (not R>200 and G>200 and B>200)
        if (!(r > 200 && g > 200 && b > 200)) {
          data[i] = 20;     // #14130a
          data[i + 1] = 19;
          data[i + 2] = 10;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Cut logo recess and overlay logo — same color as QR modules so it blends in
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const logoSize = Math.round(canvas.width * 0.22);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Recess in forest-deep — same color as QR modules
        ctx.fillStyle = '#14130a';
        ctx.fillRect(cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);

        // Logo fills the recess
        ctx.drawImage(logoImg, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);

        resolve(canvas.toDataURL('image/png'));
      };
      logoImg.onerror = () => resolve(canvas.toDataURL('image/png'));
      logoImg.src = logoUrl;
    };
    qrImg.onerror = () => reject(new Error('Failed to load QR image'));
    qrImg.src = qrDataUrl;
  });
}