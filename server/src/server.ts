import mongoose from 'mongoose';

import { createApp } from './app.js';
import { env } from './config/env.js';

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  await mongoose.connect(env.mongodbUrl);
}

async function bootstrap(): Promise<void> {
  await connectMongo();

  mongoose.connection.on('error', (error) => {
    console.error('Mongoose connection error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    // Disconnected
  });

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Server is running on http://localhost:${env.port}`);
  });

  const shutdown = (signal: string) => {
    server.close(async () => {
      try {
        await mongoose.connection.close(false);
      } catch (error) {
        // Error closing connection
      }
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Application startup failed:', error);
  process.exit(1);
});
