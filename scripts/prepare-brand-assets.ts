import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const brandDir = join(root, 'public', 'brand');
const sourcePath = join(root, 'assets-source', 'VeloreLogo.jpeg');
const lockupPath = join(brandDir, 'logo-lockup.png');
const monogramPath = join(brandDir, 'monogram.png');
const wordmarkPath = join(brandDir, 'wordmark.png');
const goldOnObsidian = { r: 11, g: 11, b: 11, alpha: 1 };

async function rasterizeSvg(filename: string, width: number): Promise<Buffer> {
  const svg = await readFile(join(brandDir, filename));
  return sharp(svg, { density: 192 }).resize({ width, fit: 'inside' }).png().toBuffer();
}

async function thresholdNearBlack(source: string): Promise<Buffer> {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  for (let index = 0; index < pixels.length; index += info.channels) {
    const brightness = Math.max(pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0);
    const originalAlpha = pixels[index + 3] ?? 255;
    const softAlpha = Math.max(0, Math.min(255, Math.round(((brightness - 8) / 28) * 255)));
    pixels[index + 3] = Math.min(originalAlpha, softAlpha);
  }
  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
    .png()
    .toBuffer();
}

async function writeTemporaryAssets(): Promise<void> {
  const lockup = await rasterizeSvg('temporary-logo-lockup.svg', 1200);
  const monogram = await rasterizeSvg('temporary-monogram.svg', 600);
  const wordmark = await rasterizeSvg('temporary-wordmark.svg', 1000);
  await Promise.all([
    sharp(lockup).png().toFile(lockupPath),
    sharp(monogram).png().toFile(monogramPath),
    sharp(wordmark).png().toFile(wordmarkPath),
  ]);
  console.warn('VeloreLogo.jpeg was not found; generated clearly temporary placeholder PNGs, not client extractions.');
}

async function writeExtractedAssets(): Promise<void> {
  const fullLogo = await thresholdNearBlack(sourcePath);
  const { width, height } = await sharp(fullLogo).metadata();
  if (!width || !height) throw new Error('Could not determine the supplied logo dimensions.');
  const trimmedLogo = await sharp(fullLogo).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 }).png().toBuffer();
  const trimmedMetadata = await sharp(trimmedLogo).metadata();
  if (!trimmedMetadata.width || !trimmedMetadata.height) throw new Error('The supplied logo has no visible pixels after thresholding.');
  const logoWidth = trimmedMetadata.width;
  const logoHeight = trimmedMetadata.height;
  const monogramHeight = Math.max(1, Math.round(logoHeight * 0.46));
  const wordmarkTop = Math.round(logoHeight * 0.47);
  const wordmarkHeight = Math.max(1, Math.round(logoHeight * 0.3));
  await Promise.all([
    sharp(trimmedLogo).png().toFile(lockupPath),
    sharp(trimmedLogo)
      .extract({ left: 0, top: 0, width: logoWidth, height: Math.min(monogramHeight, logoHeight) })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
      .png()
      .toFile(monogramPath),
    sharp(trimmedLogo)
      .extract({ left: 0, top: Math.min(wordmarkTop, logoHeight - 1), width: logoWidth, height: Math.min(wordmarkHeight, logoHeight - wordmarkTop) })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
      .png()
      .toFile(wordmarkPath),
  ]);
  console.info('Created transparent raster extractions from assets-source/VeloreLogo.jpeg. Review crop boundaries against the original before client delivery.');
}

async function main(): Promise<void> {
  await mkdir(brandDir, { recursive: true });
  if (existsSync(sourcePath)) await writeExtractedAssets();
  else await writeTemporaryAssets();

  const monogram = await readFile(monogramPath);
  await sharp(monogram).resize(64, 64, { fit: 'contain', background: goldOnObsidian }).png().toFile(join(brandDir, 'favicon.png'));
  await sharp(monogram).resize(180, 180, { fit: 'contain', background: goldOnObsidian }).png().toFile(join(brandDir, 'apple-touch-icon.png'));
  const lockup = await sharp(lockupPath).resize(760, 500, { fit: 'contain' }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: goldOnObsidian } })
    .composite([{ input: lockup, left: 220, top: 65 }])
    .png()
    .toFile(join(brandDir, 'og-image.png'));
}

await main();
