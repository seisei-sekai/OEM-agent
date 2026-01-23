#!/bin/bash

# OEM Agent Demo Startup Script
# This script starts all services needed for the demo

set -e

echo "🚀 Starting OEM Agent Demo..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start MongoDB and Weaviate
echo -e "${BLUE}📦 Starting infrastructure services...${NC}"
docker-compose up -d mongodb weaviate
sleep 5

# Check MongoDB
echo -e "${BLUE}🔍 Checking MongoDB...${NC}"
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MongoDB is running on port 27018${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB is starting...${NC}"
fi

# Check Weaviate
echo -e "${BLUE}🔍 Checking Weaviate...${NC}"
if curl -s http://localhost:9080/v1/.well-known/live > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Weaviate is running on port 9080${NC}"
else
    echo -e "${YELLOW}⚠️  Weaviate is starting...${NC}"
fi

# Start API server
echo ""
echo -e "${BLUE}🌐 Starting API server...${NC}"
cd "$(dirname "$0")"
PORT=${PORT:-4000} MONGODB_URL=mongodb://localhost:27018 pnpm --filter @repo/api dev > /tmp/oem-api.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/oem-api.pid
sleep 5

# Check API
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server is running on port 4000${NC}"
    echo -e "   Health check: http://localhost:4000/health"
else
    echo -e "${YELLOW}⚠️  API server is starting... (check logs: tail -f /tmp/oem-api.log)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Demo is ready!${NC}"
echo ""
echo "📋 Service URLs:"
echo "   - API:      http://localhost:4000"
echo "   - Health:   http://localhost:4000/health"
echo "   - MongoDB:  localhost:27018"
echo "   - Weaviate: http://localhost:9080"
echo ""
echo "📝 Logs:"
echo "   - API: tail -f /tmp/oem-api.log"
echo "   - MongoDB: docker-compose logs -f mongodb"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop-demo.sh"
echo ""

