/* eslint-env node */
/**
 * PM2 Ecosystem Configuration
 * Process manager for Node.js applications in production
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 *   pm2 logs social-media-backend
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: "social-media-backend",
      script: "dist/index.js",
      cwd: "/app",

      // Cluster mode for load balancing (use 'fork' for single instance)
      exec_mode: "cluster",
      instances: "max", // Or set a specific number like 2, 4, etc.

      // Auto-restart settings
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,

      // Memory management
      max_memory_restart: "500M",

      // Environment variables
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/app/logs/pm2-error.log",
      out_file: "/app/logs/pm2-out.log",
      merge_logs: true,
      log_type: "json",

      // Graceful shutdown
      kill_timeout: 10000, // 10 seconds to gracefully shutdown
      wait_ready: true,
      listen_timeout: 10000,

      // Health monitoring
      min_uptime: "10s",

      // Source maps for better error traces
      source_map_support: true,

      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
    },
  ],

  // Deployment configuration for PM2 deploy command
  deploy: {
    production: {
      user: "ec2-user",
      host: ["your-ec2-host.amazonaws.com"],
      key: "~/.ssh/your-key.pem",
      ref: "origin/main",
      repo: "git@github.com:your-username/social-media-scheduler.git",
      path: "/home/ec2-user/app",
      "pre-deploy-local": "",
      "post-deploy":
        "cd backend && npm ci && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },
  },
};
