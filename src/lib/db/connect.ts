import mongoose from 'mongoose';

interface MongooseCache {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithCache = globalThis as typeof globalThis & { __veloreMongoose?: MongooseCache };
const cache: MongooseCache =
  globalWithCache.__veloreMongoose ?? { connection: null, promise: null };
globalWithCache.__veloreMongoose = cache;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('MONGODB_URI is not configured. Add the MongoDB Atlas connection string to the runtime environment.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) return cache.connection;

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new DatabaseNotConfiguredError();

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false })
      .then((connection) => connection)
      .catch((error: unknown) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
