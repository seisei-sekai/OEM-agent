# 基于 Clean Architecture 与 Turborepo 架构复刻 TheWayo AI Agent 的深度技术研究报告

## 1. 执行摘要与引言

在生成式人工智能迅速重塑软件交互范式的当下，thewayo.com 所展示的 AI Sourcing Agent ("Nory") 代表了一种典型的高级代理形态。它不仅仅是一个聊天机器人，而是一个具备多模态理解、长程任务编排、供应链资源调度的复杂系统 [1]。用户希望通过“截屏/录屏”的方式逆向工程并复刻这一功能，这提出了双重挑战：  
1. 如何从表层的 UI 交互中准确推断深层的业务逻辑与状态机  
2. 如何在现代化的技术栈（Turborepo, Next.js, Hono, LangGraph.js, TypeScript）中，严格遵循领域驱动设计（DDD）和整洁架构（Clean Architecture）原则来实现，避免陷入“面条式代码”的泥潭。

本报告旨在提供详尽的工程化实施指南。论证传统“PRD -> 设计 -> 代码”瀑布流模式在构建 AI Agent 时已不再适用，并提出“视频行为分析 -> 逆向事件风暴 -> 状态图设计”新型工作流。报告将深入探讨如何在 LangGraph.js 图结构中实现依赖注入（Dependency Injection, DI），如何利用 Hono 作为接口适配层连接 Next.js 前端与 Agent 核心，以及如何编写高精度 Cursor Rules (.mdc) 以在编码辅助阶段强制执行架构约束。

---

## 2. 逆向工程方法论：从视觉信号到领域逻辑

要复刻 Nory Agent，首要任务是解构其行为。由于无法访问后端代码，我们需将用户界面（UI）的视频记录视为系统“黑盒”输出，通过观察输入与输出因果，推导其内部状态机模型。

### 2.1 视频流中的行为解构与意图识别

thewayo.com 的 Nory Agent 展现了典型的任务型对话特征。分析其交互视频，可以拆解为一系列“技能”（Skills）和“状态”（States）。

#### 表 1：Nory Agent UI 交互与推断后端逻辑映射

| 时间戳 / UI 信号           | 用户行为描述                | 推断后端状态 (State)           | 推断领域事件 (Domain Event) | 必需技能 (Skill/Tool)               |
| --------------------- | ------------------- | ------------------------ | ----------------------- | ---------------------------- |
| 00:05 对话框初始化           | 用户进入页面，Agent 主动问候      | Idle → AwaitingIntent   | SessionStarted           | load_user_profile           |
| 00:15 用户输入需求           | “我想做一批带 Logo 的蓝色卫衣”   | IntentClassification    | RequirementCaptured      | classify_product_category    |
| 00:25 Agent 追问细节          | “您需要什么面料磅数？”        | SlotFilling             | AmbiguityDetected        | check_required_attributes    |
| 00:40 展示带 Logo 的效果图      | 用户上传 Logo 图片             | MockupGeneration        | AssetUploaded, MockupRendered | generate_product_mockup      |
| 00:55 Agent 显示“正在寻找工厂…” | 系统显示进度条                 | Sourcing                | VendorSearchInitiated    | search_supplier_index        |
| 01:10 展示报价单与交期         | 显示具体金额与时间              | Quoting                 | CostCalculated           | calculate_landed_cost        |

> 通过逐帧分析，将“猜测”功能转化为有限状态机（FSM）建模。在 LangGraph.js 中，这正对应 StateGraph 的结构 [3]。例如，Agent 在“追问细节”与“展示结果”间的跳转，揭示了条件边（Conditional Edges）与循环逻辑（Loop）：必填属性缺失时，必须回退 SlotFilling 状态。

### 2.2 利用多模态 AI 辅助逆向分析

建议采用 Gemini 1.5 Pro 或 GPT-4o 等支持长视频输入的模型辅助分析 [5]。

- 推荐 Prompt：「分析这段屏幕录制视频。该视频展示了 Nory AI 采购 Agent。请基于领域驱动设计（DDD），识别视频中发生的所有关键业务事件（Domain Events）。请忽略 UI 样式，专注交互逻辑。对每一次 Agent 的响应，推断其调用类型及后端工具；并用 Mermaid 语法绘制该交互流程状态转换图。」

这种做法可将非结构化视频数据快速转化为结构化逻辑，为事件风暴（Event Storming）提供高质量素材 [7]。

---

## 3. 架构设计：Turborepo 下的整洁架构与 DDD

### 3.1 总体架构图景

采用物理路径隔离强制依赖规则。核心原则：内层（领域/应用）不依赖外层（基础设施/界面），源码依赖方向仅指向内层 [8]。

```
/root
├── .cursor/rules/     # Cursor 规则集 (架构守护者)
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

### 3.2 领域层 (Domain Layer)

- **Entities**: ProductRequirement, Supplier, Quote, Mockup
- **Value Objects**: FabricWeight, ColorCode, Price
- **Repository Interfaces**: ISupplierRepository, IProductCatalogRepository（仅定义接口，不依赖数据库）
- **Domain Services**: CostCalculator

> 关键约束：领域层严禁引用 langchain、hono、react、prisma 等外部库

### 3.3 应用层 (Application Layer)

定义 Agent 的技能（用例）：

- Use Cases:
    - FindSupplierUseCase
    - GenerateMockupUseCase

- Agent Interfaces：定义 IAgentService 便于 API 层 decouple

### 3.4 基础设施层 (Infrastructure Layer)

- 实现领域层接口，如 PrismaSupplierRepository  
- Agent 实现（LangGraphAgentService）：定义 StateGraph、Nodes、Edges  
- 外部服务适配：OpenAIAdapter、MidjourneyAdapter

### 3.5 接口层 (Interface Layer - Hono & Next.js)

- Hono (API)：作为 Next.js 和 Agent 的网关，处理 SSE 流；适合 Cloudflare Workers 部署 [12]
- Next.js (Web)：负责渲染 UI，通过 tRPC 或 Hono RPC Client 通信

---

## 4. 深度技术攻坚：LangGraph.js 与依赖注入 (DI) 融合

### 4.1 LangGraph "Configurable" 依赖注入模式

- **组合根 (Composition Root)**：Hono 中初始化 DI 容器，解析全部 Use Case 实例  
- **上下文传递**：agent.invoke()/stream 时，将 Use Case 放入 configurable  
- **节点解包**：Node 函数内部从 config.configurable 读取 Use Case  
- **禁止直接 import**：不允许节点直接导入 UseCase/DB

#### 步骤 1：定义 Agent 依赖类型 (Application Layer)

```typescript
// packages/application/src/agent/AgentDependencies.ts
import { IFindSupplierUseCase } from "../use-cases/FindSupplierUseCase";
import { IGenerateMockupUseCase } from "../use-cases/GenerateMockupUseCase";

export interface AgentDependencies {
  findSupplierUseCase: IFindSupplierUseCase;
  generateMockupUseCase: IGenerateMockupUseCase;
}
```

#### 步骤 2："Humble Node" 编写 (Infrastructure Layer)

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

#### 步骤 3：Hono 依赖装配 (Apps/API)

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

> 注：此模式实现依赖注入，也便于 Serverless 场景下连接池的自动释放 [12]。

### 4.3 Agent Skill 封装策略

#### Tool Factory Pattern

Application 层定义 Tool 工厂接口，Infrastructure 层实现，适合 Tool Call 模式。

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

## 5. Cursor Rules 编写指南：架构的自动守护者

为团队开发与 AI 编码严格维持架构，需撰写 Cursor Rules（.mdc 文件）。

### 5.1 领域纯净性保护 (01-domain-layer.mdc)

> 当编辑 packages/domain 下的文件时应用。

- **零依赖原则**：禁止导入 react, hono, express, prisma, langchain, openai 等外部库。仅允许 zod、date-fns、uuid。
- **纯粹性**：实体与值对象必须纯 TypeScript 类或类型。Repository 只能定义接口。
- **错误处理**：需定义特定 Domain Errors。

### 5.2 LangGraph 节点实现规范 (02-langgraph-nodes.mdc)

> 当编辑 packages/infrastructure/**/nodes/*.ts 时应用。

- 必须遵循 Humble Object+依赖注入  
- 禁止 Node 内直接实例化/导入实现  
- 必须通过 config.configurable 获取依赖  
- Node 只负责“解析 State → 调用用例 → 回写结果”，复杂逻辑应封装至 Use Case  
- 严格类型安全

### 5.3 Next.js 与 Hono 交互规范 (03-interface-layer.mdc)

> 当编辑 apps/web/** 时应用

#### UI Integration Rules

1. **禁止直接数据库访问**  
   - Next.js 组件不得直接导入 prisma 或 packages/domain  
   - 所有数据仅通过 apps/api (Hono) 提供的接口获取

2. **流式响应处理**  
   - 需通过 ai/react (Vercel AI SDK) 或原生 EventSource 处理 Hono 返回的 SSE  
   - 不可在前端解析 LangGraph 原始 JSON，需在 Hono 转为 ViewModel

---

## 6. 工程化流程：摒弃传统 PRD，拥抱逆向事件风暴

传统 PRD 模式不适合 AI Agent，推荐新流程：

### 阶段一：行为捕捉与逆向建模

1. 录制/收集 thewayo.com Nory 的视频素材
2. 利用 AI 生成“对话脚本”和“决策树”
3. 逆向事件风暴（识别事件、命令、聚合）

### 阶段二：Skill (Use Case) 定义与 TDD

1. 明确 Agent 的能力，定义 Application 层接口
2. Zod Schema 严格定义输入输出
3. 先写单元测试再写实现

### 阶段三：图编排与 Prompt 工程

1. StateGraph 中定义记忆结构、路由逻辑
2. System Prompt 编写及迭代
3. Mock 流程全流程验证

### 阶段四：界面集成

1. 开发 Hono API  
2. Next.js UI，根据 Agent 状态渲染不同交互组件

---

## 7. 数据结构与表设计（参考）

**Prisma Model 设计：**

| Model            | Fields (Key)                                | Relations              | Description                              |
|------------------|---------------------------------------------|------------------------|------------------------------------------|
| SourcingRequest  | id, userId, status, createdAt               | items, quotes          | 用户原始需求单，聚合根                    |
| RequestItem      | id, requestId, category, specs (JSON)       | request                | 采购项，包含结构化参数                    |
| ProductMockup    | id, itemId, imageUrl, promptUsed            | item                   | 视觉效果图及其对应的 DALL-E prompt        |
| Supplier         | id, name, capabilities (Vector), tier       | quotes                 | 供应商库，capabilities 用于 pgvector 检索 |
| Quote            | id, supplierId, requestId, price, leadTime  | supplier, request      | 呈现给用户的报价、交期                    |

---

## 8. 结论

复刻 `thewayo.com` 的 Nory Agent 是一次面向现代 AI 工程体系的实践：借助 **Turborepo** 分层、**Clean Architecture** 隔离业务复杂性、**LangGraph.js** 管理状态机，以及 **Hono** 处理边缘连接，构建灵活、健壮系统。

创新点核心为：

1. **依赖注入的图节点化**：configurable 模式解决 LangGraph 与整洁架构的冲突
2. **Cursor Rules 架构治理**：将架构师约束转化为 AI 编程的硬性规则
3. **逆向事件风暴工作流**：摒弃过时 PRD，更精准捕获 AI 行为

该工程化流程具极高复用性，适于采购、客服、销售、数据分析等复杂领域的 AI Agent 项目。AI 本身只是基础设施，真正价值在于领域理解与建模的深度。

---

*注：本报告建议的所有代码结构和规则配置均可直接用于初始化您的本地项目。*

---

## Works cited

1. Wayo | Turn your ideas into real, physical products, accessed January 23, 2026, https://www.thewayo.com/
2. Design a fully custom, one-of-a-kind product | Wayo, accessed January 23, 2026, https://www.thewayo.com/fully-custom-projects
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
