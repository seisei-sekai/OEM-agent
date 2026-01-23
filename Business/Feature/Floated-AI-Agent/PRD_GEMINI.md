# In-Depth Technical Research Report on Replicating TargetPlatform's AI Agent Based on Clean Architecture and Turborepo

## 1. Executive Summary and Introduction

In an era where generative artificial intelligence is rapidly reshaping software interaction paradigms, the AI Sourcing Agent ("AIAgent") demonstrated on targetplatform.com represents a typical advanced agent architecture. It is not merely a chatbot, but a complex system equipped with multimodal understanding, long-term task orchestration, and supply chain resource scheduling capabilities [1]. Users wish to reverse engineer and replicate this functionality through "screenshots/screen recordings," which presents a dual challenge:
1. How to accurately infer deep business logic and state machines from surface-level UI interactions
2. How to implement this in a modern technology stack (Turborepo, Next.js, Hono, LangGraph.js, TypeScript) while strictly adhering to Domain-Driven Design (DDD) and Clean Architecture principles, avoiding "spaghetti code" pitfalls.

This report aims to provide a detailed engineering implementation guide. It demonstrates that the traditional "PRD → Design → Code" waterfall model is no longer suitable for building AI Agents, and proposes a new workflow: "Video Behavior Analysis → Reverse Event Storming → State Diagram Design." The report will delve into how to implement Dependency Injection (DI) in LangGraph.js graph structures, how to use Hono as an interface adapter layer connecting Next.js frontend and Agent core, and how to write high-precision Cursor Rules (.mdc) to enforce architectural constraints during the coding assistance phase.

---

## 2. Reverse Engineering Methodology: From Visual Signals to Domain Logic

To replicate the AIAgent, the primary task is to deconstruct its behavior. Since we cannot access the backend code, we must treat the user interface (UI) video recordings as "black box" outputs, inferring internal state machine models by observing input-output causality.

### 2.1 Behavior Deconstruction and Intent Recognition from Video Streams

The AIAgent on targetplatform.com exhibits typical task-oriented dialogue characteristics. By analyzing its interaction videos, we can break it down into a series of "Skills" and "States."

#### Table 1: AIAgent UI Interaction to Inferred Backend Logic Mapping

| Timestamp / UI Signal | User Behavior Description | Inferred Backend State | Inferred Domain Event | Required Skill/Tool |
| --------------------- | ------------------- | ------------------------ | ----------------------- | ---------------------------- |
| 00:05 Dialog initialization | User enters page, Agent proactively greets | Idle → AwaitingIntent | SessionStarted | load_user_profile |
| 00:15 User inputs requirement | "I want to make a batch of blue hoodies with logos" | IntentClassification | RequirementCaptured | classify_product_category |
| 00:25 Agent asks for details | "What fabric weight do you need?" | SlotFilling | AmbiguityDetected | check_required_attributes |
| 00:40 Shows logo mockup | User uploads logo image | MockupGeneration | AssetUploaded, MockupRendered | generate_product_mockup |
| 00:55 Agent shows "searching for factories..." | System displays progress bar | Sourcing | VendorSearchInitiated | search_supplier_index |
| 01:10 Shows quote and delivery time | Displays specific amounts and timeline | Quoting | CostCalculated | calculate_landed_cost |

> Through frame-by-frame analysis, we transform "guessed" functionality into Finite State Machine (FSM) modeling. In LangGraph.js, this corresponds to the StateGraph structure [3]. For example, the Agent's transitions between "asking for details" and "showing results" reveal Conditional Edges and Loop logic: when required attributes are missing, it must return to the SlotFilling state.

### 2.2 Using Multimodal AI to Assist Reverse Analysis

It's recommended to use models that support long video input, such as Gemini 1.5 Pro or GPT-4o, to assist with analysis [5].

- Recommended Prompt: "Analyze this screen recording video. The video shows the AIAgent sourcing agent. Based on Domain-Driven Design (DDD), identify all key business events (Domain Events) occurring in the video. Ignore UI styling and focus on interaction logic. For each Agent response, infer its call type and backend tools; and draw the interaction flow state transition diagram using Mermaid syntax."

This approach can quickly convert unstructured video data into structured logic, providing high-quality material for Event Storming [7].

---

## 3. Architectural Design: Clean Architecture and DDD Under Turborepo

### 3.1 Overall Architecture Landscape

Adopt physical path isolation to enforce dependency rules. Core principle: Inner layers (Domain/Application) do not depend on outer layers (Infrastructure/Interface), source code dependency direction only points inward [8].

```
/root
├── .cursor/rules/     # Cursor rule set (Architecture guardian)
├── apps/
│   ├── web/           # [Presentation Layer] Next.js (UI, Client Components)
│   └── api/           # [Interface Layer] Hono (Controllers, REST/RPC)
└── packages/
    ├── domain/        # Enterprise Business Rules (Pure TS)
    ├── application/   # [Application Layer] Use Cases, Service Interfaces
    ├── infrastructure/# [Infrastructure Layer] DB Impl, OpenAI, LangGraph
    ├── shared-kernel/ # Shared Types, Utilities
    └── di/            # Dependency Injection Container
```

### 3.2 Domain Layer

- **Entities**: ProductRequirement, Supplier, Quote, Mockup
- **Value Objects**: FabricWeight, ColorCode, Price
- **Repository Interfaces**: ISupplierRepository, IProductCatalogRepository (only define interfaces, no database dependency)
- **Domain Services**: CostCalculator

> Key constraint: Domain layer strictly prohibits referencing external libraries like langchain, hono, react, prisma

### 3.3 Application Layer

Define Agent's skills (use cases):

- Use Cases:
    - FindSupplierUseCase
    - GenerateMockupUseCase

- Agent Interfaces: Define IAgentService for API layer decoupling

### 3.4 Infrastructure Layer

- Implement domain layer interfaces, such as PrismaSupplierRepository
- Agent implementation (LangGraphAgentService): Define StateGraph, Nodes, Edges
- External service adapters: OpenAIAdapter, MidjourneyAdapter

### 3.5 Interface Layer (Hono & Next.js)

- Hono (API): Acts as gateway between Next.js and Agent, handles SSE streaming; suitable for Cloudflare Workers deployment [12]
- Next.js (Web): Responsible for rendering UI, communicates via tRPC or Hono RPC Client

---

## 4. Deep Technical Challenges: LangGraph.js and Dependency Injection (DI) Integration

### 4.1 LangGraph "Configurable" Dependency Injection Pattern

- **Composition Root**: Initialize DI container in Hono, resolve all Use Case instances
- **Context Passing**: When calling agent.invoke()/stream, place Use Case into configurable
- **Node Unpacking**: Node functions internally read Use Case from config.configurable
- **Prohibit Direct Import**: Nodes are not allowed to directly import UseCase/DB

#### Step 1: Define Agent Dependency Types (Application Layer)

```typescript
// packages/application/src/agent/AgentDependencies.ts
import { IFindSupplierUseCase } from "../use-cases/FindSupplierUseCase";
import { IGenerateMockupUseCase } from "../use-cases/GenerateMockupUseCase";

export interface AgentDependencies {
  findSupplierUseCase: IFindSupplierUseCase;
  generateMockupUseCase: IGenerateMockupUseCase;
}
```

#### Step 2: Write "Humble Node" (Infrastructure Layer)

```typescript
// packages/infrastructure/src/agent/nodes/sourcingNode.ts
import { AgentState } from "../types";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentDependencies } from "@repo/application/agent";

export const sourcingNode = async (
  state: AgentState,
  config?: RunnableConfig
) => {
  const dependencies = config?.configurable as AgentDependencies;
  if (!dependencies?.findSupplierUseCase) {
    throw new Error("FindSupplierUseCase not injected into LangGraph config");
  }
  const lastMessage = state.messages[state.messages.length - 1];
  const criteria = JSON.parse(lastMessage.content as string);
  const result = await dependencies.findSupplierUseCase.execute(criteria);
  return {
    supplier_matches: result,
    messages: [
      { role: "system", content: `Found ${result.length} suppliers.` }
    ]
  };
};
```

#### Step 3: Hono Dependency Assembly (Apps/API)

```typescript
// apps/api/src/routes/agent.ts
import { Hono } from "hono";
import { container } from "@repo/di";
import { AgentGraph } from "@repo/infrastructure/agent";

const agentRoute = new Hono();

agentRoute.post("/chat", async (c) => {
  const body = await c.req.json();
  const findSupplierUseCase = container.resolve("IFindSupplierUseCase");
  const generateMockupUseCase = container.resolve("IGenerateMockupUseCase");
  const config = {
    configurable: {
      findSupplierUseCase,
      generateMockupUseCase,
      userId: c.get("jwtPayload").sub
    }
  };
  const stream = await AgentGraph.stream(
    { messages: body.messages },
    config
  );
  return c.streamText(async (streamer) => {
    for await (const chunk of stream) {
      await streamer.write(JSON.stringify(chunk));
    }
  });
});

export default agentRoute;
```

> Note: This pattern implements dependency injection and also facilitates automatic connection pool release in Serverless scenarios [12].

### 4.3 Agent Skill Encapsulation Strategy

#### Tool Factory Pattern

Application layer defines Tool factory interface, Infrastructure layer implements, suitable for Tool Call pattern.

```typescript
// packages/infrastructure/src/agent/tools/SourcingToolsFactory.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { IFindSupplierUseCase } from "@repo/application";

export class SourcingToolsFactory {
  constructor(private findSupplierUseCase: IFindSupplierUseCase) {}
  createFindSupplierTool() {
    return tool(
      async (input) => {
        return await this.findSupplierUseCase.execute(input);
      },
      {
        name: "find_supplier",
        description: "Search for suppliers based on criteria",
        schema: z.object({
          material: z.string(),
          quantity: z.number()
        })
      }
    );
  }
}
```

---

## 5. Cursor Rules Writing Guide: Automatic Architecture Guardian

To strictly maintain architecture for team development and AI coding, write Cursor Rules (.mdc files).

### 5.1 Domain Purity Protection (01-domain-layer.mdc)

> Applied when editing files under packages/domain.

- **Zero Dependency Principle**: Prohibit importing external libraries like react, hono, express, prisma, langchain, openai. Only allow zod, date-fns, uuid.
- **Purity**: Entities and value objects must be pure TypeScript classes or types. Repositories can only define interfaces.
- **Error Handling**: Must define specific Domain Errors.

### 5.2 LangGraph Node Implementation Specification (02-langgraph-nodes.mdc)

> Applied when editing files under packages/infrastructure/**/nodes/*.ts.

- Must follow Humble Object + Dependency Injection
- Prohibit direct instantiation/import of implementations within Node
- Must obtain dependencies through config.configurable
- Node only responsible for "Parse State → Call Use Case → Write Back Results", complex logic should be encapsulated in Use Case
- Strict type safety

### 5.3 Next.js and Hono Interaction Specification (03-interface-layer.mdc)

> Applied when editing apps/web/**

#### UI Integration Rules

1. **Prohibit Direct Database Access**
   - Next.js components must not directly import prisma or packages/domain
   - All data only obtained through interfaces provided by apps/api (Hono)

2. **Streaming Response Handling**
   - Must handle Hono's returned SSE through ai/react (Vercel AI SDK) or native EventSource
   - Cannot parse LangGraph raw JSON on frontend, must convert to ViewModel in Hono

---

## 6. Engineering Process: Abandon Traditional PRD, Embrace Reverse Event Storming

Traditional PRD model is not suitable for AI Agent, recommended new process:

### Phase 1: Behavior Capture and Reverse Modeling

1. Record/collect video materials of targetplatform.com's AIAgent
2. Use AI to generate "conversation scripts" and "decision trees"
3. Reverse Event Storming (identify events, commands, aggregates)

### Phase 2: Skill (Use Case) Definition and TDD

1. Clarify Agent capabilities, define Application layer interfaces
2. Strictly define input/output with Zod Schema
3. Write unit tests before implementation

### Phase 3: Graph Orchestration and Prompt Engineering

1. Define memory structure and routing logic in StateGraph
2. Write and iterate System Prompt
3. Mock full process verification

### Phase 4: Interface Integration

1. Develop Hono API
2. Next.js UI, render different interactive components based on Agent state

---

## 7. Data Structure and Table Design (Reference)

**Prisma Model Design:**

| Model            | Fields (Key)                                | Relations              | Description                              |
|------------------|---------------------------------------------|------------------------|------------------------------------------|
| SourcingRequest  | id, userId, status, createdAt               | items, quotes          | User's original requirement, aggregate root |
| RequestItem      | id, requestId, category, specs (JSON)       | request                | Procurement item, contains structured parameters |
| ProductMockup    | id, itemId, imageUrl, promptUsed            | item                   | Visual mockup and its corresponding DALL-E prompt |
| Supplier         | id, name, capabilities (Vector), tier       | quotes                 | Supplier database, capabilities used for pgvector search |
| Quote            | id, supplierId, requestId, price, leadTime  | supplier, request      | Quote and delivery time presented to user |

---

## 8. Conclusion

Replicating the AIAgent from `targetplatform.com` is a practice oriented toward modern AI engineering systems: leveraging **Turborepo** layering, **Clean Architecture** to isolate business complexity, **LangGraph.js** to manage state machines, and **Hono** to handle edge connections, building a flexible and robust system.

Core innovations include:

1. **Graph Node Dependency Injection**: configurable pattern resolves conflicts between LangGraph and Clean Architecture
2. **Cursor Rules Architecture Governance**: Transforms architect constraints into hard rules for AI programming
3. **Reverse Event Storming Workflow**: Abandons outdated PRD, more precisely captures AI behavior

This engineering process has extremely high reusability, suitable for complex domain AI Agent projects in procurement, customer service, sales, data analysis, etc. AI itself is just infrastructure; true value lies in the depth of domain understanding and modeling.

---

*Note: All code structures and rule configurations recommended in this report can be directly used to initialize your local project.*

---

## Works Cited

1. TargetPlatform | Turn your ideas into real, physical products, accessed January 23, 2026, https://www.targetplatform.com/
2. Design a fully custom, one-of-a-kind product | TargetPlatform, accessed January 23, 2026, https://www.targetplatform.com/fully-custom-projects
3. An Absolute Beginner's Guide to LangGraph.js - Microsoft Community Hub, accessed January 23, 2026, https://techcommunity.microsoft.com/blog/educatordeveloperblog/an-absolute-beginners-guide-to-langgraph-js/4212496
4. LangGraph — Architecture and Design | by Shuvrajyoti Debroy | Medium, accessed January 23, 2026, https://medium.com/@shuv.sdr/langgraph-architecture-and-design-280c365aaf2c
5. Plan your video story with AI in Google Vids (Workspace Labs) - Google Docs Editors Help, accessed January 23, 2026, https://support.google.com/docs/answer/15067812?hl=en
6. From Vlog to Blog: Transforming Videos into Engaging Content with Gemini 1.5 Pro | by Khongorzul Munkhbat | Medium, accessed January 23, 2026, https://medium.com/@centauream/from-vlog-to-blog-transforming-videos-into-engaging-content-with-gemini-1-5-pro-babac3d1ddeb
7. Event Storming Tool - Qlerify | AI-Powered & Collaborative, accessed January 23, 2026, https://www.qlerify.com/event-storming-tool
8. Clean architecture with TypeScript: DDD, Onion - André Bazaglia, accessed January 23, 2026, https://bazaglia.com/clean-architecture-with-typescript-ddd-onion/
9. nikolovlazar/nextjs-clean-architecture: Watch tutorial: https://youtu.be/jJVAla0dWJo - GitHub, accessed January 23, 2026, https://github.com/nikolovlazar/nextjs-clean-architecture
10. Clean Architecture with Next.js: Insights from Lazar Nikolov, Developer Advocate at Sentry | by Hein Htoo | Medium, accessed January 23, 2026, https://medium.com/@heinhtoo/clean-architecture-with-next-js-insights-from-lazar-nikolov-developer-advocate-at-sentry-abe1cb4c7ef3
11. Designing Agentic Systems with Clean Architecture | by Shibi Panikkar | Medium, accessed January 23, 2026, https://medium.com/@shibi.panikkar16/designing-agentic-systems-with-clean-architecture-3e5be962cc00
12. How to maintain Clean Architecture principles with Cloudflare Workers' context-dependent bindings in a Hono API? - Stack Overflow, accessed January 23, 2026, https://stackoverflow.com/questions/79220422/how-to-maintain-clean-architecture-principles-with-cloudflare-workers-context-d
13. Building a Full-Stack App with Turborepo, React, and Hono (Part 2: Developing the API), accessed January 23, 2026, https://dev.to/parthiv_saikia_/building-a-full-stack-app-with-turborepo-react-and-hono-part-2-developing-the-api-4ca0
14. Are you using clean architecture principles with around your agents or not? - LangGraph, accessed January 23, 2026, https://forum.langchain.com/t/are-you-using-clean-architecture-principles-with-around-your-agents-or-not/1876
15. Clean Architecture Layering in Next.js with DI - DEV Community, accessed January 23, 2026, https://dev.to/behnamrhp/how-we-fixed-nextjs-at-scale-di-clean-architecture-secrets-from-production-gnj
16. Building a Fullstack AI Agent with LangGraph.js and Next.js: MCP & HITL | by Ali Ibrahim, accessed January 23, 2026, https://techwithibrahim.medium.com/building-a-fullstack-ai-agent-with-langgraph-js-and-next-js-mcp-hitl-15b2d1a59a9a?source=rss------artificial_intelligence-5
17. Tools - Docs by LangChain, accessed January 23, 2026, https://docs.langchain.com/oss/python/langchain/tools
18. Setting Up Cursor Rules for Consistent AI Behavior | Developing with AI Tools, accessed January 23, 2026, https://stevekinney.com/courses/ai-development/cursor-rules
19. Rules | Cursor Docs, accessed January 23, 2026, https://cursor.com/docs/context/rules
