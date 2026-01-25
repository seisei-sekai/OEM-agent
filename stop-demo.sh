#!/bin/bash

# OEM Agent Demo Stop Script

echo "🛑 Stopping OEM Agent Demo..."

# Stop API
if [ -f /tmp/oem-api.pid ]; then
    API_PID=$(cat /tmp/oem-api.pid)
    if ps -p $API_PID > /dev/null 2>&1; then
        echo "   Stopping API server (PID: $API_PID)..."
        kill $API_PID 2>/dev/null || true
    fi
    rm /tmp/oem-api.pid
fi

# Stop Docker services
echo "   Stopping Docker services..."
docker-compose down

echo "✅ All services stopped"



