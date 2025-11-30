# Social Media Scheduler

A modern social media scheduling application for managing and scheduling posts across multiple platforms.

## Features

- 📅 **Calendar View** - Visual calendar interface for scheduled posts
- 📊 **Analytics Dashboard** - Track performance metrics across platforms
- 🔗 **Multi-Platform Support** - Support for YouTube, Instagram, LinkedIn, and more
- ⏰ **Smart Scheduling** - Schedule posts with timezone awareness
- 📹 **Video Management** - Upload and manage video content
- 🤖 **AI Content Assistant** - Generate content with Gemini AI integration
- ☁️ **Cloud Storage** - Connect Google Drive and Dropbox for media management

## Architecture

This application uses:

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: Cloud-hosted PostgreSQL with Drizzle ORM
- **Queue**: BullMQ with cloud-hosted Redis
- **Storage**: Local or Cloudflare R2

## Getting Started

### Prerequisites

- Node.js 18+
- Cloud-hosted PostgreSQL database
- Cloud-hosted Redis instance

### Environment Setup

1. Copy the example environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Configure the required environment variables:

   ```env
   # Database (Cloud Postgres)
   DATABASE_URL=postgresql://user:password@host:5432/database

   # Redis (Cloud Redis)
   REDIS_HOST=your-redis-host.com
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password

   # Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ENCRYPTION_KEY=your-64-character-hex-key

   # Frontend URL
   FRONTEND_URL=http://localhost:5173

   # OAuth Credentials (as needed)
   FACEBOOK_APP_ID=
   FACEBOOK_APP_SECRET=
   YOUTUBE_CLIENT_ID=
   YOUTUBE_CLIENT_SECRET=
   # ... etc
   ```

### Installation

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Generate database schema:

   ```bash
   cd backend
   npm run db:push
   ```

### Development

1. Start the frontend:

   ```bash
   npm run dev
   ```

2. Start the backend (in a separate terminal):

   ```bash
   cd backend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Tech Stack

### Frontend

- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- Recharts for analytics visualization
- Lucide React for icons

### Backend

- Express.js with TypeScript
- Drizzle ORM for database operations
- BullMQ for job queue management
- ioredis for Redis connections

## Project Structure

```
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility functions
│   └── types/             # TypeScript types
│
├── backend/               # Backend source
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── database/      # Drizzle schema and client
│   │   ├── middleware/    # Express middleware
│   │   ├── monitoring/    # Health checks
│   │   ├── providers/     # Social media integrations
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── storage/       # File storage
│   │   └── utils/         # Utilities
│   └── drizzle/           # Database migrations
│
└── package.json           # Frontend dependencies
```

## API Endpoints

### Integrations

- `GET /api/integrations` - List all integrations
- `GET /api/integrations/:provider/auth-url` - Get OAuth URL
- `POST /api/integrations/:provider/callback` - OAuth callback
- `DELETE /api/integrations/:id` - Remove integration

### Posts

- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `POST /api/posts/multi-platform` - Create multi-platform post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Media

- `POST /api/media/upload` - Upload media file
- `GET /api/media` - List media files
- `DELETE /api/media/:id` - Delete media

### Health

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## License

MIT