// CRITICAL: Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { existsSync } from "fs";

// Load .env first (base config), then .env.local to override (local takes priority)
const envPath = ".env";
const envLocalPath = ".env.local";

if (existsSync(envPath)) {
  const result = config({ path: envPath });
  if (result.error) {
    console.error("❌ Failed to load .env file:", result.error);
    process.exit(1);
  }
  console.log("✅ Loaded environment from .env");
} else {
  console.error("❌ No .env file found");
  console.error("   Make sure backend/.env exists");
  process.exit(1);
}

// Load .env.local to override base config (if it exists)
if (existsSync(envLocalPath)) {
  const result = config({ path: envLocalPath, override: true });
  if (result.error) {
    console.error("❌ Failed to load .env.local file:", result.error);
    process.exit(1);
  }
  console.log("✅ Loaded local overrides from .env.local");
}

// Validate environment variables before importing anything else
import { validateEnvironment } from "./utils/env-validator";
validateEnvironment();

// Now import the rest of the application
import { app } from "./app";
import { queueService } from "./services/queue.service";
import { pool } from "./database/db";
import { healthService } from "./monitoring/health.service";

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Social Media Scheduler Backend                      ║
║                                                           ║
║   Server:      http://localhost:${PORT}                     ║
║   Health:      http://localhost:${PORT}/health             ║
║   Queue UI:    http://localhost:${PORT}/admin/queues       ║
║   API:         http://localhost:${PORT}/api                ║
║                                                           ║
║   📊 BullMQ Worker: Running                               ║
║   🗄️  Database: Connected (Cloud Postgres)               ║
║   📦 Redis: Connected (Cloud Redis)                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down gracefully...");

  // Close server
  server.close(() => {
    console.log("✅ HTTP server closed");
  });

  // Close monitoring services
  await healthService.close();
  console.log("✅ Health service closed");

  // Close queue service
  await queueService.close();
  console.log("✅ Queue service closed");

  // Close database pool
  await pool.end();
  console.log("✅ Database disconnected");

  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  shutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  shutdown();
});
