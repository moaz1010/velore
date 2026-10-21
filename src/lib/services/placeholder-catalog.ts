import type { PublicCategory, PublicProduct } from '@/types/api';
import type { ProductGender, ProductVariantRecord, Rating } from '@/types/catalog';

export const PLACEHOLDER_CATEGORIES: PublicCategory[] = [
  { id: '000000000000000000000001', slug: 'woody', name: 'Woody', kind: 'family', order: 1, isActive: true, children: [] },
  { id: '000000000000000000000002', slug: 'floral', name: 'Floral', kind: 'family', order: 2, isActive: true, children: [] },
  { id: '000000000000000000000003', slug: 'oriental-amber', name: 'Oriental / Amber', kind: 'family', order: 3, isActive: true, children: [] },
  { id: '000000000000000000000004', slug: 'fresh-citrus', name: 'Fresh / Citrus', kind: 'family', order: 4, isActive: true, children: [] },
  { id: '000000000000000000000005', slug: 'gourmand', name: 'Gourmand', kind: 'family', order: 5, isActive: true, children: [] },
];

interface SampleSpec {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  gender: ProductGender;
  top: string[];
  heart: string[];
  base: string[];
  featured: boolean;
}

const sampleSpecs: SampleSpec[] = [
  { id: 'demo-01', slug: 'velore-no-01-sample', name: 'Velore No. 01 — Sample', categorySlug: 'woody', gender: 'him', top: ['Bergamot (sample)'], heart: ['Cedar (sample)'], base: ['Vetiver (sample)'], featured: true },
  { id: 'demo-02', slug: 'velore-no-02-sample', name: 'Velore No. 02 — Sample', categorySlug: 'floral', gender: 'her', top: ['Pear (sample)'], heart: ['Rose (sample)'], base: ['Musk (sample)'], featured: true },
  { id: 'demo-03', slug: 'velore-no-03-sample', name: 'Velore No. 03 — Sample', categorySlug: 'oriental-amber', gender: 'unisex', top: ['Cardamom (sample)'], heart: ['Amber (sample)'], base: ['Labdanum (sample)'], featured: true },
  { id: 'demo-04', slug: 'velore-no-04-sample', name: 'Velore No. 04 — Sample', categorySlug: 'fresh-citrus', gender: 'her', top: ['Mandarin (sample)'], heart: ['Neroli (sample)'], base: ['White musk (sample)'], featured: true },
  { id: 'demo-05', slug: 'velore-no-05-sample', name: 'Velore No. 05 — Sample', categorySlug: 'gourmand', gender: 'him', top: ['Pink pepper (sample)'], heart: ['Cocoa (sample)'], base: ['Tonka (sample)'], featured: false },
  { id: 'demo-06', slug: 'velore-no-06-sample', name: 'Velore No. 06 — Sample', categorySlug: 'floral', gender: 'unisex', top: ['Green leaf (sample)'], heart: ['Jasmine (sample)'], base: ['Cashmere wood (sample)'], featured: false },
  { id: 'demo-07', slug: 'velore-no-07-sample', name: 'Velore No. 07 — Sample', categorySlug: 'oriental-amber', gender: 'her', top: ['Saffron (sample)'], heart: ['Amber (sample)'], base: ['Vanilla (sample)'], featured: false },
  { id: 'demo-08', slug: 'velore-no-08-sample', name: 'Velore No. 08 — Sample', categorySlug: 'woody', gender: 'him', top: ['Juniper (sample)'], heart: ['Cypress (sample)'], base: ['Sandalwood (sample)'], featured: false },
];

function sampleVariants(index: number): ProductVariantRecord[] {
  const offset = index * 60;
  return [
    { volumeMl: 30, priceEGP: 850 + offset, stock: 8, sku: `DEMO-${String(index + 1).padStart(2, '0')}-30` },
    { volumeMl: 50, priceEGP: 1250 + offset, stock: 6, sku: `DEMO-${String(index + 1).padStart(2, '0')}-50` },
    { volumeMl: 100, priceEGP: 1950 + offset, stock: 3, sku: `DEMO-${String(index + 1).padStart(2, '0')}-100` },
  ];
}

export const PLACEHOLDER_PRODUCTS: PublicProduct[] = sampleSpecs.map((sample, index) => {
  const category = PLACEHOLDER_CATEGORIES.find((item) => item.slug === sample.categorySlug);
  return {
    id: sample.id,
    slug: sample.slug,
    name: sample.name,
    tagline: 'Placeholder scent study',
    description: 'Sample catalog entry for layout testing. Confirm all fragrance details with Velore before launch.',
    categoryIds: category ? [category.id] : [],
    gender: sample.gender,
    concentration: 'EDP',
    notes: { top: sample.top, heart: sample.heart, base: sample.base },
    accords: [
      { name: 'Sample accord A', strength: 76 - index * 3 },
      { name: 'Sample accord B', strength: 58 - index * 2 },
      { name: 'Sample accord C', strength: 35 + index },
    ],
    longevity: { hours: 6 + (index % 4), rating: (3 + (index % 3)) as Rating },
    sillage: (3 + (index % 3)) as Rating,
    seasons: index % 2 === 0 ? ['autumn', 'winter'] : ['spring', 'summer'],
    occasions: index % 2 === 0 ? ['evening', 'night'] : ['day', 'office'],
    variants: sampleVariants(index),
    images: [],
    badges: [],
    type: 'single',
    status: 'published',
    featured: sample.featured,
    isPlaceholder: true,
    seo: {},
  };
});

const includedProductIds = ['demo-01', 'demo-02', 'demo-03'];
export const PLACEHOLDER_DISCOVERY_SET: PublicProduct = {
  id: 'demo-discovery-set',
  slug: 'velore-discovery-set-sample',
  name: 'Velore Discovery Set — Sample',
  tagline: 'A placeholder set for layout review',
  description: 'Sample discovery-set entry. Confirm its contents, sizes and price with Velore before launch.',
  categoryIds: [],
  gender: 'unisex',
  concentration: 'EDP',
  notes: { top: ['Sample top notes'], heart: ['Sample heart notes'], base: ['Sample base notes'] },
  accords: [{ name: 'Sample blend', strength: 64 }],
  longevity: { hours: 0, rating: 3 },
  sillage: 3,
  seasons: ['spring', 'autumn'],
  occasions: ['day', 'evening'],
  variants: [{ volumeMl: 15, priceEGP: 1450, stock: 5, sku: 'DEMO-SET-15' }],
  images: [],
  badges: [],
  type: 'discovery-set',
  includedProductIds,
  status: 'published',
  featured: true,
  isPlaceholder: true,
  seo: {},
};

export const ALL_PLACEHOLDER_PRODUCTS: PublicProduct[] = [...PLACEHOLDER_PRODUCTS, PLACEHOLDER_DISCOVERY_SET];
