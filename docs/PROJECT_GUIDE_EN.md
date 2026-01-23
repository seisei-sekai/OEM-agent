# OEM Agent Complete Project Guide (English)

**Created:** 2026-01-23  
**Last Updated:** 2026-01-23  
**Target Audience:** Frontend/Backend beginners with basic React and Flask experience

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack Explained](#tech-stack-explained)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Development Guide](#development-guide)
6. [Deployment Guide](#deployment-guide)

---

## Project Overview

### What is this project?

OEM Agent is an intelligent AI assistant system that helps users:
- Upload website URLs to automatically extract branding (logo, colors)
- Recommend customized products based on branding
- Generate product mockups using AI (DALL-E)

### Core Features

```
User inputs website URL (https://monoya.com)
    ↓
AI extracts branding info (logo, colors)
    ↓
Recommends custom products (mugs, t-shirts, etc.)
    ↓
Generates product mockups (DALL-E)
```

---

## Tech Stack Explained

### 1. Turborepo (Project Management Tool)

**What is it?**
- A monorepo management tool, similar to Yarn Workspaces or Lerna
- Allows managing multiple projects (frontend, backend, shared libraries) in one codebase

**Why use it?**
- **Unified version management**: All packages use the same dependency versions
- **Incremental builds**: Only builds changed parts, speeding up build time
- **Code sharing**: Frontend and backend can share TypeScript type definitions

**Key files:**
```
turbo.json          # Turborepo configuration
pnpm-workspace.yaml # pnpm workspace configuration
```

**Role in this project:**
```
OEM_Agent/
├── apps/          # Applications
│   ├── api/       # Backend API
│   └── web/       # Frontend Web
└── packages/      # Shared packages
    ├── domain/    # Business logic
    ├── application/
    └── infrastructure/
```

### 2. Hono (Backend Framework)

**What is it?**
- Ultra-lightweight web framework (similar to Flask)
- Designed for edge computing and high performance

**Comparison with Flask:**

```python
# Flask (what you know)
@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}
```

```typescript
// Hono (new framework)
app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});
```

**Features:**
- 🚀 **Blazing fast**: 3-4x faster than Express
- 🪶 **Lightweight**: Core is only 13KB
- 🔒 **Type-safe**: Native TypeScript support

**Role in this project:**
- Handles all API requests (`/api/chat`, `/health`, `/sessions`)
- Acts as HTTP interface for LangGraph Agent
- Manages SSE (Server-Sent Events) streaming responses

**Key files:**
```
apps/api/src/
├── index.ts           # Main entry file
├── routes/            # API routes
│   ├── agent.ts       # AI Agent routes
│   ├── health.ts      # Health check
│   └── sessions.ts    # Session management
└── middleware/        # Middleware
    ├── cors.ts        # CORS configuration
    └── logger.ts      # Logging
```

### 3. Next.js (Frontend Framework)

**What is it?**
- Production-grade React framework
- Provides SSR, routing, API routes, etc.

**Comparison with React:**

```jsx
// React (what you know - needs react-router)
import { BrowserRouter, Route } from 'react-router-dom';
function App() {
  return (
    <BrowserRouter>
      <Route path="/" component={Home} />
    </BrowserRouter>
  );
}
```

```tsx
// Next.js (file-system routing - simpler)
// app/page.tsx automatically maps to '/' route
export default function Home() {
  return <div>Home Page</div>;
}
```

**Features:**
- 📁 **File-system routing**: `app/about/page.tsx` → `/about`
- ⚡ **App Router** (new): Better performance and SEO
- 🎨 **Built-in CSS support**: Tailwind CSS, CSS Modules

**Role in this project:**
- Renders AI Agent chat interface
- Manages frontend state (Zustand)
- Handles user interactions

**Key files:**
```
apps/web/
├── app/                   # Next.js 13+ App Router
│   ├── layout.tsx         # Global layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── floating-agent/    # AI Agent components
│       ├── ChatModal.tsx  # Chat window
│       ├── MessageList.tsx# Message list
│       └── ...
└── lib/                   # Utility libraries
    ├── api-client.ts      # API client
    └── store.ts           # State management (Zustand)
```

### 4. LangGraph.js (AI Workflow Engine)

**What is it?**
- Framework for building stateful AI applications
- Models AI conversation flow as a state machine

**Core concepts:**

```typescript
// Define state
interface AgentState {
  messages: Message[];        // Conversation history
  currentIntent: string;      // Current intent
  brandingInfo?: BrandingInfo;// Branding information
  recommendedProducts?: Product[];
}

// Define nodes (processing logic)
async function extractBrandingNode(state: AgentState) {
  // Extract branding information
  const branding = await extractBranding(state.messages);
  return { ...state, brandingInfo: branding };
}

// Define edges (routing logic)
function routeByIntent(state: AgentState): string {
  if (state.currentIntent === 'branded_merch') {
    return 'extractBranding';
  }
  return 'conversation';
}

// Build graph
const graph = new StateGraph<AgentState>()
  .addNode('welcome', welcomeNode)
  .addNode('classifyIntent', intentClassificationNode)
  .addNode('extractBranding', brandingExtractionNode)
  .addConditionalEdges('classifyIntent', routeByIntent)
  .compile();
```

**Role in this project:**
- Manages AI Agent conversation flow
- Routes to different processing nodes based on user intent
- Maintains conversation state and history

**Key files:**
```
packages/infrastructure/src/agent/
├── graph.ts               # Main LangGraph definition
├── types.ts               # State type definitions
└── nodes/                 # Processing nodes
    ├── welcomeNode.ts     # Welcome message
    ├── intentClassificationNode.ts  # Intent classification
    ├── brandingExtractionNode.ts    # Branding extraction
    ├── productRecommendationNode.ts # Product recommendation
    └── mockupGenerationNode.ts      # Mockup generation
```

---

## Project Structure

### Directory Tree Explanation

```
OEM_Agent/
├── 📁 apps/                    # Applications
│   ├── 📁 api/                 # Backend API (Hono)
│   │   ├── Dockerfile          # API containerization config
│   │   ├── package.json        # API dependencies
│   │   └── src/                # API source code
│   │       ├── index.ts        # Entry file
│   │       ├── routes/         # API routes
│   │       └── middleware/     # Middleware
│   │
│   └── 📁 web/                 # Frontend Web (Next.js)
│       ├── Dockerfile          # Web containerization config
│       ├── package.json        # Web dependencies
│       ├── app/                # Next.js App Router
│       ├── components/         # React components
│       └── lib/                # Utility libraries
│
├── 📁 packages/                # Shared packages (DDD architecture)
│   ├── 📁 domain/              # Domain layer (business entities)
│   │   └── src/
│   │       ├── entities/       # Entity classes
│   │       ├── value-objects/  # Value objects
│   │       └── repositories/   # Repository interfaces
│   │
│   ├── 📁 application/         # Application layer (use cases)
│   │   └── src/
│   │       ├── use-cases/      # Business use cases
│   │       ├── dtos/           # Data Transfer Objects
│   │       └── interfaces/     # Interface definitions
│   │
│   └── 📁 infrastructure/      # Infrastructure layer
│       └── src/
│           ├── agent/          # LangGraph Agent
│           ├── ai/             # AI services (OpenAI)
│           ├── database/       # Database connection
│           ├── repositories/   # Repository implementations
│           └── vector/         # Vector database (Weaviate)
│
├── 📁 Business/                # Business documentation
│   └── Feature/
│       └── Floated-AI-Agent/
│           ├── PRD_CURSOR.md   # ⚠️ PRD (DO NOT DELETE)
│           ├── PRD_GEMINI.md
│           └── PRD_HUMAN.md
│
├── 📁 docs/                    # Technical documentation
│   ├── INDEX.md                # Documentation index
│   ├── ARCHITECTURE.md         # Architecture explanation
│   ├── TechStack.md            # Tech stack
│   └── API_DOCUMENTATION.md    # API documentation
│
├── 📁 terraform/               # Infrastructure as Code
│   ├── main.tf                 # Terraform main config
│   ├── variables.tf            # Variable definitions
│   └── startup-script.sh       # GCP startup script
│
├── 📁 docker/                  # Docker configuration
│   └── mongo-init/
│       └── init.js             # MongoDB init script
│
├── docker-compose.yml          # Docker Compose config
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace config
├── .env                        # Environment variables (contains API keys)
└── README.md                   # Project readme
```

---

## Core Concepts

### 1. Domain-Driven Design (DDD)

**What is DDD?**
- A software design methodology that separates business logic from technical implementation
- Projects are organized by business domain rather than technical layers

**Three-layer architecture:**

```
┌─────────────────────────────────────┐
│    Domain Layer                      │
│  - Pure business logic, framework-agnostic │
│  - Entities, Value Objects           │
│  Example: Product, Price, BrandingInfo│
└─────────────────────────────────────┘
            ↓ depends on
┌─────────────────────────────────────┐
│  Application Layer                   │
│  - Business use cases                │
│  - Coordinates domain objects        │
│  Example: SendMessageUseCase         │
└─────────────────────────────────────┘
            ↓ depends on
┌─────────────────────────────────────┐
│ Infrastructure Layer                 │
│  - Technical implementation          │
│  - Implements domain interfaces      │
│  Example: MongoRepository, OpenAI    │
└─────────────────────────────────────┘
```

**Why use DDD?**
- ✅ **Independent business logic**: Not affected by framework changes
- ✅ **Highly testable**: Can test business logic in isolation
- ✅ **Maintainable**: Clear responsibilities, easy to understand

### 2. Monorepo

**What is a Monorepo?**
- Managing multiple related projects in a single Git repository
- Opposite of Polyrepo (one repository per project)

**Advantages:**
- ✅ **Easy code sharing**: Packages can be directly referenced by apps
- ✅ **Unified version management**: All projects use same dependency versions
- ✅ **Atomic commits**: Frontend and backend changes can be committed together

**Application in this project:**

```typescript
// apps/api/src/routes/agent.ts can directly reference
import { SendMessageUseCase } from '@repo/application';
import { Product } from '@repo/domain';
import { LangGraphAgentService } from '@repo/infrastructure';

// These packages are all in the same repository, linked via workspace mechanism
```

### 3. Server-Sent Events (SSE)

**What is SSE?**
- Technology for server to actively push data to client
- Similar to WebSocket but simpler (one-way communication)

**Why use SSE?**
- AI text generation is word-by-word (streaming response)
- Users can see AI thinking process in real-time

**Implementation example:**

```typescript
// Backend (Hono)
app.post('/api/chat', async (c) => {
  return streamSSE(c, async (stream) => {
    for await (const chunk of aiStream) {
      await stream.writeSSE({
        data: JSON.stringify({ type: 'token', text: chunk }),
      });
    }
  });
});

// Frontend (React)
const eventSource = new EventSource('/api/chat');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    setMessage(prev => prev + data.text);
  }
};
```

---

## Development Guide

### Requirements

- **Node.js**: v20+
- **pnpm**: v8.15.0+
- **Docker**: v20+
- **Docker Compose**: v2.20+

### Local Development Steps

#### 1. Clone Project

```bash
git clone <repository-url>
cd OEM_Agent
```

#### 2. Install Dependencies

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

#### 3. Configure Environment Variables

```bash
# Copy environment template
cp env.template .env

# Edit .env file, add your OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here
```

#### 4. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

#### 5. Access Application

- **Frontend Web**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

### Development Workflow

#### Modify Frontend Code

```bash
# 1. Edit files in apps/web/
# 2. Rebuild Web container
docker-compose build web
docker-compose up -d web
```

#### Modify Backend Code

```bash
# 1. Edit files in apps/api/
# 2. Rebuild API container
docker-compose build api
docker-compose up -d api
```

#### Modify Shared Packages

```bash
# 1. Edit files in packages/
# 2. Rebuild all dependent containers
docker-compose build --no-cache
docker-compose up -d
```

### Common Commands

```bash
# View all container status
docker-compose ps

# View specific container logs
docker logs -f oem_agent-api-1
docker logs -f oem_agent-web-1

# Enter container for debugging
docker exec -it oem_agent-api-1 sh

# Stop all services
docker-compose down

# Clean all data (including database)
docker-compose down --volumes
```

---

## Deployment Guide

See [Terraform Deployment Guide](./TERRAFORM_DEPLOYMENT_EN.md)

---

## FAQ

### Q1: Why use pnpm instead of npm/yarn?

**A:** pnpm advantages:
- 🚀 **Faster**: Uses hard links, faster installation
- 💾 **Saves space**: All projects share dependency cache
- 🔒 **Stricter**: Avoids phantom dependencies

### Q2: Why use Docker?

**A:** Docker advantages:
- ✅ **Environment consistency**: Dev, test, prod environments are identical
- ✅ **Isolation**: Each service runs independently
- ✅ **Easy deployment**: One-click start all services

### Q3: What's the difference between LangGraph and regular if-else?

**A:** LangGraph advantages:
- ✅ **Visualizable**: Can represent conversation flow graphically
- ✅ **State management**: Automatically manages conversation state and history
- ✅ **Extensible**: Easy to add new conversation branches

Comparison:

```typescript
// Regular if-else (hard to maintain)
if (intent === 'branding') {
  if (hasBranding) {
    if (confirmed) {
      recommendProducts();
    }
  } else {
    extractBranding();
  }
}

// LangGraph (clear and understandable)
graph
  .addNode('extractBranding', extractBrandingNode)
  .addNode('recommendProducts', recommendProductsNode)
  .addConditionalEdges('extractBranding', (state) => 
    state.brandingConfirmed ? 'recommendProducts' : 'wait'
  );
```

---

## Next Steps

- 📖 Read [LangGraph Detailed Guide](./LANGGRAPH_GUIDE_EN.md)
- 🚀 Check [API Documentation](./API_DOCUMENTATION.md)
- 🏗️ Learn [Architecture Design](./ARCHITECTURE.md)
- ☁️ Deploy to [GCP](./TERRAFORM_DEPLOYMENT_EN.md)

---

**Documentation Maintainer:** AI Cursor  
**Last Updated:** 2026-01-23  
**Feedback:** Please create a GitHub Issue if you have questions

