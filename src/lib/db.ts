import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryServer?: any;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    let mongoUri = process.env.MONGODB_URI?.trim();

    // If no MONGODB_URI is provided or empty in development, spin up in-memory mongodb
    if (!mongoUri) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!cached!.memoryServer) {
          cached!.memoryServer = await MongoMemoryServer.create({
            instance: { dbName: 'myfinance' },
          });
        }
        mongoUri = cached!.memoryServer.getUri();
        console.log('[Database] Using embedded MongoMemoryServer at:', mongoUri);
      } catch (err) {
        console.warn('[Database] Could not start MongoMemoryServer, falling back to localhost:27017/myfinance', err);
        mongoUri = 'mongodb://127.0.0.1:27017/myfinance';
      }
    }

    cached!.promise = mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/myfinance', opts).then((m) => {
      console.log('[Database] Connected successfully to MongoDB');
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectToDatabase;
