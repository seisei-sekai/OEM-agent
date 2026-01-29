# OEM Agent - GCP Deployment Guide

**Created:** 2026-01-30
**Last Updated:** 2026-01-30
**Purpose:** Guide for deploying OEM Agent to Google Cloud Platform

---

## 📋 Prerequisites

1. **gcloud CLI** installed and authenticated
   ```bash
   # Install gcloud (if not already)
   # Visit: https://cloud.google.com/sdk/docs/install
   
   # Authenticate
   gcloud auth login
   
   # Set default project
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **GCP Instance** already created via Terraform
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   terraform init
   terraform apply
   ```

3. **Git repository** configured and code pushed to GitHub

---

## 🚀 Quick Deploy

### Method 1: Using npm script (Recommended)

```bash
pnpm deploy:gcp
```

### Method 2: Direct script execution

```bash
./scripts/deploy-to-gcp.sh
```

### Method 3: Custom configuration

```bash
INSTANCE_NAME=my-custom-vm ZONE=us-central1-a ./scripts/deploy-to-gcp.sh
```

---

## 📝 What the Deploy Script Does

1. **Checks prerequisites**: Verifies gcloud CLI is installed
2. **Optional Git push**: Prompts to push current changes to GitHub
3. **SSH to GCP instance**: Connects to your VM
4. **Pull latest code**: Updates code from GitHub
5. **Rebuild services**: Stops, rebuilds, and restarts Docker containers
6. **Health check**: Waits for services to be ready
7. **Shows access URLs**: Displays Frontend and API URLs

---

## 🔧 Manual Deployment Steps

If you need to deploy manually:

```bash
# 1. SSH to your instance
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 2. Navigate to app directory
cd /opt/oem-agent

# 3. Pull latest code
git pull origin main

# 4. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 5. Check status
docker-compose ps
docker-compose logs -f
```

---

## 🛠️ Useful Commands

### View Logs

```bash
# View all service logs
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a \
    --command='cd /opt/oem-agent && docker-compose logs -f'

# View specific service logs
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a \
    --command='cd /opt/oem-agent && docker-compose logs -f api'
```

### Restart Services

```bash
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a \
    --command='cd /opt/oem-agent && docker-compose restart'
```

### Check Service Status

```bash
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a \
    --command='cd /opt/oem-agent && docker-compose ps'
```

### SSH to Instance

```bash
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a
```

### Get Instance IP

```bash
gcloud compute instances describe oem-agent-vm \
    --zone=asia-northeast1-a \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

---

## 🐳 Docker Management

### Inside the instance:

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs
docker logs <container_id>

# Restart a specific service
docker-compose restart api

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d

# Clean up unused images
docker system prune -a
```

---

## 🔍 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h

# Restart Docker daemon
sudo systemctl restart docker
docker-compose up -d
```

### Code not updating

```bash
# SSH to instance
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# Force pull
cd /opt/oem-agent
git fetch --all
git reset --hard origin/main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port conflicts

```bash
# Check what's using ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :4000

# Kill process if needed
sudo kill -9 <PID>
```

### Database issues

```bash
# Reset MongoDB
docker-compose down
docker volume rm oem-agent_mongodb_data
docker-compose up -d

# Re-seed database
docker-compose exec api pnpm --filter @repo/infrastructure seed
```

---

## 🔐 Environment Variables

The `.env` file is automatically created by the startup script with:

```bash
OPENAI_API_KEY=<from terraform vars>
MONGODB_URI=mongodb://admin:password@mongodb:27017/oem-agent?authSource=admin
WEAVIATE_URL=http://weaviate:8080
PORT=4000
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://<external-ip>:4000
FRONTEND_URL=http://<external-ip>:3000
```

To update environment variables:

1. SSH to instance
2. Edit `/opt/oem-agent/.env`
3. Restart services: `docker-compose restart`

---

## 📊 Monitoring

### Check resource usage

```bash
# CPU and memory
docker stats

# Disk usage
docker system df

# Container details
docker inspect <container_id>
```

### Application health

```bash
# Check API health
curl http://<external-ip>:4000/health

# Check if MongoDB is ready
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check if Weaviate is ready
curl http://<external-ip>:9080/v1/.well-known/ready
```

---

## 🔄 CI/CD Integration

To automate deployments with GitHub Actions:

```yaml
# .github/workflows/deploy-gcp.yml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup gcloud
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Deploy
        run: ./scripts/deploy-to-gcp.sh
```

---

## 📚 Related Documentation

- [Terraform Configuration](../terraform/README.md)
- [Docker Compose Setup](../docker-compose.yml)
- [Startup Script](../terraform/startup-script.sh)
- [Main Workflow Guide](./WORKFLOW_GUIDE.md)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify GCP instance is running: `gcloud compute instances list`
3. Check firewall rules: `gcloud compute firewall-rules list`
4. Verify external IP: `gcloud compute addresses list`
5. Test connectivity: `curl http://<external-ip>:4000/health`
