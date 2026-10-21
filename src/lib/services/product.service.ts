import mongoose from 'mongoose';
import type { FilterQuery, Types as MongooseTypes } from 'mongoose';
import { CategoryModel } from '@/lib/db/models/Category';
import { ProductModel } from '@/lib/db/models/Product';
import { DatabaseNotConfiguredError, connectToDatabase } from '@/lib/db/connect';
import type { ProductListQuery } from '@/lib/schemas/product.schema';
import type { ProductRecord } from '@/types/catalog';
import type { ProductDetailResult, ProductListResult, PublicProduct } from '@/types/api';
import {
  ALL_PLACEHOLDER_PRODUCTS,
  PLACEHOLDER_CATEGORIES,
  PLACEHOLDER_PRODUCTS,
} from '@/lib/services/placeholder-catalog';

const { Types } = mongoose;

interface LeanProduct extends ProductRecord {
  _id: MongooseTypes.ObjectId;
  __v?: number;
}

function toPublicProduct(document: LeanProduct): PublicProduct {
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
    categoryIds: categoryIds.map((categoryId) => categoryId.toString()),
    ...(includedProductIds ? { includedProductIds: includedProductIds.map((id) => id.toString()) } : {}),
    ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
    ...(updatedAt ? { updatedAt: updatedAt.toISOString() } : {}),
  };
}

function lowestPrice(product: PublicProduct): number {
  return Math.min(...product.variants.map((variant) => variant.priceEGP));
}

function listDevelopmentProducts(query: ProductListQuery): ProductListResult {
  let products = [...ALL_PLACEHOLDER_PRODUCTS];
  if (query.gender) products = products.filter((product) => product.gender === query.gender);
  if (query.family) {
    const category = PLACEHOLDER_CATEGORIES.find((item) => item.slug === query.family);
    if (category) products = products.filter((product) => product.categoryIds.includes(category.id));
    else products = [];
  }
  const minPrice = query.minPrice;
  const maxPrice = query.maxPrice;
  if (query.volume !== undefined || minPrice !== undefined || maxPrice !== undefined) {
    products = products.filter((product) => product.variants.some((variant) =>
      (query.volume === undefined || variant.volumeMl === query.volume) &&
      (minPrice === undefined || variant.priceEGP >= minPrice) &&
      (maxPrice === undefined || variant.priceEGP <= maxPrice),
    ));
  }
  if (query.q) {
    const search = query.q.toLocaleLowerCase('en');
    products = products.filter((product) =>
      [product.name, product.tagline ?? '', product.description, ...product.notes.top, ...product.notes.heart, ...product.notes.base]
        .join(' ')
        .toLocaleLowerCase('en')
        .includes(search),
    );
  }
  if (query.sort === 'price-asc') products.sort((left, right) => lowestPrice(left) - lowestPrice(right));
  if (query.sort === 'price-desc') products.sort((left, right) => lowestPrice(right) - lowestPrice(left));
  if (query.sort === 'newest') products.reverse();
  if (query.sort === 'featured') products.sort((left, right) => Number(right.featured) - Number(left.featured));

  const total = products.length;
  const start = (query.page - 1) * query.limit;
  products = products.slice(start, start + query.limit);
  return {
    products,
    page: query.page,
    limit: query.limit,
    total,
    hasMore: start + products.length < total,
    source: 'development-placeholder',
  };
}

function buildProductFilter(query: ProductListQuery): FilterQuery<ProductRecord> {
  const filter: FilterQuery<ProductRecord> = { status: 'published' };
  if (query.gender) filter.gender = query.gender;
  if (query.q) filter.$text = { $search: query.q };

  const variantFilter: { volumeMl?: number; priceEGP?: { $gte?: number; $lte?: number } } = {};
  if (query.volume !== undefined) variantFilter.volumeMl = query.volume;
  const priceFilter: { $gte?: number; $lte?: number } = {};
  if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
  if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
  if (Object.keys(priceFilter).length > 0) variantFilter.priceEGP = priceFilter;
  if (Object.keys(variantFilter).length > 0) filter.variants = { $elemMatch: variantFilter };
  return filter;
}

function makeSort(query: ProductListQuery): Record<string, 1 | -1> {
  switch (query.sort) {
    case 'newest':
      return { createdAt: -1 };
    case 'price-asc':
      return { 'variants.priceEGP': 1 };
    case 'price-desc':
      return { 'variants.priceEGP': -1 };
    case 'featured':
    default:
      return { featured: -1, createdAt: -1 };
  }
}

export async function listPublishedProducts(query: ProductListQuery): Promise<ProductListResult> {
  try {
    await connectToDatabase();
    const filter = buildProductFilter(query);
    if (query.family) {
      const category = await CategoryModel.findOne({ slug: query.family, isActive: true }).select('_id').lean();
      if (!category) {
        return { products: [], page: query.page, limit: query.limit, total: 0, hasMore: false, source: 'database' };
      }
      filter.categoryIds = category._id;
    }
    const [documents, total] = await Promise.all([
      ProductModel.find(filter)
        .sort(makeSort(query))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);
    const products = documents.map((document) => toPublicProduct(document as unknown as LeanProduct));
    return {
      products,
      page: query.page,
      limit: query.limit,
      total,
      hasMore: query.page * query.limit < total,
      source: 'database',
    };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError && process.env.NODE_ENV !== 'production') {
      return listDevelopmentProducts(query);
    }
    throw error;
  }
}

export async function findPublishedProduct(slug: string): Promise<ProductDetailResult | null> {
  try {
    await connectToDatabase();
    const document = await ProductModel.findOne({ slug, status: 'published' }).lean();
    if (!document) return null;
    const product = toPublicProduct(document as unknown as LeanProduct);
    const relatedFilter: FilterQuery<ProductRecord> = {
      status: 'published',
      type: product.type,
      slug: { $ne: slug },
    };
    if (product.categoryIds.length > 0) {
      relatedFilter.categoryIds = { $in: product.categoryIds.map((id) => new Types.ObjectId(id)) };
    } else {
      relatedFilter.gender = product.gender;
    }
    const [relatedDocuments, includedDocuments] = await Promise.all([
      ProductModel.find(relatedFilter).sort({ featured: -1, createdAt: -1 }).limit(4).lean(),
      product.type === 'discovery-set' && product.includedProductIds
        ? ProductModel.find({
            _id: { $in: product.includedProductIds.map((id) => new Types.ObjectId(id)) },
            status: 'published',
            type: 'single',
          }).lean()
        : Promise.resolve([]),
    ]);
    return {
      product,
      related: relatedDocuments.map((item) => toPublicProduct(item as unknown as LeanProduct)),
      included: includedDocuments.map((item) => toPublicProduct(item as unknown as LeanProduct)),
      source: 'database',
    };
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError && process.env.NODE_ENV !== 'production') {
      const product = ALL_PLACEHOLDER_PRODUCTS.find((item) => item.slug === slug);
      if (!product) return null;
      const related = PLACEHOLDER_PRODUCTS.filter(
        (item) => item.id !== product.id && item.type === product.type && item.gender === product.gender,
      ).slice(0, 4);
      const included = product.type === 'discovery-set'
        ? PLACEHOLDER_PRODUCTS.filter((item) => product.includedProductIds?.includes(item.id))
        : [];
      return { product, related, included, source: 'development-placeholder' };
    }
    throw error;
  }
}

export async function listDiscoverySets(): Promise<PublicProduct[]> {
  try {
    await connectToDatabase();
    const documents = await ProductModel.find({ type: 'discovery-set', status: 'published' })
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    return documents.map((document) => toPublicProduct(document as unknown as LeanProduct));
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError && process.env.NODE_ENV !== 'production') {
      return ALL_PLACEHOLDER_PRODUCTS.filter((product) => product.type === 'discovery-set');
    }
    throw error;
  }
}
