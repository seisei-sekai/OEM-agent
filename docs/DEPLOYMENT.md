# Deployment Guide

**Created:** 2026-01-23
**Last Updated:** 2026-01-23
**Purpose:** Complete deployment guide for OEM Agent system

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 8.15.0+
- Docker & Docker Compose
- OpenAI API Key

### Setup Steps

1. **Clone and Install**

```bash
git clone <repository-url>
cd OEM_Agent
pnpm install
```

2. **Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=sk-proj-...
```

3. **Start Infrastructure**

```bash
# Start MongoDB and Weaviate
docker-compose up -d mongodb weaviate t2v-transformers

# Wait for services to be ready (about 30 seconds)
docker-compose ps
```

4. **Seed Database**

```bash
# Seed mock products into MongoDB
pnpm --filter @repo/infrastructure seed
```

5. **Start Applications**

```bash
# Start all services in development mode
pnpm dev

# Or start individually
pnpm --filter @repo/api dev
pnpm --filter @repo/web dev
```

6. **Access Applications**

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/health
- MongoDB: mongodb://admin:password@localhost:27017
- Weaviate: http://localhost:8080

---

## Docker Compose (Full Stack)

### All Services

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Individual Services

```bash
# Start only databases
docker-compose up -d mongodb weaviate

# Start only API
docker-compose up -d api

# Restart a service
docker-compose restart web
```

---

## Production Deployment (GCP)

### Prerequisites

- GCP Account with billing enabled
- `gcloud` CLI installed and configured
- Terraform installed
- OpenAI API Key

### Setup Steps

1. **Configure GCP**

```bash
# Login to GCP
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable compute.googleapis.com
```

2. **Configure Terraform**

```bash
cd terraform

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars
project_id      = "your-gcp-project-id"
region          = "asia-northeast1"
zone            = "asia-northeast1-a"
openai_api_key  = "sk-proj-..."
git_repo_url    = "https://github.com/yourusername/oem-agent.git"
```

3. **Deploy Infrastructure**

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

4. **Access Deployed Application**

```bash
# Get outputs
terraform output

# Example output:
# frontend_url = "http://34.84.XXX.XXX:3000"
# api_url = "http://34.84.XXX.XXX:3001"
```

5. **SSH into VM (Optional)**

```bash
# SSH command from terraform output
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# Check logs
sudo tail -f /var/log/startup-script.log

# Check Docker containers
sudo docker ps
```

### Updating Deployment

```bash
# SSH into VM
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# Pull latest changes
cd /opt/oem-agent
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

---

## Environment Variables Reference

### Required

- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: MongoDB connection string
- `WEAVIATE_URL`: Weaviate instance URL

### Optional

- `PORT`: API server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `NEXT_PUBLIC_API_URL`: Frontend API endpoint
- `GCP_PROJECT_ID`: GCP project ID (for deployment)
- `GCP_REGION`: GCP region (default: asia-northeast1)

---

## Monitoring & Maintenance

### Health Checks

```bash
# API health
curl http://localhost:3001/health

# MongoDB
docker exec -it oem-agent-mongodb mongosh -u admin -p password

# Weaviate
curl http://localhost:8080/v1/.well-known/ready
```

### Logs

```bash
# Docker Compose logs
docker-compose logs -f api
docker-compose logs -f web

# GCP VM logs
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a
sudo tail -f /var/log/startup-script.log
```

### Database Backup

```bash
# MongoDB backup
docker exec oem-agent-mongodb mongodump --out /backup --authenticationDatabase admin -u admin -p password

# Copy backup locally
docker cp oem-agent-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

---

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Check logs
docker logs oem-agent-mongodb

# Test connection
docker exec -it oem-agent-mongodb mongosh -u admin -p password --eval "db.adminCommand('ping')"
```

### Weaviate Issues

```bash
# Check if Weaviate is healthy
curl http://localhost:8080/v1/.well-known/ready

# Check logs
docker logs oem-agent-weaviate

# Restart Weaviate
docker-compose restart weaviate
```

### API Not Responding

```bash
# Check if API is running
docker ps | grep api

# Check logs
docker logs oem-agent-api

# Check environment variables
docker exec oem-agent-api env | grep OPENAI_API_KEY
```

### Frontend Build Errors

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Rebuild
pnpm --filter @repo/web build
```

---

## Cost Estimation (GCP)

**Monthly Costs (Tokyo Region):**

- VM (e2-medium): ~$27/month
- Network egress: ~$5/month
- Disk (30GB): ~$2/month
- **Total**: ~$34/month

**Cost Optimization:**

- Use e2-small: Save ~$13/month
- Schedule VM shutdown during off-hours
- Use preemptible VM: Save ~60% (with interruptions)

---

## Security Best Practices

1. **Never commit sensitive data**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

2. **Rotate API keys regularly**
   - Change OpenAI API key every 90 days
   - Use separate keys for dev/staging/prod

3. **Secure MongoDB**
   - Change default password
   - Use strong passwords
   - Enable authentication

4. **Firewall Rules**
   - Limit access to necessary ports
   - Use VPN for sensitive endpoints

5. **HTTPS in Production**
   - Use Cloud Load Balancer with SSL certificate
   - Force HTTPS redirects

---

## Performance Tuning

### API Optimization

- Use connection pooling for MongoDB
- Cache frequently accessed data
- Implement rate limiting

### Frontend Optimization

- Enable Next.js image optimization
- Use CDN for static assets
- Implement service worker for offline support

### Database Optimization

- Create indexes for frequent queries
- Use MongoDB aggregation pipelines
- Implement query result caching

---

## Backup & Disaster Recovery

### Automated Backups

```bash
# Add to crontab
0 2 * * * docker exec oem-agent-mongodb mongodump --out /backup
```

### Recovery Procedure

1. Stop services
2. Restore MongoDB from backup
3. Restart services
4. Verify data integrity

---

## Support

For deployment issues:
1. Check logs
2. Review this guide
3. Open GitHub issue
4. Contact team



