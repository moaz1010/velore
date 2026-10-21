import mongoose from 'mongoose';
import type { Types as MongooseTypes } from 'mongoose';
import { CategoryModel } from '@/lib/db/models/Category';
import { ProductModel } from '@/lib/db/models/Product';
import { SiteSettingsModel } from '@/lib/db/models/SiteSettings';
import { connectToDatabase } from '@/lib/db/connect';
import {
  PLACEHOLDER_CATEGORIES,
  PLACEHOLDER_DISCOVERY_SET,
  PLACEHOLDER_PRODUCTS,
} from '@/lib/services/placeholder-catalog';
import type { CategoryRecord, ProductRecord } from '@/types/catalog';

async function seedCategories(): Promise<Map<string, MongooseTypes.ObjectId>> {
  const actualIdByPlaceholderId = new Map<string, MongooseTypes.ObjectId>();
  for (const category of PLACEHOLDER_CATEGORIES) {
    const { id: placeholderId, children: _children, ...fields } = category;
    void _children;
    const record: CategoryRecord = {
      slug: fields.slug,
      name: fields.name,
      kind: fields.kind,
      order: fields.order,
      isActive: true,
      description: 'Placeholder fragrance family; confirm naming and content with Velore before launch.',
    };
    const saved = await CategoryModel.findOneAndUpdate(
      { slug: record.slug },
      { $set: record },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    actualIdByPlaceholderId.set(placeholderId, saved._id);
  }
  return actualIdByPlaceholderId;
}

async function seedSampleProducts(
  categoryIdMap: Map<string, MongooseTypes.ObjectId>,
): Promise<Map<string, MongooseTypes.ObjectId>> {
  const productIdByDemoId = new Map<string, MongooseTypes.ObjectId>();
  for (const product of PLACEHOLDER_PRODUCTS) {
    const {
      id: demoId,
      categoryIds,
      includedProductIds: _included,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...fields
    } = product;
    void _included;
    void _createdAt;
    void _updatedAt;
    const record: ProductRecord = {
      ...fields,
      categoryIds: categoryIds
        .map((categoryId) => categoryIdMap.get(categoryId))
        .filter((id): id is MongooseTypes.ObjectId => id !== undefined),
      includedProductIds: [],
    };
    const saved = await ProductModel.findOneAndUpdate(
      { slug: record.slug },
      { $set: record },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    productIdByDemoId.set(demoId, saved._id);
  }

  const discovery = PLACEHOLDER_DISCOVERY_SET;
  const {
    id: demoId,
    categoryIds,
    includedProductIds,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...fields
  } = discovery;
  void _createdAt;
  void _updatedAt;
  const included = (includedProductIds ?? [])
    .map((productId) => productIdByDemoId.get(productId))
    .filter((productId): productId is MongooseTypes.ObjectId => productId !== undefined);
  if (included.length === 0) throw new Error('The placeholder discovery set must reference seeded products.');
  const record: ProductRecord = {
    ...fields,
    categoryIds: categoryIds.map((categoryId) => categoryIdMap.get(categoryId)).filter((id): id is MongooseTypes.ObjectId => id !== undefined),
    includedProductIds: included,
  };
  const saved = await ProductModel.findOneAndUpdate(
    { slug: record.slug },
    { $set: record },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  productIdByDemoId.set(demoId, saved._id);
  return productIdByDemoId;
}

async function main(): Promise<void> {
  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error('MONGODB_URI is required. Copy .env.example to .env and configure MongoDB Atlas before seeding.');
  }
  await connectToDatabase();
  const categoryIdMap = await seedCategories();
  const productIdByDemoId = await seedSampleProducts(categoryIdMap);
  await SiteSettingsModel.findOneAndUpdate(
    { key: 'primary' },
    {
      $setOnInsert: {
        key: 'primary',
        whatsappNumber: '',
        deliveryNote: '',
        instagramHandle: process.env.PUBLIC_INSTAGRAM_HANDLE || 'velo.re15',
        announcementBar: { text: '', enabled: false },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  console.info(
    `Seeded ${categoryIdMap.size} sample families and ${productIdByDemoId.size} clearly marked placeholder products/settings.`,
  );
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
