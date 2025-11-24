import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRoutes } from './routes/auth.routes';
import { integrationsRoutes } from './routes/integrations.routes';
import { postsRoutes } from './routes/posts.routes';
import { mediaRoutes } from './routes/media.routes';
import analyticsRoutes from './routes/analytics.routes';
import storageRoutes from './routes/storage.routes';
import { chatRoutes } from './routes/chat.routes';
import { userRoutes } from './routes/user.routes';
import { monitoringRoutes } from './routes/monitoring.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { sentryService } from './monitoring/sentry.service';
import { join } from 'path';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// Initialize Sentry (must be first)
sentryService.init(app);

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['X-Conversation-Id']
  })
);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(process.env.STORAGE_PATH || './uploads'));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Metrics tracking
app.use(metricsMiddleware);

// Static file serving for uploads
const uploadsPath = process.env.STORAGE_LOCAL_PATH || join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Monitoring routes (health, metrics, etc.)
app.use(monitoringRoutes);

// Bull Board (Queue Dashboard)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_BULL_BOARD === 'true') {
  const { serverAdapter } = require('./monitoring/bull-board');
  app.use('/admin/queues', serverAdapter.getRouter());
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationsRoutes); // Auth handled per-route
app.use('/api/posts', authMiddleware, postsRoutes);
app.use('/api/media', authMiddleware, mediaRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'Route not found',
  });
});

// Error handling (Sentry error handler is already set up in init)
app.use(errorMiddleware);

export { app };