#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/startup-script.log)
exec 2>&1

echo "========================================="
echo "Starting OEM Agent VM Setup"
echo "========================================="

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js and pnpm
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm@8.15.0
fi

# Create application directory
mkdir -p /opt/oem-agent
cd /opt/oem-agent

# Clone repository if provided
if [ -n "${git_repo_url}" ]; then
    if [ ! -d ".git" ]; then
        echo "Cloning repository..."
        git clone ${git_repo_url} .
    else
        echo "Repository already exists, pulling latest..."
        git pull
    fi
fi

# Create .env file
cat > .env <<EOF
OPENAI_API_KEY=${openai_api_key}
MONGODB_URI=mongodb://admin:password@mongodb:27017/oem-agent?authSource=admin
WEAVIATE_URL=http://weaviate:8080
PORT=4000
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google'):4000
EOF

# Start services with Docker Compose
if [ -f "docker-compose.yml" ]; then
    echo "Starting services with Docker Compose..."
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    
    echo "Waiting for services to be ready..."
    sleep 30
    
    # Seed database
    echo "Seeding database..."
    docker-compose exec -T api pnpm --filter @repo/infrastructure seed || true
    
    echo "========================================="
    echo "OEM Agent Setup Complete!"
    echo "========================================="
    echo "Frontend: http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google'):3000"
    echo "API: http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google'):4000"
else
    echo "docker-compose.yml not found, skipping deployment"
fi

