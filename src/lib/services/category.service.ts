import mongoose from 'mongoose';
import type { Types as MongooseTypes } from 'mongoose';
import { CategoryModel } from '@/lib/db/models/Category';
import { ProductModel } from '@/lib/db/models/Product';
import { DatabaseNotConfiguredError, connectToDatabase } from '@/lib/db/connect';
import { PLACEHOLDER_CATEGORIES } from '@/lib/services/placeholder-catalog';
import type { CategoryRecord } from '@/types/catalog';
import type { PublicCategory } from '@/types/api';

const { Types } = mongoose;

interface LeanCategory extends CategoryRecord {
  _id: MongooseTypes.ObjectId;
}

function toPublicCategory(category: LeanCategory): PublicCategory {
  const { _id, parentId, ...fields } = category;
  return {
    ...fields,
    id: _id.toString(),
    ...(parentId ? { parentId: parentId.toString() } : {}),
    children: [],
  };
}

function categoryTree(categories: PublicCategory[]): PublicCategory[] {
  const map = new Map(categories.map((category) => [category.id, category]));
  const roots: PublicCategory[] = [];
  for (const category of categories) {
    const parent = category.parentId ? map.get(category.parentId) : undefined;
    if (parent) parent.children?.push(category);
    else roots.push(category);
  }
  return roots;
}

export async function listPublicCategories(): Promise<PublicCategory[]> {
  try {
    await connectToDatabase();
    const documents = await CategoryModel.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    const categories = documents.map((document) => toPublicCategory(document as unknown as LeanCategory));
    return categoryTree(categories);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError && process.env.NODE_ENV !== 'production') {
      return PLACEHOLDER_CATEGORIES;
    }
    throw error;
  }
}

export async function canDeleteCategory(categoryId: string): Promise<boolean> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(categoryId)) return false;
  const reference = await ProductModel.exists({ categoryIds: new Types.ObjectId(categoryId) });
  return reference === null;
}
