#!/bin/bash

echo "🍎 Setting up Social Media Scheduler on Mac (No Docker)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}📦 Homebrew not found. Installing...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✅ Homebrew installed${NC}"
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}🐘 Installing PostgreSQL...${NC}"
    brew install postgresql@15
    brew services start postgresql@15
    sleep 5
else
    echo -e "${GREEN}✅ PostgreSQL installed${NC}"
    # Make sure it's running
    brew services start postgresql@15 2>/dev/null || true
fi

# Install Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}📮 Installing Redis...${NC}"
    brew install redis
    brew services start redis
    sleep 3
else
    echo -e "${GREEN}✅ Redis installed${NC}"
    # Make sure it's running
    brew services start redis 2>/dev/null || true
fi

# Create database
echo ""
echo "🗄️  Creating database..."
createdb social_scheduler 2>/dev/null || echo "Database already exists"

# Test connections
echo ""
echo "🧪 Testing connections..."

# Test PostgreSQL
if psql social_scheduler -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL connected${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    exit 1
fi

# Test Redis
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis connected${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
    exit 1
fi

# Update backend .env
echo ""
echo "⚙️  Configuring backend..."
cd backend

# Get current username for PostgreSQL
USERNAME=$(whoami)

# Update DATABASE_URL in .env
if [ -f .env ]; then
    # Backup
    cp .env .env.backup
    
    # Update DATABASE_URL
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$USERNAME@localhost:5432/social_scheduler|g" .env
    
    echo -e "${GREEN}✅ Updated .env with local database URL${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Setup Prisma
echo ""
echo "🔧 Setting up Prisma..."
npm run prisma:generate
npm run prisma:push

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   ✅ Setup Complete!                                      ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   PostgreSQL: Running on port 5432                        ║${NC}"
echo -e "${GREEN}║   Redis:      Running on port 6379                        ║${NC}"
echo -e "${GREEN}║   Database:   social_scheduler created                    ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🚀 To start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "🎨 Your frontend is already running on:"
echo "   http://localhost:5173"
echo ""
echo "📝 To stop services later:"
echo "   brew services stop postgresql@15"
echo "   brew services stop redis"
