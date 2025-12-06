import { config } from "dotenv";
config();

import { db, pool } from "./db";
import { users } from "./schema";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testConnection(): Promise<boolean> {
  try {
    console.log("🔌 Testing database connection...");
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", (error as Error).message);
    return false;
  }
}

async function seedWithRetry(attempt: number = 1): Promise<void> {
  try {
    // Create default user
    const result = await db
      .insert(users)
      .values({
        id: "default-user",
        email: "default@example.com",
        name: "Default User",
        timezone: 0,
      })
      .onConflictDoNothing()
      .returning();

    if (result.length > 0) {
      console.log("✅ Default user created:", result[0].id);
    } else {
      console.log("✅ Default user already exists");
    }
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Seeding attempt ${attempt} failed:`, err.message);

    // Check if it's a connection error and we should retry
    const isConnectionError =
      err.message.includes("Connection terminated") ||
      err.message.includes("timeout") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("ENOTFOUND");

    if (isConnectionError && attempt < MAX_RETRIES) {
      console.log(
        `⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds... (attempt ${attempt + 1}/${MAX_RETRIES})`,
      );
      await sleep(RETRY_DELAY_MS);
      return seedWithRetry(attempt + 1);
    }

    throw error;
  }
}

async function seed() {
  console.log("🌱 Seeding database...");
  console.log(
    "📍 Database URL:",
    process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL.substring(0, 30)}...`
      : "NOT SET",
  );

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  try {
    // Test connection first with retries
    let connected = false;
    for (let i = 1; i <= MAX_RETRIES; i++) {
      connected = await testConnection();
      if (connected) break;

      if (i < MAX_RETRIES) {
        console.log(
          `⏳ Waiting ${RETRY_DELAY_MS / 1000} seconds before retry... (attempt ${i + 1}/${MAX_RETRIES})`,
        );
        await sleep(RETRY_DELAY_MS);
      }
    }

    if (!connected) {
      console.error(
        "❌ Could not establish database connection after",
        MAX_RETRIES,
        "attempts",
      );
      console.error("   Please check:");
      console.error("   - DATABASE_URL is correct");
      console.error("   - Database server is running and accessible");
      console.error(
        "   - If using Neon, the database might need manual wake-up from the dashboard",
      );
      process.exit(1);
    }

    // Run seeding with retry logic
    await seedWithRetry();

    console.log("🌱 Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
