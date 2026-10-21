import type { ProductVariantRecord } from '@/types/catalog';

const egpFormatter = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
});

export function formatEGP(value: number): string {
  if (!Number.isFinite(value)) return egpFormatter.format(0);
  return egpFormatter.format(Math.trunc(value));
}

export function getLowestPrice(variants: readonly ProductVariantRecord[]): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((variant) => variant.priceEGP));
}
