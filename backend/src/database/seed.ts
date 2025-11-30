import { config } from "dotenv";
config();

import { db, pool } from "./db";
import { users } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

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
