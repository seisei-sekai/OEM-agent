
# Tech Stack Overview

**Created:** 2024-06-12-01-00 (Tokyo Time)  
**Last Updated:** 2024-06-12-01-00 (Tokyo Time)  
**Purpose:** Summarize project technology stack and best-practice targets

---

## Core Architecture Principles

- Domain-Driven Design (DDD)
- Dependency Injection (DI)
- Clean Architecture
- Service-Oriented Architecture (SOA)

## Tooling & Languages

- **TypeScript** (shared throughout)
- Turborepo (monorepo management)
- Next.js (UI, SSR, App Router)
- Hono (API gateway/interface layer)
- LangGraph.js (agent orchestration/state machine)
- MongoDB (primary database)
- Weaviate (vector search/semantic storage)
- GCP (infrastructure/cloud)
- Terraform (infrastructure-as-code)
- Docker (containerization)
- Git (version control)
- OpenAI Service (only API-allowed service, use the cheapest model please， and use the chatgpt image generation if needed)

## Development Recommendations

- Prioritize full local development and testing for all services (mock cloud where possible)
- Automate builds and infrastructure provisioning via CI/CD pipelines
