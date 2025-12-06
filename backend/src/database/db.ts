import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Create a PostgreSQL connection pool for cloud-hosted postgres (Neon)
// Neon databases on free tier go to sleep after inactivity and need time to wake up
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon and most cloud Postgres providers
  },
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 5s to 30s for Neon cold start
});

// Log connection errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client:", err);
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for direct access if needed (e.g., for raw queries or health checks)
export { pool };

// Graceful shutdown
process.on("beforeExit", async () => {
  await pool.end();
});
