import mongoose from 'mongoose';

/**
 * Fintrack — MongoDB Connection Layer (Mongoose Singleton)
 *
 * Requirements:
 * - Restricts execution strictly to server-side environments.
 * - Prevents instantiating duplicate Mongoose connections across Next.js hot reloads in development.
 * - Reads `MONGODB_URI` from environment variables, failing fast with a descriptive error if missing.
 * - Caches the connection promise globally during development to prevent connection pooling leaks.
 */

// 1. Runtime guard ensuring this module is never bundled or executed on the client
if (typeof window !== 'undefined') {
  throw new Error('Mongoose connection utility can only be executed in server-side contexts.');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

/**
 * Connects to MongoDB via Mongoose or returns the existing active connection singleton.
 *
 * @returns A promise resolving to the shared Mongoose instance.
 * @throws {Error} If MONGODB_URI is undefined or connection fails.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error(
      'Missing MONGODB_URI environment variable. Please define it in your .env or deployment configuration.'
    );
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
