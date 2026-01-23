# Quick Start Guide

Get the OEM Agent system running in 5 minutes.

## Prerequisites

- Node.js 20+
- pnpm 8.15.0+
- Docker & Docker Compose
- OpenAI API Key

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Set OpenAI API Key

```bash
# Option 1: Set environment variable
export OPENAI_API_KEY=sk-your-openai-api-key-here

# Option 2: Create .env file (recommended)
cp env.template .env
# Edit .env and add your OpenAI API key
```

**Get your API key from:** https://platform.openai.com/api-keys

## 3. Start Infrastructure

```bash
# Start MongoDB and Weaviate
docker-compose up -d mongodb weaviate t2v-transformers
```

## 4. Seed Database

```bash
# Add mock products
pnpm --filter @repo/infrastructure seed
```

## 5. Start Applications

```bash
# Start API and Frontend
pnpm dev
```

## 6. Open Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

## Next Steps

1. Click the purple floating button in the bottom-right corner
2. Try: "I want to create branded merchandise"
3. Share a website URL to extract branding
4. View product recommendations with your logo

## Troubleshooting

### Port Already in Use

```bash
# Kill processes using ports 3000, 3001
lsof -ti:3000,3001 | xargs kill -9
```

### MongoDB Connection Error

```bash
# Restart MongoDB
docker-compose restart mongodb
```

### Missing OpenAI Key

```bash
# Check if key is set
echo $OPENAI_API_KEY

# Or create .env file
cp .env.example .env
# Edit .env and add your key
```

## Full Documentation

- [README.md](./README.md) - Complete overview
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) - API reference
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Architecture deep dive

## Team Ready

This component is production-ready and can be merged into your main codebase. All Clean Architecture principles and DDD patterns have been followed.

**Happy Coding! 🚀**


