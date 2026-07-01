import { Jimp } from 'jimp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recolors the blue-on-white Evolution API QR to forest-deep (#14130a) and
 * overlays /logo.png in the center recess.
 * Returns a base64 PNG data URL.
 */
export async function overlayLogoOnQR(base64Qr: string): Promise<string> {
  // Load QR from base64 string (as returned by Evolution API)
  const qrBuffer = Buffer.from(base64Qr, 'base64');
  const qrImage = await Jimp.read(qrBuffer);

  // Recolor non-white pixels to #14130a
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qrImage.scan(0, 0, qrImage.width, qrImage.height, function (this: any, x: number, y: number, idx: number) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    // Not close to white → QR module → recolor
    if (!(r > 200 && g > 200 && b > 200)) {
      this.bitmap.data[idx] = 20;     // #14130a
      this.bitmap.data[idx + 1] = 19;
      this.bitmap.data[idx + 2] = 10;
    }
  });

  // Cut logo recess in the center
  const logoSize = Math.round(qrImage.width * 0.22);
  const cx = qrImage.width / 2;
  const cy = qrImage.height / 2;
  const rx = Math.round(cx - logoSize / 2);
  const ry = Math.round(cy - logoSize / 2);

  // Fill recess with #14130a (same color as QR modules)
  for (let y = ry; y < ry + logoSize; y++) {
    for (let x = rx; x < rx + logoSize; x++) {
      const idx = (y * qrImage.width + x) << 2;
      qrImage.bitmap.data[idx] = 20;
      qrImage.bitmap.data[idx + 1] = 19;
      qrImage.bitmap.data[idx + 2] = 10;
    }
  }

  // Overlay logo
  const logoPath = join(__dirname, '..', 'public', 'logo.png');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logoImage: any;
  try {
    logoImage = await Jimp.read(readFileSync(logoPath));
  } catch {
    // Logo not found — return recolored QR without logo overlay
    return await qrImage.getBase64('image/png') as string;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (logoImage as any).resize(logoSize, logoSize);
  qrImage.composite(logoImage, rx, ry);

  return await qrImage.getBase64('image/png') as string;
}
