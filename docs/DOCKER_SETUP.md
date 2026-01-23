# Docker Setup Guide

**Created:** 2026-01-23-07-46 (Tokyo Time)  
**Last Updated:** 2026-01-23-07-46 (Tokyo Time)  
**Purpose:** Docker containerization and orchestration guide

---

## 🐳 Overview

This project uses Docker and Docker Compose for containerization, providing consistent development and deployment environments.

### Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                   (oem-network)                          │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │   Web    │───▶│   API    │───▶│ MongoDB  │          │
│  │  :3000   │    │  :4000   │    │  :27017  │          │
│  └──────────┘    └────┬─────┘    └──────────┘          │
│                       │                                  │
│                       │          ┌──────────┐           │
│                       └─────────▶│ Weaviate │           │
│                                  │  :9080   │           │
│                                  └──────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Port Configuration

### Internal vs External Ports

| Service | Internal | External | Purpose |
|---------|----------|----------|---------|
| Web (Next.js) | 3000 | 3000 | Frontend application |
| API (Hono) | 4000 | 4000 | Backend REST API |
| MongoDB | 27017 | 27017 | Database (standard port) |
| Weaviate | 8080 | 9080 | Vector database (mapped to avoid conflicts) |

**Note:** These ports are different from the reference project to avoid conflicts.

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop 4.0+ installed
- Docker Compose 2.0+ installed
- At least 4GB RAM available for Docker

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Required environment variables:
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Verify Setup

```bash
# Check web frontend
curl http://localhost:3000

# Check API health
curl http://localhost:4000/health

# Check MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check Weaviate
curl http://localhost:9080/v1/.well-known/ready
```

---

## 🛠️ Development Workflow

### Running in Development Mode

The Docker setup includes volume mounts for hot-reloading:

```bash
# Start services
docker-compose up -d

# Watch logs for specific service
docker-compose logs -f api
docker-compose logs -f web

# Your code changes will be reflected automatically
```

### Rebuilding After Changes

```bash
# Rebuild specific service
docker-compose build api
docker-compose up -d api

# Rebuild all services
docker-compose build
docker-compose up -d
```

### Running Commands Inside Containers

```bash
# Execute shell in API container
docker-compose exec api sh

# Run tests
docker-compose exec api pnpm test

# Run database seed
docker-compose exec api pnpm --filter @repo/infrastructure seed

# Access MongoDB shell
docker-compose exec mongodb mongosh oem_agent
```

---

## 📦 Service Details

### Web Service (Next.js)

```yaml
Ports: 3000:3000
Image: Built from apps/web/Dockerfile
Volumes: 
  - Source code mounted for hot reload
  - node_modules excluded
  - .next build cache
```

**Key Features:**
- Multi-stage build for optimization
- Development mode with hot reload
- Standalone output for production

### API Service (Hono)

```yaml
Ports: 4000:4000
Image: Built from apps/api/Dockerfile
Volumes:
  - Source code mounted for hot reload
  - Shared packages mounted
```

**Key Features:**
- TypeScript compilation
- Hot reload with tsx
- Environment variable injection

### MongoDB Service

```yaml
Ports: 27017:27017
Image: mongo:7.0
Volumes:
  - Persistent data volume
  - Init scripts for schema setup
```

**Key Features:**
- Automatic schema initialization
- Data persistence across restarts
- Health checks enabled

### Weaviate Service

```yaml
Ports: 9080:8080 (mapped externally)
Image: semitechnologies/weaviate:1.24.1
Volumes:
  - Persistent vector data
```

**Key Features:**
- Vector similarity search
- Anonymous access for development
- Automatic health checks

---

## 🔧 Common Operations

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune -a

# Complete cleanup (CAUTION)
docker-compose down -v
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker-compose logs api

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### MongoDB Connection Issues

```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Hot Reload Not Working

```bash
# Ensure volumes are mounted correctly
docker-compose config

# Restart service
docker-compose restart api

# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 🔐 Security Considerations

### Development vs Production

**Development (docker-compose.yml):**
- Volume mounts for hot reload
- Exposed ports for debugging
- Anonymous Weaviate access
- Detailed logging

**Production:**
- Use multi-stage builds
- No volume mounts
- Restricted network access
- Proper authentication
- SSL/TLS certificates

### Environment Variables

**Never commit `.env` files!**

```bash
# Add to .gitignore
echo ".env" >> .gitignore

# Use secrets management in production
# - Docker Secrets
# - Kubernetes Secrets
# - AWS Secrets Manager
# - Google Secret Manager
```

---

## 📊 Resource Management

### Recommended Allocation

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Monitoring

```bash
# Check resource usage
docker stats

# View specific container
docker stats api
```

---

## 🚀 Production Deployment

### Building for Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Push to registry
docker tag oem-agent-api:latest your-registry/oem-agent-api:latest
docker push your-registry/oem-agent-api:latest
```

### Health Checks

All services include health checks:
- **MongoDB:** `mongosh ping`
- **Weaviate:** HTTP `/v1/.well-known/ready`
- **API:** Implement health endpoint

---

## 📝 Next Steps

1. **Set up CI/CD pipeline** for automated builds
2. **Configure production docker-compose** with optimizations
3. **Implement monitoring** with Prometheus/Grafana
4. **Set up log aggregation** with ELK or Loki
5. **Configure backup strategy** for volumes

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Weaviate Docker Guide](https://weaviate.io/developers/weaviate/installation/docker-compose)


