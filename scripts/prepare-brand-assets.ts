import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const brandDir = join(root, 'public', 'brand');
const sourcePath = join(root, 'assets-source', 'VeloreLogo.jpeg');
const lockupPath = join(brandDir, 'logo-lockup.png');
const monogramPath = join(brandDir, 'monogram.png');
const wordmarkPath = join(brandDir, 'wordmark.png');
const background = { r: 11, g: 11, b: 11, alpha: 1 };

interface RelativeCrop {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Extract one area from the client-supplied black-background JPEG and make only
 * near-black pixels transparent. This is a deterministic raster extraction;
 * the source file is never overwritten.
 */
async function extractTransparent(crop: RelativeCrop, imageWidth: number, imageHeight: number): Promise<Buffer> {
  const left = Math.round(crop.left * imageWidth);
  const top = Math.round(crop.top * imageHeight);
  const width = Math.min(imageWidth - left, Math.round(crop.width * imageWidth));
  const height = Math.min(imageHeight - top, Math.round(crop.height * imageHeight));
  const { data, info } = await sharp(sourcePath)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const brightness = Math.max(red, green, blue);
    const originalAlpha = data[index + 3] ?? 255;
    const warmGold = red >= green - 3 && green >= blue - 3 && red > 35;
    const neutralHighlight = brightness >= 84 && brightness - Math.min(red, green, blue) <= 24;
    const softAlpha = warmGold
      ? Math.round(((brightness - 6) / 32) * 255)
      : Math.round(((brightness - 48) / 72) * 255);
    const colorAlpha = warmGold || neutralHighlight ? Math.max(0, Math.min(255, softAlpha)) : 0;
    data[index + 3] = Math.min(originalAlpha, colorAlpha);
  }

  const result = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
    .png()
    .toBuffer();
  const metadata = await sharp(result).metadata();
  if (!metadata.width || !metadata.height) throw new Error('A requested logo crop was empty after removing its black background.');
  return result;
}

async function main(): Promise<void> {
  await mkdir(brandDir, { recursive: true });
  const source = await readFile(sourcePath).catch(() => {
    throw new Error('Missing assets-source/VeloreLogo.jpeg. Add the client-supplied source before running pnpm brand:assets.');
  });
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Could not read the supplied logo dimensions.');

  // Crop boxes are relative to the supplied 1254 × 1254 composition. They
  // include enough surrounding margin for transparent trimming after extraction.
  const lockup = await extractTransparent({ left: 0.12, top: 0.17, width: 0.76, height: 0.60 }, metadata.width, metadata.height);
  const monogram = await extractTransparent({ left: 0.31, top: 0.18, width: 0.38, height: 0.38 }, metadata.width, metadata.height);
  const wordmark = await extractTransparent({ left: 0.12, top: 0.55, width: 0.76, height: 0.23 }, metadata.width, metadata.height);

  await Promise.all([
    sharp(lockup).png().toFile(lockupPath),
    sharp(monogram).png().toFile(monogramPath),
    sharp(wordmark).png().toFile(wordmarkPath),
  ]);

  await sharp(monogram)
    .resize(64, 64, { fit: 'contain', background })
    .png()
    .toFile(join(brandDir, 'favicon.png'));
  await sharp(monogram)
    .resize(180, 180, { fit: 'contain', background })
    .png()
    .toFile(join(brandDir, 'apple-touch-icon.png'));

  const socialLockup = await sharp(lockup).resize(760, 500, { fit: 'inside' }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background } })
    .composite([{ input: socialLockup, left: 220, top: 65 }])
    .png()
    .toFile(join(brandDir, 'og-image.png'));

  const [lockupInfo, monogramInfo, wordmarkInfo] = await Promise.all([
    sharp(lockupPath).metadata(),
    sharp(monogramPath).metadata(),
    sharp(wordmarkPath).metadata(),
  ]);
  console.info('Created transparent extractions from the supplied VeloreLogo.jpeg:');
  console.info(`  lockup ${lockupInfo.width}×${lockupInfo.height}`);
  console.info(`  monogram ${monogramInfo.width}×${monogramInfo.height}`);
  console.info(`  wordmark ${wordmarkInfo.width}×${wordmarkInfo.height}`);
}

await main();
