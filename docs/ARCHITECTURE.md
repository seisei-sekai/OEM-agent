# Architecture Documentation

**Created:** 2026-01-23
**Last Updated:** 2026-01-23
**Purpose:** Deep dive into system architecture and design decisions

---

## Overview

OEM Agent is built using **Clean Architecture** and **Domain-Driven Design (DDD)** principles to ensure:

- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Easy to mock external dependencies
- **Flexibility**: Can swap databases, frameworks without affecting business logic
- **Maintainability**: Clear dependency rules and structure

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Floating   │  │     Chat     │  │   Product    │      │
│  │    Button    │  │    Modal     │  │     Grid     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/SSE
┌────────────────────────┴────────────────────────────────────┐
│                      Hono API Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Agent   │  │ Sessions │  │ Products │  │ Branding │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ DI Container
┌────────────────────────┴────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │    Use Cases     │  │   Interfaces     │                │
│  └──────────────────┘  └──────────────────┘                │
└────────┬────────────────────────┬───────────────────────────┘
         │                        │
┌────────┴────────────┐  ┌────────┴──────────────────────────┐
│   Domain Layer      │  │    Infrastructure Layer           │
│  ┌────────┐         │  │  ┌─────────┐  ┌─────────┐        │
│  │Entities│         │  │  │LangGraph│  │ MongoDB │        │
│  │ Values │         │  │  │ Agent   │  │ Repos   │        │
│  └────────┘         │  │  └─────────┘  └─────────┘        │
└─────────────────────┘  │  ┌─────────┐  ┌─────────┐        │
                         │  │Weaviate │  │ OpenAI  │        │
                         │  │ Vector  │  │ Service │        │
                         │  └─────────┘  └─────────┘        │
                         └───────────────────────────────────┘
```

---

## Layer Breakdown

### 1. Domain Layer (`packages/domain`)

**Purpose:** Pure business logic, no external dependencies

**Contains:**

- **Entities**: Core business objects (ChatSession, Message, Product, BrandingInfo)
- **Value Objects**: Immutable, validated types (Price, ColorCode, LogoImage)
- **Repository Interfaces**: Data access contracts
- **Domain Services**: Business logic that doesn't fit in entities
- **Domain Events**: Business events for event sourcing

**Rules:**

- ✅ Can use: zod, date-fns, uuid
- ❌ Cannot use: react, hono, mongodb, langchain, openai
- ✅ Contains only pure TypeScript classes/types
- ✅ Zero coupling to infrastructure

**Example - Entity:**

```typescript
export class ChatSession {
  private constructor(
    private readonly id: SessionId,
    private title: string,
    private messageCount: number
  ) {}

  static create(): ChatSession {
    return new ChatSession(
      SessionId.create(),
      'New conversation',
      0
    );
  }

  incrementMessageCount(): void {
    this.messageCount++;
  }
}
```

---

### 2. Application Layer (`packages/application`)

**Purpose:** Orchestrate business logic, define use cases

**Contains:**

- **Use Cases**: Business operations (SendMessageUseCase, RecommendProductsUseCase)
- **Interfaces**: Contracts for infrastructure (IAgentService, IBrandingExtractor)
- **DTOs**: Data transfer objects with Zod validation
- **Mappers**: Convert between domains and DTOs

**Rules:**

- ✅ Can reference: Domain layer only
- ❌ Cannot reference: Infrastructure, API, Frontend
- ✅ Defines interfaces, infrastructure implements them
- ✅ Uses Dependency Injection

**Example - Use Case:**

```typescript
export class SendMessageUseCase {
  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly agentService: IAgentService
  ) {}

  async execute(dto: SendMessageDTO): AsyncIterable<AgentStreamEvent> {
    const session = await this.sessionRepository.findById(dto.sessionId);
    const userMessage = Message.create({ ...dto });
    await this.sessionRepository.saveMessage(userMessage);
    
    return this.agentService.chat(dto.sessionId, messages, dto.context);
  }
}
```

---

### 3. Infrastructure Layer (`packages/infrastructure`)

**Purpose:** Implement application interfaces with external technologies

**Contains:**

- **LangGraph Agent**: State machine implementation
- **MongoDB Repositories**: Database access
- **Weaviate Search**: Vector search implementation
- **OpenAI Services**: AI integrations
- **Branding Extractor**: Web scraping and vision AI

**Rules:**

- ✅ Implements application interfaces
- ✅ Can use any external libraries
- ✅ Handles all side effects (DB, API calls)
- ✅ Injects dependencies via constructors

**Example - Repository:**

```typescript
export class MongoChatSessionRepository implements IChatSessionRepository {
  async save(session: ChatSession): Promise<void> {
    const data = session.toJSON();
    await getDB().collection('chat_sessions').updateOne(
      { id: data.id },
      { $set: data },
      { upsert: true }
    );
  }
}
```

---

### 4. API Layer (`apps/api`)

**Purpose:** HTTP interface, request/response handling

**Contains:**

- **Routes**: Endpoint definitions
- **Middleware**: CORS, logging, error handling
- **DI Container**: Dependency injection setup
- **SSE Streaming**: Real-time communication

**Rules:**

- ✅ Uses Hono framework
- ✅ Validates requests with Zod
- ✅ Streams responses with SSE
- ✅ Thin controllers, delegate to use cases

**Example - Route:**

```typescript
agentRoute.post('/chat', async (c) => {
  const dto = SendMessageDTOSchema.parse(await c.req.json());
  const useCase = container.resolve<ISendMessageUseCase>('ISendMessageUseCase');

  return streamSSE(c, async (stream) => {
    for await (const event of await useCase.execute(dto)) {
      await stream.writeSSE({ data: JSON.stringify(event) });
    }
  });
});
```

---

### 5. Frontend Layer (`apps/web`)

**Purpose:** User interface and client-side state

**Contains:**

- **Components**: React components (FloatingButton, ChatModal)
- **Hooks**: Custom hooks (useAgent, useSSE)
- **State**: Zustand store
- **API Client**: HTTP client for backend

**Rules:**

- ✅ Uses Next.js App Router
- ✅ Server Components by default
- ✅ Client Components with 'use client'
- ❌ No direct database access
- ✅ All data via API

---

## LangGraph Agent Architecture

### State Machine

```
START
  ↓
Welcome Node
  ↓
Classify Intent Node
  ↓
  ├─ branded_merch → Branding Extraction Node → Product Recommendation Node
  ├─ custom → Product Recommendation Node
  ├─ general → Conversation Node
  └─ track_order → Conversation Node
  ↓
END
```

### Dependency Injection in Nodes

**Pattern:** Pass use cases via `config.configurable`

```typescript
async function brandingExtractionNode(
  state: AgentState,
  config?: RunnableConfig
) {
  const deps = config?.configurable as AgentDependencies;
  const result = await deps.extractBrandingUseCase.execute({...});
  return { brandingInfo: result };
}
```

**Benefits:**

- Testable: Easy to mock use cases
- Flexible: Swap implementations without changing nodes
- Clean: No direct imports in nodes

---

## Data Flow

### Message Send Flow

```
User types message
  ↓
Frontend (ChatInput component)
  ↓
API Client (SSE request)
  ↓
Hono Route (POST /api/agent/chat)
  ↓
SendMessageUseCase
  ↓
  ├─ Save user message (MongoDB)
  ├─ Get chat history (MongoDB)
  └─ Stream agent response (LangGraph)
     ↓
     ├─ Classify intent (OpenAI)
     ├─ Extract branding (if URL)
     ├─ Recommend products (Weaviate)
     └─ Generate response (OpenAI)
  ↓
Stream events back to frontend (SSE)
  ↓
Update UI in real-time
```

### Product Recommendation Flow

```
User requests products
  ↓
RecommendProductsUseCase
  ↓
  ├─ Check for branding context
  ├─ Build semantic query
  └─ Search Weaviate vector DB
  ↓
Get embeddings from OpenAI
  ↓
Find similar products
  ↓
Apply filters (category, price, quantity)
  ↓
Return ranked products
```

---

## Database Schema

### MongoDB Collections

**chat_sessions:**

```javascript
{
  _id: ObjectId,
  id: "uuid",
  userId: "user_123",
  title: "Branded merchandise inquiry",
  createdAt: ISODate,
  updatedAt: ISODate,
  messageCount: 15,
  context: { pageType: "catalog", ... }
}
```

**messages:**

```javascript
{
  _id: ObjectId,
  id: "uuid",
  sessionId: "session_uuid",
  role: "user" | "agent",
  content: "message text",
  timestamp: ISODate,
  metadata: { ... }
}
```

**products:**

```javascript
{
  _id: ObjectId,
  id: "prod_001",
  name: "Baseball Cap",
  description: "...",
  category: "apparel",
  priceFrom: { amount: 5.77, currency: "USD" },
  minQuantity: 20,
  colors: [...],
  specs: { ... }
}
```

**branding_info:**

```javascript
{
  _id: ObjectId,
  id: "uuid",
  sessionId: "session_uuid",
  companyName: "Example Corp",
  logos: [...],
  colors: ["#6366F1"],
  extractedAt: ISODate,
  method: "url_scraping"
}
```

### Weaviate Schema

**Product Class:**

```graphql
{
  class: "Product"
  properties: [
    { name: "name", dataType: ["string"] }
    { name: "description", dataType: ["string"] }
    { name: "category", dataType: ["string"] }
  ]
  vectorizer: "text2vec-transformers"
}
```

---

## Design Decisions

### Why LangGraph.js over LangChain?

- ✅ Explicit state management
- ✅ Better for complex, stateful conversations
- ✅ Conditional edges for dynamic routing
- ✅ Easier debugging and testing

### Why Hono over Express/Fastify?

- ✅ 10x faster than Express
- ✅ Better TypeScript support
- ✅ SSE streaming built-in
- ✅ Works on edge (Cloudflare Workers)
- ✅ Smaller bundle size

### Why MongoDB + Weaviate?

- MongoDB: Flexible schema, great for chat data
- Weaviate: Semantic search for products
- Best of both worlds: CRUD + vector search
- Could consolidate later if needed

### Why Clean Architecture?

- ✅ Testable: Mock external dependencies
- ✅ Flexible: Swap frameworks/databases
- ✅ Maintainable: Clear structure
- ✅ Scalable: Easy to add features

---

## Performance Considerations

### Caching Strategy

- **API Level**: Cache product recommendations (5 min TTL)
- **Database Level**: MongoDB indexes on frequent queries
- **Frontend Level**: React Query for server state caching

### Optimization Techniques

- **Code Splitting**: Lazy load chat modal
- **Image Optimization**: Next.js Image component
- **Connection Pooling**: MongoDB connection reuse
- **Request Batching**: Batch product queries

---

## Security

### API Security

- Rate limiting per endpoint
- Input validation with Zod
- SQL/NoSQL injection prevention
- CORS configuration

### Data Security

- MongoDB authentication
- Environment variables for secrets
- No sensitive data in logs
- HTTPS in production

---

## Scalability

### Horizontal Scaling

- Stateless API (can run multiple instances)
- Session data in MongoDB (shared state)
- Load balancer in front of API

### Vertical Scaling

- Increase VM resources
- Optimize database queries
- Add read replicas

---

## Monitoring & Observability

### Logging

- Structured JSON logs
- Request/response logging
- Error tracking with context

### Metrics

- API response times
- Database query performance
- Agent conversation success rate
- Product recommendation accuracy

---

## Testing Strategy

### Unit Tests

- Domain entities and value objects
- Use case business logic
- Utility functions

### Integration Tests

- Repository database operations
- Agent node execution
- API endpoint responses

### E2E Tests

- Complete user flows
- Chat conversations
- Product recommendations

---

## Future Architecture Considerations

### Microservices

Split into services:
- Chat Service (sessions, messages)
- Product Service (catalog, recommendations)
- Agent Service (LangGraph orchestration)
- Branding Service (extraction, mockups)

### Event Sourcing

- Store all domain events
- Rebuild state from events
- Enable time-travel debugging

### CQRS

- Separate read and write models
- Optimize queries separately
- Better scalability

---

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Hono Documentation](https://hono.dev)



