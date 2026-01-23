# OEM Agent - AI-Powered Manufacturing Assistant

A complete AI agent system for turning product ideas into real, physical products with automated branding extraction, product recommendations, and mockup generation.

## Architecture

Built with **Clean Architecture** and **Domain-Driven Design (DDD)** principles:

- **Domain Layer**: Pure business logic, entities, value objects
- **Application Layer**: Use cases, DTOs, service interfaces  
- **Infrastructure Layer**: LangGraph.js agent, MongoDB, Weaviate, OpenAI
- **API Layer**: Hono with SSE streaming
- **Frontend**: Next.js 14 with App Router

## Tech Stack

- **Monorepo**: Turborepo
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Zustand
- **API**: Hono (lightweight, fast HTTP framework)
- **Agent**: LangGraph.js for state machine orchestration
- **AI**: OpenAI GPT-4o-mini (cheapest model)
- **Databases**: MongoDB (primary), Weaviate (vector search)
- **Infrastructure**: Docker Compose (local), Terraform + GCP (production)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- OpenAI API Key

### 1. Clone and Install

```bash
git clone <repository-url>
cd OEM_Agent
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Start Services

```bash
# Start MongoDB and Weaviate
docker-compose up -d mongodb weaviate

# Seed database with mock products
pnpm --filter @repo/infrastructure seed

# Start API and Frontend
pnpm dev
```

Services will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- MongoDB: localhost:27017
- Weaviate: http://localhost:8080

## Project Structure

```
/
├── apps/
│   ├── api/              # Hono API with SSE streaming
│   └── web/              # Next.js frontend
├── packages/
│   ├── domain/           # Pure business logic
│   ├── application/      # Use cases, interfaces
│   └── infrastructure/   # LangGraph agent, DB, AI services
├── terraform/            # GCP infrastructure as code
├── docker-compose.yml    # Local development setup
└── turbo.json           # Turborepo configuration
```

## Features

### ✅ Implemented

- Floating AI agent button (persistent across all pages)
- Chat modal with sidebar and message history
- LangGraph.js agent with state machine
- Intent classification (branded_merch, custom, general, track_order)
- Branding extraction from URLs
- Product recommendations with semantic search
- MongoDB repositories for chat sessions, messages, products
- Weaviate vector search integration
- OpenAI GPT-4o-mini for conversations
- SSE streaming for real-time responses
- Docker Compose for local development
- Terraform for GCP deployment

### 🚧 To Be Enhanced

- File upload for logo extraction
- Mockup generation (currently placeholder)
- Human escalation flow
- Chat history persistence
- Product filtering and pagination
- Mobile responsive design improvements

## Development

### Run in Development Mode

```bash
# All services
pnpm dev

# Specific services
pnpm --filter @repo/api dev
pnpm --filter @repo/web dev
```

### Build for Production

```bash
pnpm build
```

### Type Checking

```bash
pnpm type-check
```

### Database Seeding

```bash
# Seed mock products
pnpm --filter @repo/infrastructure seed
```

## Deployment

### Docker Compose (All Services)

```bash
docker-compose up -d --build
```

### Terraform (GCP)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your GCP project ID and API keys

terraform init
terraform plan
terraform apply
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `MONGODB_URI`: MongoDB connection string
- `WEAVIATE_URL`: Weaviate instance URL
- `NEXT_PUBLIC_API_URL`: Frontend API endpoint

## API Documentation

### Agent Chat (SSE Streaming)

```
POST /api/agent/chat
Content-Type: application/json

{
  "sessionId": "uuid",
  "message": "I want to create branded merchandise",
  "context": {
    "pageUrl": "http://localhost:3000",
    "pageType": "landing"
  }
}

Response: Server-Sent Events stream
event: token
data: {"type":"token","data":{"text":"Hello"}}

event: complete
data: {"type":"complete","data":{"sessionId":"uuid"}}
```

### Sessions

- `POST /api/sessions` - Create new chat session
- `GET /api/sessions?userId=<id>` - Get chat history
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/:id/messages` - Get session messages
- `DELETE /api/sessions/:id` - Delete session

### Products

- `POST /api/products/recommend` - Get product recommendations
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/search?q=<query>` - Search products

### Branding

- `POST /api/branding/extract-url` - Extract branding from URL
- `POST /api/branding/extract-upload` - Extract branding from file upload

## Architecture Decisions

### Why LangGraph.js?

- Explicit state management for complex agent flows
- Better than LangChain for stateful conversations
- Conditional edges for dynamic routing
- Easy debugging and testing

### Why Hono?

- Lightweight and fast (10x faster than Express)
- Great TypeScript support
- SSE streaming built-in
- Works well with serverless

### Why Clean Architecture?

- Separates business logic from infrastructure
- Easy to test (mock external dependencies)
- Flexible to change databases/frameworks
- Clear dependency rules

### Why MongoDB + Weaviate?

- MongoDB: Flexible schema for chat sessions and products
- Weaviate: Vector search for semantic product recommendations
- Best of both worlds: CRUD + semantic search

## Contributing

Follow these rules:
1. Domain layer: NO external dependencies (only zod)
2. Application layer: Only reference Domain
3. Infrastructure: Implement Application interfaces
4. Always write tests before implementation (TDD)
5. Use Dependency Injection via config.configurable for LangGraph nodes

## License

MIT

## Support

For questions or issues, please open a GitHub issue or contact the team.
