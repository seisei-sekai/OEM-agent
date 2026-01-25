# Documentation Index

**Created:** 2026-01-23-07-45 (Tokyo Time)  
**Last Updated:** 2026-01-25-21-56 (Tokyo Time)  
**Purpose:** Central index for all project documentation

---

## 📚 Documentation Overview

Essential documentation for the OEM Agent project, organized by topic.

### Core Documentation

#### [ARCHITECTURE.md](./ARCHITECTURE.md)
System architecture and design patterns following Domain-Driven Design (DDD) principles.
- Architecture overview
- Domain layer structure
- Application layer patterns
- Infrastructure implementations
- Technology stack decisions

#### [TechStack.md](./TechStack.md)
Complete technology stack and tooling used in the project.
- Frontend technologies (Next.js, React, TypeScript)
- Backend technologies (Hono, Node.js)
- AI/ML technologies (LangGraph, OpenAI)
- Database and infrastructure
- Development tools

---

### API & Configuration

#### [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
RESTful API endpoints and usage examples.
- Health check endpoints
- Agent chat endpoints
- Branding extraction endpoints
- Product recommendation endpoints
- Request/response schemas

#### [API_KEYS.md](./API_KEYS.md)
Secure configuration guide for API keys and credentials.
- OpenAI API configuration
- MongoDB connection strings
- Weaviate vector database
- Environment variable setup
- Security best practices

---

### Beginner Guides

#### [PROJECT_GUIDE_CN.md](./PROJECT_GUIDE_CN.md) 🌟 BEGINNER FRIENDLY
Complete project guide for beginners with React/Flask experience (Chinese).
- Project overview and core features
- Detailed tech stack explanation (Turborepo, Hono, Next.js, LangGraph)
- Complete project structure walkthrough
- Core concepts (DDD, Monorepo, SSE)
- Development guide with step-by-step instructions
- FAQ and troubleshooting

#### [PROJECT_GUIDE_EN.md](./PROJECT_GUIDE_EN.md) 🌟 BEGINNER FRIENDLY
Complete project guide for beginners with React/Flask experience (English).
- Same comprehensive content as Chinese version
- Suitable for international developers
- Clear explanations of all technologies used

---

### LangGraph Deep Dive

#### [LANGGRAPH_GUIDE_CN.md](./LANGGRAPH_GUIDE_CN.md) 🧠 AI AGENT
Comprehensive LangGraph implementation guide (Chinese).
- What is LangGraph and why use it
- Core concepts (State, Node, Edge, Channel)
- Complete conversation flow diagrams
- Real-world examples from this project
- How to add new nodes and modify flows
- Debugging and testing strategies
- Best practices and common patterns

#### [LANGGRAPH_GUIDE_EN.md](./LANGGRAPH_GUIDE_EN.md) 🧠 AI AGENT
Comprehensive LangGraph implementation guide (English).
- Same in-depth content as Chinese version
- Step-by-step modification examples
- Complete code samples

---

### Development & Docker

#### [DOCKER_SETUP.md](./DOCKER_SETUP.md)
Complete Docker and Docker Compose guide.
- Container architecture
- Port configuration
- Quick start guide
- Development workflow
- Service details (Web, API, MongoDB, Weaviate)
- Common operations and troubleshooting
- Production deployment considerations

#### [DOCKER_TYPESCRIPT_PITFALLS.md](./DOCKER_TYPESCRIPT_PITFALLS.md) ⚠️ CRITICAL
Essential guide for avoiding TypeScript compilation issues in Docker.
- Why code changes don't appear in containers
- How to diagnose stale compilation cache
- Prevention and recovery procedures
- Never suppress build errors with `|| echo`

---

### Production Deployment

#### [TERRAFORM_DEPLOYMENT_CN.md](./TERRAFORM_DEPLOYMENT_CN.md) ☁️ GCP DEPLOYMENT
Complete Terraform GCP deployment guide (Chinese).
- Prerequisites and GCP project setup
- Step-by-step Terraform configuration
- Complete deployment walkthrough
- Verification and testing procedures
- Management and maintenance commands
- Cost optimization strategies
- Production best practices

#### [TERRAFORM_DEPLOYMENT_EN.md](./TERRAFORM_DEPLOYMENT_EN.md) ☁️ GCP DEPLOYMENT
Complete Terraform GCP deployment guide (English).
- Same comprehensive deployment steps as Chinese version
- Suitable for international teams
- Includes troubleshooting and cost optimization

---

## 🚀 Quick Start

1. **New Developers**: Start with [PROJECT_GUIDE_CN.md](./PROJECT_GUIDE_CN.md) or [PROJECT_GUIDE_EN.md](./PROJECT_GUIDE_EN.md)
2. **Understanding Architecture**: Read [ARCHITECTURE.md](./ARCHITECTURE.md) and [TechStack.md](./TechStack.md)
3. **API Integration**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) and [API_KEYS.md](./API_KEYS.md)
4. **Local Development**: Follow [DOCKER_SETUP.md](./DOCKER_SETUP.md)
5. **Understanding AI Agent**: Read [LANGGRAPH_GUIDE_CN.md](./LANGGRAPH_GUIDE_CN.md) or [LANGGRAPH_GUIDE_EN.md](./LANGGRAPH_GUIDE_EN.md)
6. **Production Deployment**: Follow [TERRAFORM_DEPLOYMENT_CN.md](./TERRAFORM_DEPLOYMENT_CN.md) or [TERRAFORM_DEPLOYMENT_EN.md](./TERRAFORM_DEPLOYMENT_EN.md)

---

## 📊 Project Status

- **Architecture**: Domain-Driven Design (DDD) ✅
- **Tech Stack**: Modern TypeScript monorepo ✅
- **API**: RESTful with streaming support ✅
- **AI Agent**: LangGraph + OpenAI integration ✅
- **Deployment**: Docker + Terraform (GCP) ✅

---

## 🔄 Documentation Maintenance

All documentation files follow the standard format:
```markdown
# Title
**Created:** YYYY-MM-DD-HH-MM (Tokyo Time)
**Last Updated:** YYYY-MM-DD-HH-MM (Tokyo Time)
**Purpose:** Brief description
```

When updating documentation:
1. Update the "Last Updated" timestamp
2. Keep content concise and focused
3. Update this index if adding new files

---

## 📝 Contributing

When adding new documentation:
1. Follow the established format
2. Place in `/docs` directory (not root)
3. Update this INDEX.md file
4. Use clear, concise language
5. Include code examples where appropriate
