#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🚀 Deploying OEM Agent to GCP${NC}"
echo -e "${GREEN}=========================================${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install it first.${NC}"
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Configuration
INSTANCE_NAME="${INSTANCE_NAME:-oem-agent-vm}"
ZONE="${ZONE:-asia-northeast1-a}"
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Project: $PROJECT_ID"
echo "   Instance: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo ""

# Step 1: Commit and push current changes (optional)
read -p "$(echo -e ${YELLOW}Do you want to push current changes to GitHub? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}📤 Pushing changes to GitHub...${NC}"
    
    # Check if there are uncommitted changes
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes. Please commit them first.${NC}"
        git status -s
        exit 1
    fi
    
    git push origin $(git rev-parse --abbrev-ref HEAD)
    echo -e "${GREEN}✅ Pushed to GitHub${NC}\n"
fi

# Step 2: SSH to GCP instance and deploy
echo -e "${GREEN}🔧 Connecting to GCP instance...${NC}"

gcloud compute ssh $INSTANCE_NAME \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    --command="
        set -e
        
        echo '========================================='
        echo '🔄 Updating OEM Agent on GCP Instance'
        echo '========================================='
        
        # Navigate to application directory
        cd /opt/oem-agent
        
        # Pull latest changes
        echo '📥 Pulling latest code from GitHub...'
        git fetch origin
        git pull origin \$(git rev-parse --abbrev-ref HEAD)
        
        # Stop running services
        echo '🛑 Stopping services...'
        docker-compose down || true
        
        # Rebuild and start services
        echo '🔨 Building and starting services...'
        docker-compose up -d --build
        
        # Wait for services to be ready
        echo '⏳ Waiting for services to start...'
        sleep 30
        
        # Show service status
        echo '📊 Service Status:'
        docker-compose ps
        
        # Get external IP
        EXTERNAL_IP=\$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google')
        
        echo '========================================='
        echo '✅ Deployment Complete!'
        echo '========================================='
        echo \"Frontend: http://\$EXTERNAL_IP:3000\"
        echo \"API: http://\$EXTERNAL_IP:4000\"
        echo '========================================='
    "

# Step 3: Show deployment summary
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"

# Get instance external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo -e "${YELLOW}📱 Access your application:${NC}"
echo "   Frontend: http://$EXTERNAL_IP:3000"
echo "   API: http://$EXTERNAL_IP:4000"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "   View logs: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='cd /opt/oem-agent && docker-compose logs -f'"
echo "   SSH to instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "   Restart services: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='cd /opt/oem-agent && docker-compose restart'"
echo ""
