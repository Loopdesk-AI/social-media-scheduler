import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { integrationsRoutes } from "./routes/integrations.routes";
import { postsRoutes } from "./routes/posts.routes";
import { mediaRoutes } from "./routes/media.routes";
import analyticsRoutes from "./routes/analytics.routes";
import storageRoutes from "./routes/storage.routes";
import { chatRoutes } from "./routes/chat.routes";
import { userRoutes } from "./routes/user.routes";
import { monitoringRoutes } from "./routes/monitoring.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

// CORS - must come before other middleware to handle preflight requests
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["X-Conversation-Id"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Conversation-Id"],
  }),
);

// Security middleware - after CORS to not block preflight
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Monitoring routes (health, etc.)
app.use(monitoringRoutes);

// Bull Board (Queue Dashboard)
if (
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_BULL_BOARD === "true"
) {
  const { serverAdapter } = require("./monitoring/bull-board");
  app.use("/admin/queues", serverAdapter.getRouter());
}

// API routes
app.use("/api/integrations", integrationsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: "Route not found",
  });
});

// Error handling
app.use(errorMiddleware);

export { app };
