// CRITICAL: Load environment variables FIRST before any other imports
import { config } from 'dotenv';
const result = config();

if (result.error) {
  console.error('❌ Failed to load .env file:', result.error);
  console.error('   Make sure backend/.env exists and is readable');
  process.exit(1);
}

// Validate environment variables before importing anything else
import { validateEnvironment } from './utils/env-validator';
validateEnvironment();

// Now import the rest of the application
import { app } from './app';
import { queueService } from './services/queue.service';
import { prisma } from './database/prisma.client';
import { healthService } from './monitoring/health.service';
import { sentryService } from './monitoring/sentry.service';

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Social Media Scheduler Backend                      ║
║                                                           ║
║   Server:      http://localhost:${PORT}                     ║
║   Health:      http://localhost:${PORT}/health             ║
║   Metrics:     http://localhost:${PORT}/metrics            ║
║   Queue UI:    http://localhost:${PORT}/admin/queues       ║
║   API:         http://localhost:${PORT}/api                ║
║                                                           ║
║   📊 BullMQ Worker: Running                               ║
║   🗄️  Database: Connected                                 ║
║   📈 Monitoring: Enabled                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close monitoring services
  await healthService.close();
  console.log('✅ Health service closed');

  await sentryService.close();
  console.log('✅ Sentry closed');

  // Close queue service
  await queueService.close();
  console.log('✅ Queue service closed');

  // Close database
  await prisma.$disconnect();
  console.log('✅ Database disconnected');

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});
