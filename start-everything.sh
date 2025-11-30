#!/bin/bash

echo "🚀 Starting Social Media Scheduler..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not installed${NC}"
    echo "Run: ./setup-mac-no-docker.sh first"
    exit 1
fi

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}❌ Redis not installed${NC}"
    echo "Run: ./setup-mac-no-docker.sh first"
    exit 1
fi

# Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
brew services start postgresql@15 2>/dev/null
sleep 2

# Start Redis
echo "📮 Starting Redis..."
brew services start redis 2>/dev/null
sleep 2

# Check if services are running
if ! psql social_scheduler -c "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not responding${NC}"
    echo "Try: brew services restart postgresql@15"
    exit 1
fi

if ! redis-cli ping &> /dev/null; then
    echo -e "${RED}❌ Redis not responding${NC}"
    echo "Try: brew services restart redis"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL running${NC}"
echo -e "${GREEN}✅ Redis running${NC}"
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if Prisma is set up
if [ ! -d "backend/node_modules/.prisma" ]; then
    echo "🔧 Setting up Prisma..."
    cd backend
    npm run prisma:generate
    npm run prisma:push
    cd ..
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   ✅ Everything Ready!                                    ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Frontend: http://localhost:5173 (already running)      ║${NC}"
echo -e "${GREEN}║   Backend:  Starting now...                               ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Press Ctrl+C to stop the backend"
echo ""

# Start backend
cd backend
npm run dev
