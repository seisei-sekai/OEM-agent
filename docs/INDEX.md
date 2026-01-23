# Documentation Index

**Created:** 2026-01-23-07-45 (Tokyo Time)  
**Last Updated:** 2026-01-23-18-30 (Tokyo Time)  
**Purpose:** Central index for all project documentation

---

## 📚 Documentation Overview

This directory contains comprehensive documentation for the OEM Agent project, organized by topic.

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

### API & Integration

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

### Development

#### [TEST_REPORT.md](./TEST_REPORT.md)
Comprehensive test suite implementation and results.
- Test coverage summary (97 tests passing)
- Domain layer tests (66 tests)
- Application layer tests (20 tests)
- Infrastructure layer tests (11 tests)
- Bug fixes and improvements
- Testing best practices
- Next steps for testing

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

#### [LANGGRAPH_GUIDE_CN.md](./LANGGRAPH_GUIDE_CN.md) 🧠 AI AGENT DEEP DIVE
Comprehensive LangGraph implementation guide (Chinese).
- What is LangGraph and why use it
- Core concepts (State, Node, Edge, Channel)
- Complete conversation flow diagrams
- Real-world examples from this project
- How to add new nodes and modify flows
- Debugging and testing strategies
- Best practices and common patterns

#### [LANGGRAPH_GUIDE_EN.md](./LANGGRAPH_GUIDE_EN.md) 🧠 AI AGENT DEEP DIVE
Comprehensive LangGraph implementation guide (English).
- Same in-depth content as Chinese version
- Step-by-step modification examples
- Complete code samples

#### [DOCKER_TYPESCRIPT_PITFALLS.md](./DOCKER_TYPESCRIPT_PITFALLS.md) ⚠️ CRITICAL
Essential guide for avoiding TypeScript compilation issues in Docker.
- Why code changes don't appear in containers
- How to diagnose stale compilation cache
- Prevention and recovery procedures
- Never suppress build errors with `|| echo`

#### [LANGGRAPH_DEBUGGING_GUIDE.md](./LANGGRAPH_DEBUGGING_GUIDE.md)
Debugging guide for LangGraph agents in production.
- Debugging layers (Infrastructure, Application, Interface)
- Essential debugging tools and techniques
- Common issues and solutions

#### [BUG_FIX_SUMMARY.md](./BUG_FIX_SUMMARY.md)
Analysis and fix for branding confirmation bug.
- Root cause analysis (state channel persistence)
- DDD principles applied in solution
- Context persistence implementation

#### [BUG_FIX_CHAT_STREAMING.md](./BUG_FIX_CHAT_STREAMING.md)
Bug fix documentation for chat streaming issues.
- Frontend message display bug and fix
- SSE buffer handling improvements
- LangGraph token streaming implementation

#### [TERRAFORM_DEPLOYMENT_CN.md](./TERRAFORM_DEPLOYMENT_CN.md) ☁️ PRODUCTION DEPLOYMENT
Complete Terraform GCP deployment guide (Chinese).
- Prerequisites and GCP project setup
- Step-by-step Terraform configuration
- Complete deployment walkthrough
- Verification and testing procedures
- Management and maintenance commands
- Cost optimization strategies
- Production best practices

#### [TERRAFORM_DEPLOYMENT_EN.md](./TERRAFORM_DEPLOYMENT_EN.md) ☁️ PRODUCTION DEPLOYMENT
Complete Terraform GCP deployment guide (English).
- Same comprehensive deployment steps as Chinese version
- Suitable for international teams
- Includes troubleshooting and cost optimization

#### [DEPLOYMENT.md](./DEPLOYMENT.md)
General deployment guides and infrastructure setup.
- Local development setup
- Docker containerization overview
- Environment configuration basics

#### [DOCKER_SETUP.md](./DOCKER_SETUP.md)
Complete Docker and Docker Compose guide.
- Container architecture
- Port configuration (different from other projects)
- Quick start guide
- Development workflow
- Service details (Web, API, MongoDB, Weaviate)
- Common operations and troubleshooting
- Production deployment considerations

#### [PORT_CONFIGURATION.md](./PORT_CONFIGURATION.md) ✨ NEW
Centralized port configuration and routing documentation.
- Standard port assignments (Web:3000, API:4000)
- Environment-specific configurations (Local, Docker, Production)
- Routing architecture and request flows
- Port conflict prevention strategies
- Troubleshooting guide
- Validation checklist

#### [PORT_QUICK_REFERENCE.md](./PORT_QUICK_REFERENCE.md) ✨ NEW
One-page quick reference card for developers.
- Standard ports at a glance
- Quick commands and URLs
- Environment variables by environment
- Troubleshooting snippets
- Pre-deployment checklist

#### [PORT_ROUTING_DIAGRAM.md](./PORT_ROUTING_DIAGRAM.md) ✨ NEW
Visual representation of port routing and network architecture.
- Architecture overview diagrams
- Docker network architecture (external/internal)
- Production (GCP) network architecture
- Request flow diagrams
- Port mapping tables
- Network security zones
- Debugging port issues

#### [PORT_AUDIT_REPORT.md](./PORT_AUDIT_REPORT.md) ✨ NEW
Complete audit report of port configuration remediation.
- Issues identified and fixed (4 critical, 2 warnings)
- Before/after validation results
- Best practices implemented
- Risk assessment
- Testing checklist
- Continuous validation procedures

---

## 🚀 Quick Start

1. **For Developers**: Start with [ARCHITECTURE.md](./ARCHITECTURE.md) and [TechStack.md](./TechStack.md)
2. **For API Integration**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) and [API_KEYS.md](./API_KEYS.md)
3. **For Testing**: Check [TEST_REPORT.md](./TEST_REPORT.md)
4. **For Deployment**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
5. **For Port Configuration**: See [PORT_CONFIGURATION.md](./PORT_CONFIGURATION.md) and [PORT_ROUTING_DIAGRAM.md](./PORT_ROUTING_DIAGRAM.md)

---

## 📊 Project Status

- **Test Coverage**: 97 tests, 100% passing ✅
- **Architecture**: Domain-Driven Design (DDD) ✅
- **Tech Stack**: Modern TypeScript monorepo ✅
- **API**: RESTful with streaming support ✅
- **AI Agent**: LangGraph + OpenAI integration ✅

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
2. Add changelog entry if significant changes
3. Keep content concise and focused
4. Update this index if adding new files

---

## 📝 Contributing

When adding new documentation:
1. Follow the established format
2. Place in `/docs` directory (not root)
3. Update this INDEX.md file
4. Use clear, concise language
5. Include code examples where appropriate

