# Social Media Scheduler Backend

Node.js + Express backend for social media integration and post scheduling.

## Features

- ✅ Instagram OAuth integration via Facebook Business
- ✅ YouTube, TikTok, LinkedIn, Facebook, Twitter/X integrations
- ✅ Post scheduling with BullMQ job queue
- ✅ Prisma ORM with PostgreSQL
- ✅ Token encryption with AES-256
- ✅ Automatic retry logic and error handling
- ✅ RESTful API with Express
- ✅ Comprehensive monitoring and observability
- ✅ Prometheus metrics and Grafana dashboards
- ✅ Sentry error tracking
- ✅ Health checks and readiness probes

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## Quick Start

### 1. Start Database Services

```bash
# Start PostgreSQL and Redis with Docker Compose
docker-compose up -d
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env and add:
# - ENCRYPTION_KEY (generated above)
# - FACEBOOK_APP_ID and FACEBOOK_APP_SECRET
# - DATABASE_URL (default: postgresql://postgres:postgres@localhost:5432/social_scheduler)
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start on http://localhost:3001

## API Endpoints

### Integrations

- `GET /api/integrations/types` - Get available integration types
- `GET /api/integrations/:provider/auth-url` - Generate OAuth URL
- `POST /api/integrations/:provider/callback` - Handle OAuth callback
- `GET /api/integrations` - List all integrations
- `DELETE /api/integrations/:id` - Delete integration

### Posts

- `POST /api/posts` - Create and schedule post
- `GET /api/posts` - List posts with filters
- `GET /api/posts/:id` - Get single post
- `PATCH /api/posts/:id` - Update post
- `PATCH /api/posts/:id/reschedule` - Reschedule post
- `DELETE /api/posts/:id` - Cancel post

## Authentication

For MVP, use `X-Organization-Id` header:

```bash
curl -H "X-Organization-Id: org-123" http://localhost:3001/api/integrations
```

## Facebook App Setup

1. Go to https://developers.facebook.com/
2. Create new app
3. Add Instagram Basic Display and Instagram Graph API products
4. Configure OAuth redirect URI: `http://localhost:5173/integrations/social/instagram`
5. Copy App ID and App Secret to `.env`

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── providers/        # Platform integrations
│   ├── middleware/       # Express middleware
│   ├── database/         # Prisma setup
│   ├── utils/            # Utilities
│   ├── app.ts            # Express app
│   └── index.ts          # Entry point
├── package.json
└── tsconfig.json
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View Prisma Studio
npm run prisma:studio
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 3001) |
| NODE_ENV | Environment | No (default: development) |
| DATABASE_URL | PostgreSQL connection string | Yes |
| REDIS_HOST | Redis host | Yes |
| REDIS_PORT | Redis port | Yes |
| ENCRYPTION_KEY | 64-char hex string for token encryption | Yes |
| FACEBOOK_APP_ID | Facebook App ID | Yes |
| FACEBOOK_APP_SECRET | Facebook App Secret | Yes |
| FRONTEND_URL | Frontend URL for OAuth redirects | Yes |

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres
```

### Redis Connection Error

```bash
# Check if Redis is running
docker-compose ps

# Test connection
redis-cli ping
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma client
npm run prisma:generate
```

## License

MIT


## Monitoring & Observability

The backend includes comprehensive monitoring capabilities. See [MONITORING.md](./MONITORING.md) for detailed documentation.

### Quick Access

- **Health Check**: http://localhost:3001/health
- **Metrics (Prometheus)**: http://localhost:3001/metrics
- **Queue Dashboard**: http://localhost:3001/admin/queues
- **System Info**: http://localhost:3001/admin/system

### Health Endpoints

```bash
# General health check
curl http://localhost:3001/health

# Liveness probe (Kubernetes)
curl http://localhost:3001/health/live

# Readiness probe (Kubernetes)
curl http://localhost:3001/health/ready
```

### Prometheus Metrics

The `/metrics` endpoint exposes metrics in Prometheus format:

- HTTP request rate, duration, and errors
- Queue size and processing metrics
- Integration API performance
- Post publishing success/failure rates
- System metrics (CPU, memory, heap)

### Queue Dashboard (Bull Board)

Access the queue dashboard at http://localhost:3001/admin/queues to:

- View all jobs (waiting, active, completed, failed)
- Retry failed jobs
- Monitor queue health
- View job details and logs

Enable in production:
```env
ENABLE_BULL_BOARD=true
```

### Error Tracking (Sentry)

Configure Sentry for error tracking:

```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

Features:
- Automatic error capture
- Performance monitoring
- Release tracking
- User context

### Logging

Structured logging with Winston:

- **Development**: Console output with colors
- **Production**: File output to `./logs/`
  - `logs/error.log`: Error logs only
  - `logs/combined.log`: All logs

Configure log level:
```env
LOG_LEVEL=debug  # debug, info, warn, error
```

### Grafana Dashboard

Import the included Grafana dashboard:

```bash
# Import grafana-dashboard.json into Grafana
```

Visualizes:
- Request rate and latency
- Error rates
- Queue metrics
- Post publishing stats
- Memory and CPU usage

### Prometheus Alerts

Use the included alert rules:

```bash
# Add to Prometheus configuration
cp prometheus-alerts.yml /etc/prometheus/alerts/
```

Alerts for:
- High error rates
- Queue backlogs
- Service downtime
- High memory/CPU usage
- Integration failures

### Monitoring Best Practices

1. **Set up alerts** for critical metrics
2. **Monitor queue backlog** to prevent delays
3. **Track error rates** by provider
4. **Use health checks** in load balancers
5. **Enable Sentry** in production
6. **Review logs** regularly

For detailed monitoring documentation, see [MONITORING.md](./MONITORING.md).
