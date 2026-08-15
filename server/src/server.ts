import mongoose from "mongoose";

import { createApp } from "./app.js";
import { env } from "./config/env.js";

mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

export async function connectMongo(mongoUrl = env.mongodbUrl): Promise<boolean> {
  if (!mongoUrl) {
    console.warn(
      "MONGODB_URL is not configured. Starting without a MongoDB connection.",
    );
    return false;
  }

  if (mongoose.connection.readyState !== 0) {
    return true;
  }

  try {
    await mongoose.connect(mongoUrl);
    return true;
  } catch (error) {
    console.warn(
      "MongoDB connection unavailable; continuing without database connectivity.",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

async function bootstrap(): Promise<void> {
  const mongoAvailable = await connectMongo();

  if (mongoAvailable) {
    mongoose.connection.on("error", (error) => {
      console.error("Mongoose connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      // Disconnected
    });
  }

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

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
