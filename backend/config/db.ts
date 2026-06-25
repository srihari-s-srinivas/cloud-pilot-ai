import mongoose from 'mongoose';

let memoryServer: any = null;

// Helper to dynamically load MongoMemoryServer to prevent startup crashes in production
const createMemoryServer = async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  return await MongoMemoryServer.create();
};

/**
 * MongoDB connection handler
 */
export const connectDB = async () => {
  let uri = process.env.MONGO_URI || '';
  const isPlaceholderUri = !uri || uri.includes('<user>') || uri === 'mongodb://localhost:27017/cloudpilot';

  if (isPlaceholderUri) {
    console.warn('⚠️ MONGO_URI is not configured or is using a placeholder. Starting local in-memory MongoDB for development.');
    memoryServer = await createMemoryServer();
    uri = memoryServer.getUri();
  }

  const connectWithUri = async (connectionUri: string) => {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      family: 4,
    });
    mongoose.set('bufferCommands', false);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  };

  try {
    await connectWithUri(uri);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
    }

    if (!isPlaceholderUri) {
      console.warn('⚠️ Falling back to a local in-memory MongoDB instance because Atlas connection failed.');
      try {
        memoryServer = await createMemoryServer();
        uri = memoryServer.getUri();
        await connectWithUri(uri);
        console.log('✅ MongoDB connected via in-memory fallback.');
      } catch (fallbackError) {
        if (fallbackError instanceof Error) {
          console.error(`❌ MongoDB fallback error: ${fallbackError.message}`);
        }
      }
    }
  }
};
