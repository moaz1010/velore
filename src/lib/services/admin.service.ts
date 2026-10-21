import mongoose from 'mongoose';
import type { FilterQuery, Types as MongooseTypes } from 'mongoose';
import { CategoryModel } from '@/lib/db/models/Category';
import { ProductModel } from '@/lib/db/models/Product';
import { SiteSettingsModel } from '@/lib/db/models/SiteSettings';
import { connectToDatabase } from '@/lib/db/connect';
import { projectPublicSettings } from '@/lib/services/settings.service';
import type { AdminProduct, AdminCategory, AdminDashboardData } from '@/types/admin';
import type { AdminProductListQuery } from '@/lib/schemas/admin.schema';
import type { ProductInput } from '@/lib/schemas/product.schema';
import type { CategoryInput } from '@/lib/schemas/category.schema';
import type { ProductRecord, CategoryRecord } from '@/types/catalog';

const { Types } = mongoose;

interface LeanProduct extends ProductRecord {
  _id: MongooseTypes.ObjectId;
  __v?: number;
}

interface LeanCategory extends CategoryRecord {
  _id: MongooseTypes.ObjectId;
  __v?: number;
}

function toAdminProduct(document: LeanProduct): AdminProduct {
  const {
    _id,
    __v: _version,
    categoryIds,
    includedProductIds,
    createdAt,
    updatedAt,
    ...fields
  } = document;
  void _version;
  return {
    ...fields,
    id: _id.toString(),
    categoryIds: categoryIds.map((id) => id.toString()),
    ...(includedProductIds ? { includedProductIds: includedProductIds.map((id) => id.toString()) } : {}),
    ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
    ...(updatedAt ? { updatedAt: updatedAt.toISOString() } : {}),
  };
}

function toAdminCategory(document: LeanCategory): AdminCategory {
  const { _id, __v: _version, parentId, ...fields } = document;
  void _version;
  return { ...fields, id: _id.toString(), ...(parentId ? { parentId: parentId.toString() } : {}) };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listAdminProducts(query: AdminProductListQuery): Promise<{
  products: AdminProduct[];
  page: number;
  limit: number;
  total: number;
}> {
  await connectToDatabase();
  const filter: FilterQuery<ProductRecord> = {};
  if (query.status) filter.status = query.status;
  if (query.q) {
    const search = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: search }, { slug: search }];
  }
  const [documents, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ updatedAt: -1, name: 1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);
  return {
    products: documents.map((document) => toAdminProduct(document as unknown as LeanProduct)),
    page: query.page,
    limit: query.limit,
    total,
  };
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  await connectToDatabase();
  const document = await ProductModel.findById(new Types.ObjectId(id)).lean();
  return document ? toAdminProduct(document as unknown as LeanProduct) : null;
}

async function validateProductReferences(input: ProductInput, productId?: string): Promise<void> {
  const uniqueCategoryIds = new Set(input.categoryIds);
  const uniqueIncludedIds = new Set(input.includedProductIds ?? []);
  if (uniqueCategoryIds.size !== input.categoryIds.length || uniqueIncludedIds.size !== (input.includedProductIds ?? []).length) {
    throw new Error('PRODUCT_REFERENCES_INVALID');
  }

  if (input.categoryIds.length > 0) {
    const categoryCount = await CategoryModel.countDocuments({
      _id: { $in: input.categoryIds.map((id) => new Types.ObjectId(id)) },
    });
    if (categoryCount !== input.categoryIds.length) throw new Error('PRODUCT_REFERENCES_INVALID');
  }

  const includedProductIds = input.includedProductIds ?? [];
  if (input.type === 'single' && includedProductIds.length > 0) throw new Error('PRODUCT_REFERENCES_INVALID');
  if (input.type !== 'discovery-set' || includedProductIds.length === 0) return;
  const normalizedIncludedIds = includedProductIds.map((id) => new Types.ObjectId(id).toString());
  if (productId && normalizedIncludedIds.includes(new Types.ObjectId(productId).toString())) {
    throw new Error('PRODUCT_REFERENCES_INVALID');
  }

  const singleProducts = await ProductModel.find({
    _id: { $in: includedProductIds.map((id) => new Types.ObjectId(id)) },
    type: 'single',
  }).select('_id').lean();
  if (singleProducts.length !== includedProductIds.length) throw new Error('PRODUCT_REFERENCES_INVALID');
}

export async function createAdminProduct(input: ProductInput): Promise<AdminProduct> {
  await connectToDatabase();
  await validateProductReferences(input);
  const document = await ProductModel.create(input);
  return toAdminProduct(document.toObject() as unknown as LeanProduct);
}

export async function updateAdminProduct(id: string, input: ProductInput): Promise<AdminProduct | null> {
  await connectToDatabase();
  await validateProductReferences(input, id);
  const document = await ProductModel.findById(new Types.ObjectId(id));
  if (!document) return null;
  document.set(input);
  await document.save();
  return toAdminProduct(document.toObject() as unknown as LeanProduct);
}

export async function archiveAdminProduct(id: string, hardDelete: boolean): Promise<{ product: AdminProduct | null; deleted: boolean; blocked: boolean }> {
  await connectToDatabase();
  const objectId = new Types.ObjectId(id);
  if (hardDelete) {
    const includedByAnotherSet = await ProductModel.exists({ includedProductIds: objectId });
    if (includedByAnotherSet) return { product: null, deleted: false, blocked: true };
    const deleted = await ProductModel.findByIdAndDelete(objectId).lean();
    return { product: null, deleted: Boolean(deleted), blocked: false };
  }
  const document = await ProductModel.findById(objectId);
  if (!document) return { product: null, deleted: false, blocked: false };
  document.status = 'archived';
  await document.save();
  return { product: toAdminProduct(document.toObject() as unknown as LeanProduct), deleted: false, blocked: false };
}

export async function bulkArchiveAdminProducts(ids: string[]): Promise<number> {
  await connectToDatabase();
  const result = await ProductModel.updateMany(
    { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
    { $set: { status: 'archived' } },
  );
  return result.modifiedCount;
}

export async function updateAdminProductStock(id: string, sku: string, stock: number): Promise<AdminProduct | null> {
  await connectToDatabase();
  const document = await ProductModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id), 'variants.sku': sku },
    { $set: { 'variants.$.stock': stock } },
    { new: true, runValidators: true },
  ).lean();
  return document ? toAdminProduct(document as unknown as LeanProduct) : null;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  await connectToDatabase();
  const documents = await CategoryModel.find({}).sort({ kind: 1, order: 1, name: 1 }).lean();
  return documents.map((document) => toAdminCategory(document as unknown as LeanCategory));
}

async function parentWouldCreateCycle(id: string | null, parentId: string | undefined): Promise<boolean> {
  if (!parentId) return false;
  if (id && id === parentId) return true;
  let cursor: string | undefined = parentId;
  const visited = new Set<string>();
  while (cursor) {
    if (cursor === id || visited.has(cursor)) return true;
    visited.add(cursor);
    const parent: { parentId?: MongooseTypes.ObjectId } | null = await CategoryModel.findById(new Types.ObjectId(cursor)).select('parentId').lean();
    if (!parent) return true;
    cursor = parent.parentId?.toString();
  }
  return false;
}

export async function createAdminCategory(input: CategoryInput): Promise<AdminCategory> {
  await connectToDatabase();
  if (await parentWouldCreateCycle(null, input.parentId)) throw new Error('CATEGORY_PARENT_INVALID');
  const document = await CategoryModel.create(input);
  return toAdminCategory(document.toObject() as unknown as LeanCategory);
}

export async function updateAdminCategory(id: string, input: CategoryInput): Promise<AdminCategory | null> {
  await connectToDatabase();
  if (await parentWouldCreateCycle(id, input.parentId)) throw new Error('CATEGORY_PARENT_INVALID');
  const document = await CategoryModel.findById(new Types.ObjectId(id));
  if (!document) return null;
  document.set(input);
  await document.save();
  return toAdminCategory(document.toObject() as unknown as LeanCategory);
}

export async function deleteAdminCategory(id: string): Promise<{ deleted: boolean; blocked: boolean }> {
  await connectToDatabase();
  const objectId = new Types.ObjectId(id);
  const [productReference, childReference] = await Promise.all([
    ProductModel.exists({ categoryIds: objectId }),
    CategoryModel.exists({ parentId: objectId }),
  ]);
  if (productReference || childReference) return { deleted: false, blocked: true };
  const result = await CategoryModel.findByIdAndDelete(objectId);
  return { deleted: Boolean(result), blocked: false };
}

export async function reorderAdminCategories(items: Array<{ id: string; order: number }>): Promise<AdminCategory[]> {
  await connectToDatabase();
  const result = await CategoryModel.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.id) },
        update: { $set: { order: item.order } },
      },
    })),
  );
  if (result.matchedCount !== items.length) throw new Error('CATEGORY_REORDER_NOT_FOUND');
  return listAdminCategories();
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  await connectToDatabase();
  const [total, published, draft, archived, productDocuments, recentDocuments, settingsDocument] = await Promise.all([
    ProductModel.countDocuments({}),
    ProductModel.countDocuments({ status: 'published' }),
    ProductModel.countDocuments({ status: 'draft' }),
    ProductModel.countDocuments({ status: 'archived' }),
    ProductModel.find({}).select('name slug isPlaceholder images variants status').lean(),
    ProductModel.find({}).sort({ updatedAt: -1 }).limit(6).lean(),
    SiteSettingsModel.findOne({ key: 'primary' }).lean(),
  ]);

  const lowStock = productDocuments.flatMap((document) => {
    if (document.status !== 'published') return [];
    return document.variants
      .filter((variant) => variant.stock <= 5)
      .map((variant) => ({
        productId: document._id.toString(),
        slug: document.slug,
        name: document.name,
        volumeMl: variant.volumeMl,
        sku: variant.sku,
        stock: variant.stock,
      }));
  });
  const publicSettings = projectPublicSettings(settingsDocument ?? null);
  const placeholderProducts = productDocuments.filter((document) => document.isPlaceholder).length;
  const placeholderImages = productDocuments.reduce(
    (count, document) => count + (document.images.length === 0 ? 1 : document.images.filter((image) => image.isPlaceholder).length),
    0,
  );
  const realWhatsapp = /^\d{8,15}$/.test(publicSettings.whatsappNumber);

  return {
    stats: { total, published, draft, archived, lowStockVariants: lowStock.length },
    lowStock: lowStock.sort((left, right) => left.stock - right.stock).slice(0, 12),
    recentlyEdited: recentDocuments.map((document) => {
      const product = toAdminProduct(document as unknown as LeanProduct);
      return { id: product.id, slug: product.slug, name: product.name, status: product.status, updatedAt: product.updatedAt };
    }),
    checklist: [
      {
        id: 'catalog-products',
        label: 'Replace sample fragrance records with approved catalog data',
        complete: placeholderProducts === 0,
        detail: `${placeholderProducts} placeholder product${placeholderProducts === 1 ? '' : 's'} remain.`,
      },
      {
        id: 'catalog-images',
        label: 'Add approved product photography and alt text',
        complete: placeholderImages === 0,
        detail: `${placeholderImages} product image${placeholderImages === 1 ? '' : 's'} are missing or marked placeholder.`,
      },
      {
        id: 'testimonials',
        label: 'Replace or remove sample testimonials',
        complete: false,
        detail: 'Sample testimonials are not real customer reviews and should not be shown as authentic.',
      },
      {
        id: 'whatsapp',
        label: 'Configure the verified WhatsApp number',
        complete: realWhatsapp,
        detail: realWhatsapp ? 'A digits-only international number is configured.' : 'No verified order number is configured.',
      },
      {
        id: 'logo-svg',
        label: 'Replace temporary raster logo with client SVG artwork',
        complete: false,
        detail: 'The current supplied logo is a transparent raster extraction; replace it with the approved SVG before launch.',
      },
      {
        id: 'flame-vector',
        label: 'Replace the approximate flame ribbon with the true brand vector',
        complete: false,
        detail: 'The hero flame drawing is an explicitly marked approximation.',
      },
    ],
    settings: publicSettings,
  };
}
