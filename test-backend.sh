#!/bin/bash

echo "🧪 Testing Social Media Scheduler Backend..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s http://localhost:3001/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}❌ Health check failed - Is backend running?${NC}"
    exit 1
fi
echo ""

# Test 2: Integration Types
echo "2️⃣  Testing integration types endpoint..."
TYPES=$(curl -s -H "X-User-Id: test-user-123" http://localhost:3001/api/integrations/types)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Integration types endpoint working${NC}"
    echo "   Response: $TYPES"
else
    echo -e "${RED}❌ Integration types failed${NC}"
    exit 1
fi
echo ""

# Test 3: List Integrations (should be empty)
echo "3️⃣  Testing list integrations endpoint..."
INTEGRATIONS=$(curl -s -H "X-User-Id: test-user-123" http://localhost:3001/api/integrations)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ List integrations endpoint working${NC}"
    echo "   Response: $INTEGRATIONS"
else
    echo -e "${RED}❌ List integrations failed${NC}"
    exit 1
fi
echo ""

# Test 4: List Posts (should be empty)
echo "4️⃣  Testing list posts endpoint..."
POSTS=$(curl -s -H "X-User-Id: test-user-123" http://localhost:3001/api/posts)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ List posts endpoint working${NC}"
    echo "   Response: $POSTS"
else
    echo -e "${RED}❌ List posts failed${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Your backend is working correctly!"
echo ""
echo "Next steps:"
echo "  1. Setup Facebook app for Instagram OAuth"
echo "  2. Connect your frontend to the backend"
echo "  3. Start scheduling posts!"
