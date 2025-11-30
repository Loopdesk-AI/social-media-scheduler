# Social Media Scheduler - Backend

Express.js backend for the Social Media Scheduler application.

## Architecture

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: BullMQ with Redis
- **Storage**: Cloudflare R2

## Prerequisites

- Node.js 18+
- Cloud-hosted PostgreSQL database
- Cloud-hosted Redis instance

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Database (Cloud Postgres)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Cloud Redis)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=                   # Optional - leave empty if Redis has no auth
REDIS_TLS=false

# Encryption Key (64 hex characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-character-hex-key

# OAuth - Instagram/Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# OAuth - YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# OAuth - Twitter
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# OAuth - TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=

# Dropbox OAuth
DROPBOX_CLIENT_ID=
DROPBOX_CLIENT_SECRET=
DROPBOX_REDIRECT_URI=

# Cloudflare R2 Storage (required)
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

## Installation

```bash
npm install
```

## Database Setup

Push the schema to your database:

```bash
npm run db:push
```

Or generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

## Development

```bash
npm run dev
```

The server will start at `http://localhost:3001`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema directly to database |
| `npm run db:studio` | Open Drizzle Studio GUI |

## Project Structure

```
src/
├── app.ts                 # Express app configuration
├── index.ts               # Server entry point
├── controllers/           # Request handlers
├── database/
│   ├── db.ts              # Drizzle client
│   └── schema.ts          # Database schema
├── middleware/
│   └── error.middleware.ts
├── monitoring/
│   ├── bull-board.ts      # Queue dashboard
│   └── health.service.ts  # Health checks
├── providers/             # Social media integrations
├── routes/                # API route definitions
├── services/              # Business logic
├── storage/               # File storage adapters
└── utils/                 # Utility functions
```

## API Endpoints

### Health

- `GET /health` - Full health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Integrations

- `GET /api/integrations` - List all integrations
- `GET /api/integrations/types` - Get supported platforms
- `GET /api/integrations/:provider/auth-url` - Get OAuth URL
- `POST /api/integrations/:provider/callback` - OAuth callback
- `DELETE /api/integrations/:id` - Remove integration
- `PATCH /api/integrations/:id/toggle` - Enable/disable integration

### Posts

- `GET /api/posts` - List posts with filters
- `POST /api/posts` - Create single post
- `POST /api/posts/multi-platform` - Create multi-platform post
- `GET /api/posts/:id` - Get post details
- `PATCH /api/posts/:id` - Update post
- `PATCH /api/posts/:id/reschedule` - Reschedule post
- `DELETE /api/posts/:id` - Cancel post

### Media

- `POST /api/media/upload` - Upload media file
- `GET /api/media` - List media files
- `GET /api/media/:id` - Get media details
- `DELETE /api/media/:id` - Delete media

### Storage

- `GET /api/storage/providers` - List storage providers
- `GET /api/storage/auth/:provider` - Get storage OAuth URL
- `GET /api/storage/integrations` - List storage integrations
- `GET /api/storage/:id/files` - List files from storage
- `POST /api/storage/:id/import/:fileId` - Import file from storage

### Chat

- `POST /api/chat` - AI chat (streaming)
- `GET /api/chat/conversations` - List conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id` - Get conversation
- `DELETE /api/chat/conversations/:id` - Delete conversation

### User

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile (Gemini API key)

### Admin

- `GET /admin/queues` - BullMQ dashboard
- `GET /admin/queue-metrics` - Queue statistics
- `GET /admin/system` - System information

## Queue Dashboard

Access the BullMQ dashboard at `http://localhost:3001/admin/queues` to monitor scheduled posts and job status.

## License

MIT