import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import type { CategoryRecord } from '@/types/catalog';

const { model, models, Schema } = mongoose;

const categorySchema = new Schema<CategoryRecord>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    kind: { type: String, enum: ['family', 'collection'], required: true },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String, trim: true, maxlength: 2048 },
    order: { type: Number, required: true, min: 0, default: 0 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

categorySchema.index({ kind: 1, parentId: 1, order: 1 });

export const CategoryModel = (models.Category as Model<CategoryRecord> | undefined) ?? model<CategoryRecord>('Category', categorySchema);
