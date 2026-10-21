import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import type { ProductRecord } from '@/types/catalog';

const { model, models, Schema } = mongoose;

const notesSchema = new Schema(
  {
    top: { type: [String], default: [] },
    heart: { type: [String], default: [] },
    base: { type: [String], default: [] },
  },
  { _id: false },
);

const accordSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 48 },
    strength: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const longevitySchema = new Schema(
  {
    hours: { type: Number, required: true, min: 0, max: 48 },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const variantSchema = new Schema(
  {
    volumeMl: { type: Number, required: true, min: 1 },
    priceEGP: { type: Number, required: true, min: 0 },
    compareAtEGP: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, required: true, trim: true, maxlength: 40 },
  },
  { _id: false },
);

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    alt: { type: String, required: true, trim: true, maxlength: 180 },
    isPrimary: { type: Boolean, required: true, default: false },
    isPlaceholder: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const seoSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 180 },
  },
  { _id: false },
);

const productSchema = new Schema<ProductRecord>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tagline: { type: String, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
    gender: { type: String, enum: ['him', 'her', 'unisex'], required: true, index: true },
    concentration: { type: String, enum: ['EDP', 'EDT', 'Extrait', 'Oil'], required: true },
    notes: { type: notesSchema, required: true },
    accords: { type: [accordSchema], default: [] },
    longevity: { type: longevitySchema, required: true },
    sillage: { type: Number, required: true, min: 1, max: 5 },
    seasons: { type: [String], enum: ['spring', 'summer', 'autumn', 'winter'], default: [] },
    occasions: { type: [String], enum: ['day', 'night', 'office', 'evening'], default: [] },
    variants: { type: [variantSchema], required: true, validate: { validator: (values: ProductRecord['variants']) => values.length > 0, message: 'At least one variant is required.' } },
    images: { type: [imageSchema], default: [] },
    badges: { type: [String], enum: ['new', 'bestseller', 'limited'], default: [] },
    type: { type: String, enum: ['single', 'discovery-set'], required: true, default: 'single' },
    includedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    status: { type: String, enum: ['draft', 'published', 'archived'], required: true, default: 'draft', index: true },
    featured: { type: Boolean, default: false, index: true },
    isPlaceholder: { type: Boolean, required: true, default: false },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true, minimize: false },
);

productSchema.pre('validate', function validateProduct(this: ProductRecord & { invalidate: (path: string, message: string) => void }) {
  const document = this as ProductRecord & { images: ProductRecord['images']; includedProductIds?: ProductRecord['includedProductIds']; invalidate: (path: string, message: string) => void };
  if (document.images.length > 0 && document.images.filter((image) => image.isPrimary).length !== 1) {
    document.invalidate('images', 'Exactly one primary image is required when images exist.');
  }
  if (document.type === 'discovery-set' && (!document.includedProductIds || document.includedProductIds.length === 0)) {
    document.invalidate('includedProductIds', 'Discovery sets must include at least one product.');
  }
});

productSchema.index({ status: 1, gender: 1, categoryIds: 1 });
productSchema.index({ name: 'text', 'notes.top': 'text', 'notes.heart': 'text', 'notes.base': 'text' });

export const ProductModel = (models.Product as Model<ProductRecord> | undefined) ?? model<ProductRecord>('Product', productSchema);
