# LangGraph 在 OEM Agent 项目中的完整指南（中文版）

**创建时间：** 2026-01-23  
**最后更新：** 2026-01-23  
**目标读者：** 想要理解和修改 AI Agent 对话流程的开发者

---

## 📋 目录

1. [什么是 LangGraph](#什么是-langgraph)
2. [核心概念](#核心概念)
3. [项目中的实现](#项目中的实现)
4. [对话流程详解](#对话流程详解)
5. [如何修改和扩展](#如何修改和扩展)
6. [调试和测试](#调试和测试)

---

## 什么是 LangGraph

### 简介

LangGraph 是一个用于构建**状态化 AI 应用**的框架，由 LangChain 团队开发。

**核心思想：** 将 AI 对话建模为**状态机（State Machine）**

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│ Welcome │ ───> │ Classify│ ───> │ Extract │
│  Node   │      │  Intent │      │ Branding│
└─────────┘      └─────────┘      └─────────┘
```

### 为什么需要 LangGraph？

**传统方式（难以维护）：**

```typescript
async function handleChat(message: string) {
  if (message.includes('branding')) {
    const branding = await extractBranding(message);
    if (branding) {
      const products = await recommendProducts(branding);
      if (products) {
        return await generateMockup(products[0]);
      }
    }
  } else if (message.includes('track')) {
    // ... 更多 if-else
  }
  // ❌ 问题：难以维护、难以测试、难以可视化
}
```

**使用 LangGraph（清晰可维护）：**

```typescript
const graph = new StateGraph<AgentState>()
  .addNode('welcome', welcomeNode)
  .addNode('classifyIntent', intentClassificationNode)
  .addNode('extractBranding', brandingExtractionNode)
  .addNode('recommendProducts', productRecommendationNode)
  .addNode('generateMockup', mockupGenerationNode)
  .addConditionalEdges('classifyIntent', routeByIntent)
  .compile();

// ✅ 优势：可视化、可测试、可扩展
```

---

## 核心概念

### 1. State（状态）

**定义：** 在对话过程中需要记住的所有信息

```typescript
// packages/infrastructure/src/agent/types.ts

export interface AgentState {
  // 💬 对话历史
  messages: BaseMessage[];
  
  // 🎯 当前状态
  currentIntent?: 'branded_merch' | 'custom' | 'track_order' | 'general';
  
  // 🎨 品牌信息
  brandingInfo?: {
    companyName?: string;
    logos: Array<{ url: string; width?: number; height?: number }>;
    colors: string[];
    websiteUrl?: string;
  };
  
  // 📦 推荐产品
  recommendedProducts?: Product[];
  
  // ✅ 确认状态
  brandingConfirmed: boolean;
  
  // 🔄 状态转换
  availableTransitions?: StateTransition[];
  selectedTransition?: string;
  
  // 📊 元数据
  sessionId: string;
  executionHistory: string[];
  turnCount: number;
  lastNodeVisited?: string;
}
```

**理解方式：** State 就像一个"记事本"，记录所有对话过程中的信息。

### 2. Node（节点）

**定义：** 处理逻辑的单元，接收 State，处理后返回新的 State

```typescript
// Node 的通用结构
async function myNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // 1. 从 state 中读取信息
  const { messages, brandingInfo } = state;
  
  // 2. 执行处理逻辑
  const result = await doSomething(messages);
  
  // 3. 返回更新后的 state（只返回改变的部分）
  return {
    messages: [...messages, newMessage],
    someNewField: result,
  };
}
```

**关键点：**
- ✅ Node 是**纯函数**：相同输入 → 相同输出
- ✅ 只返回**改变的字段**，不需要返回完整的 state
- ✅ 可以是**异步函数**（调用 API、数据库等）

### 3. Edge（边）

**定义：** 连接节点的路径，决定下一步去哪个节点

**两种类型：**

#### (1) 固定边（Normal Edge）

```typescript
// 固定路线：A → B
graph.addEdge('nodeA', 'nodeB');
```

#### (2) 条件边（Conditional Edge）

```typescript
// 根据 state 动态选择：A → B 或 A → C
graph.addConditionalEdges(
  'nodeA',
  (state: AgentState) => {
    if (state.brandingInfo) {
      return 'nodeB';  // 有品牌信息 → 去 B
    }
    return 'nodeC';    // 没有品牌信息 → 去 C
  }
);
```

### 4. Channel（通道）

**定义：** State 字段的更新策略

```typescript
// packages/infrastructure/src/agent/graph.ts

const channels: StateGraphArgs<AgentState>['channels'] = {
  // 默认策略：替换（replace）
  currentIntent: {
    value: (x: any, y: any) => y ?? x,
    default: () => undefined,
  },
  
  // 自定义策略：追加到数组
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
  
  // 自定义策略：保留直到清除
  selectedTransition: {
    value: (x: any, y: any) => {
      if (y === undefined) return undefined;
      if (y !== null) return y;
      return x;
    },
    default: () => undefined,
  },
};
```

**理解方式：** Channel 决定了当多个 Node 都想更新同一个字段时，如何合并。

---

## 项目中的实现

### 完整对话流程图

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌──────────────┐
│ initialRouter│ ◄───────────┐
└────┬─────────┘             │
     │                       │
     ▼                       │
  是第一条消息？              │
     │                       │
 YES │  NO                   │
     │   │                   │
     ▼   ▼                   │
  welcome  classifyIntent    │
     │        │              │
     └────┬───┘              │
          │                  │
          ▼                  │
    根据意图路由              │
          │                  │
     ┌────┼────┐            │
     │    │    │            │
     ▼    ▼    ▼            │
  extract recommend  conversation
  Branding Products      │
     │        │           │
     └────┬───┴───────────┘
          │
          ▼
    generateMockup
          │
          ▼
      ┌───────┐
      │  END  │
      └───────┘
```

### 代码结构

```
packages/infrastructure/src/agent/
├── graph.ts                     # 主图定义 ⭐
├── types.ts                     # State 类型定义
├── AgentService.ts              # Agent 服务（调用图）
└── nodes/                       # 所有节点
    ├── welcomeNode.ts           # 1️⃣ 欢迎消息
    ├── intentClassificationNode.ts  # 2️⃣ 意图分类
    ├── brandingExtractionNode.ts    # 3️⃣ 品牌提取
    ├── productRecommendationNode.ts # 4️⃣ 产品推荐
    ├── mockupGenerationNode.ts      # 5️⃣ 生成 Mockup
    └── conversationNode.ts          # 6️⃣ 通用对话
```

---

## 对话流程详解

### Flow 1: 用户首次访问

```typescript
// 输入
const input = {
  messages: [new HumanMessage('Hello')],
  sessionId: 'abc123',
  isFirstMessage: true,
};

// 执行流程
1. initialRouter: 检测到 isFirstMessage=true
   ↓
2. welcome: 返回欢迎消息
   "Hi! I'm your AI assistant..."
   ↓
3. classifyIntent: 分析用户意图
   currentIntent = 'general'
   ↓
4. conversation: 通用对话
   "How can I help you today?"
```

### Flow 2: 用户输入网站 URL

```typescript
// 输入
const input = {
  messages: [
    new HumanMessage('Hello'),
    new AIMessage('How can I help?'),
    new HumanMessage('https://monoya.com'),  // 新消息
  ],
  sessionId: 'abc123',
  isFirstMessage: false,
};

// 执行流程
1. initialRouter: isFirstMessage=false → classifyIntent
   ↓
2. classifyIntent: 检测到 URL
   currentIntent = 'branded_merch'
   ↓
3. extractBranding: 提取品牌信息
   brandingInfo = {
     companyName: 'Monoya',
     logos: [{ url: '...' }],
     colors: ['#FF6B6B'],
   }
   actionType = 'show_branding'  // 🔑 关键
   ↓
4. Frontend 显示 BrandingInfoCard（紫色卡片）
```

### Flow 3: 用户确认品牌 → 推荐产品

```typescript
// 输入
const input = {
  messages: [...],
  sessionId: 'abc123',
  brandingConfirmed: true,
  selectedTransition: 'confirm_branding',  // 🔑 关键
};

// 执行流程
1. initialRouter: 检测到 selectedTransition
   强制路由 → recommendProducts
   ↓
2. recommendProducts: 推荐产品
   recommendedProducts = [
     { name: 'Coffee Mug', price: 5.99 },
     { name: 'T-Shirt', price: 12.99 },
   ]
   actionType = 'show_products'  // 🔑 关键
   ↓
3. Frontend 显示产品列表
```

### Flow 4: 生成 Mockup

```typescript
// 输入（用户点击 "Generate Mockup" 按钮）
const input = {
  messages: [..., new HumanMessage('[FORCE] Generate mockup')],
  sessionId: 'abc123',
  selectedTransition: 'to_generate_mockup',  // 🔑 关键
  brandingConfirmed: true,
};

// 执行流程
1. initialRouter: 检测到 selectedTransition
   强制路由 → generateMockup
   ↓
2. generateMockup: 调用 DALL-E
   - 如果缺少 brandingInfo → 自动填充默认值
   - 如果缺少 recommendedProducts → 自动填充默认值
   - 调用 OpenAI DALL-E API
   - imageUrl = 'https://oaidalleapiprodscus...'
   actionType = 'show_product_image'  // 🔑 关键
   ↓
3. Frontend 显示 ProductMockupCard（蓝色卡片）
```

---

## 如何修改和扩展

### 示例 1: 添加新节点（追踪订单）

**需求：** 用户可以输入订单号查询订单状态

#### Step 1: 定义新节点

```typescript
// packages/infrastructure/src/agent/nodes/trackOrderNode.ts

export async function trackOrderNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // 从最后一条消息中提取订单号
  const lastMessage = state.messages[state.messages.length - 1];
  const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  const orderNumber = extractOrderNumber(content);
  
  if (!orderNumber) {
    const message = new AIMessage({
      content: 'Please provide a valid order number (e.g., #12345)',
    });
    return {
      messages: [...state.messages, message],
      lastNodeVisited: 'trackOrder',
    };
  }
  
  // 查询订单状态（调用数据库或 API）
  const orderStatus = await fetchOrderStatus(orderNumber);
  
  const message = new AIMessage({
    content: `Order ${orderNumber} status: ${orderStatus}`,
    additional_kwargs: {
      actionType: 'show_order_status',
      actionData: orderStatus,
    },
  });
  
  return {
    messages: [...state.messages, message],
    lastNodeVisited: 'trackOrder',
  };
}

function extractOrderNumber(text: string): string | null {
  const match = text.match(/#?(\d+)/);
  return match ? match[1] : null;
}
```

#### Step 2: 添加到图中

```typescript
// packages/infrastructure/src/agent/graph.ts

const workflow = new StateGraph<AgentState>({ channels })
  .addNode('welcome', welcomeNode)
  .addNode('initialRouter', initialRouterNode)
  .addNode('classifyIntent', intentClassificationNode)
  .addNode('extractBranding', brandingExtractionNode)
  .addNode('recommendProducts', productRecommendationNode)
  .addNode('generateMockup', mockupGenerationNode)
  .addNode('conversation', conversationNode)
  .addNode('trackOrder', trackOrderNode)  // ✅ 新节点
  // ... 其他配置
```

#### Step 3: 添加路由逻辑

```typescript
// packages/infrastructure/src/agent/graph.ts

function routeByIntent(state: AgentState): string {
  // ... 现有逻辑
  
  if (state.currentIntent === 'track_order') {
    console.log('[Graph Routing] Intent: track_order → trackOrder');
    return 'trackOrder';  // ✅ 新路由
  }
  
  // ... 其他路由
}
```

#### Step 4: 更新意图分类

```typescript
// packages/infrastructure/src/agent/nodes/intentClassificationNode.ts

export async function intentClassificationNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // ... 现有逻辑
  
  // 新增：检测订单追踪意图
  if (contentLower.includes('track') || 
      contentLower.includes('order') ||
      contentLower.match(/#?\d{5,}/)) {  // 订单号模式
    intent = 'track_order';
  }
  
  // ... 其他逻辑
}
```

#### Step 5: 添加前端组件

```tsx
// apps/web/components/floating-agent/OrderStatusCard.tsx

export function OrderStatusCard({ orderData }: { orderData: any }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3>📦 Order Status</h3>
      <p>Order Number: {orderData.orderNumber}</p>
      <p>Status: {orderData.status}</p>
      <p>Estimated Delivery: {orderData.estimatedDelivery}</p>
    </div>
  );
}
```

```tsx
// apps/web/components/floating-agent/MessageList.tsx

{message.role === 'agent' && message.actionData?.type === 'show_order_status' && (
  <OrderStatusCard orderData={message.actionData.payload} />
)}
```

### 示例 2: 修改现有流程（添加确认步骤）

**需求：** 在生成 Mockup 前，让用户选择产品

#### Step 1: 修改 productRecommendationNode

```typescript
// packages/infrastructure/src/agent/nodes/productRecommendationNode.ts

const transitions: StateTransition[] = [
  {
    id: 'select_product_1',
    label: '☕ Coffee Mug',
    description: 'Generate mockup for coffee mug',
    targetNode: 'generateMockup',
    trigger: 'button_click',
  },
  {
    id: 'select_product_2',
    label: '👕 T-Shirt',
    description: 'Generate mockup for t-shirt',
    targetNode: 'generateMockup',
    trigger: 'button_click',
  },
  // ... 其他产品
];

return {
  messages: [...state.messages, message],
  recommendedProducts: products,
  availableTransitions: transitions,  // 🔑 提供选项
};
```

#### Step 2: 修改 mockupGenerationNode

```typescript
// packages/infrastructure/src/agent/nodes/mockupGenerationNode.ts

export async function mockupGenerationNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // 根据 selectedTransition 选择产品
  let selectedProduct: Product;
  
  if (state.selectedTransition === 'select_product_1') {
    selectedProduct = state.recommendedProducts?.[0];
  } else if (state.selectedTransition === 'select_product_2') {
    selectedProduct = state.recommendedProducts?.[1];
  } else {
    // 默认选择第一个
    selectedProduct = state.recommendedProducts?.[0];
  }
  
  // ... 生成 mockup
}
```

---

## 调试和测试

### 1. 添加日志

```typescript
// 在每个节点中添加日志
export async function myNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[MyNode] Entering with state:', {
    messageCount: state.messages.length,
    currentIntent: state.currentIntent,
    hasBranding: !!state.brandingInfo,
  });
  
  // ... 处理逻辑
  
  console.log('[MyNode] Exiting with updates:', result);
  return result;
}
```

### 2. 单元测试

```typescript
// packages/infrastructure/src/agent/nodes/__tests__/welcomeNode.test.ts

import { describe, it, expect } from 'vitest';
import { welcomeNode } from '../welcomeNode';
import { HumanMessage } from '@langchain/core/messages';

describe('welcomeNode', () => {
  it('should return welcome message', async () => {
    const state: AgentState = {
      messages: [new HumanMessage('Hello')],
      sessionId: 'test-123',
      executionHistory: [],
      turnCount: 0,
      brandingConfirmed: false,
    };
    
    const result = await welcomeNode(state);
    
    expect(result.messages).toHaveLength(2);  // 原消息 + 欢迎消息
    expect(result.messages[1].content).toContain('AI assistant');
  });
});
```

### 3. 集成测试

```typescript
// packages/infrastructure/src/agent/__tests__/graph.test.ts

import { describe, it, expect } from 'vitest';
import { agentGraph } from '../graph';
import { HumanMessage } from '@langchain/core/messages';

describe('Agent Graph', () => {
  it('should handle branding extraction flow', async () => {
    const input = {
      messages: [new HumanMessage('https://monoya.com')],
      sessionId: 'test-123',
      executionHistory: [],
      turnCount: 0,
      brandingConfirmed: false,
      isFirstMessage: true,
    };
    
    const result = await agentGraph.invoke(input);
    
    expect(result.brandingInfo).toBeDefined();
    expect(result.brandingInfo?.companyName).toBe('Monoya');
    expect(result.executionHistory).toContain('extractBranding');
  });
});
```

### 4. 使用 Debug Panel

前端提供了 Debug Panel（按左下角 🐛 按钮）：

- **Current State**: 当前所在节点
- **Available Transitions**: 可用的状态转换
- **Execution History**: 节点执行历史
- **Graph Edges**: 所有可能的路径

---

## 最佳实践

### 1. Node 设计原则

✅ **DO（推荐）：**
- 每个 Node 职责单一
- Node 是纯函数（相同输入 → 相同输出）
- 使用 `additional_kwargs` 传递前端显示信息

```typescript
// ✅ Good: 职责单一
async function extractBrandingNode(state: AgentState) {
  const branding = await extractBranding(state.messages);
  return { brandingInfo: branding };
}

async function recommendProductsNode(state: AgentState) {
  const products = await recommendProducts(state.brandingInfo);
  return { recommendedProducts: products };
}
```

❌ **DON'T（不推荐）：**
- Node 做太多事情
- Node 有副作用（直接修改数据库、发送邮件等）

```typescript
// ❌ Bad: 做太多事情
async function processEverythingNode(state: AgentState) {
  const branding = await extractBranding(state.messages);
  const products = await recommendProducts(branding);
  const mockup = await generateMockup(products[0]);
  await sendEmailToUser(mockup);  // ❌ 副作用
  return { branding, products, mockup };
}
```

### 2. State 管理原则

✅ **DO（推荐）：**
- 只返回改变的字段
- 使用 TypeScript 类型确保类型安全

```typescript
// ✅ Good
return {
  brandingInfo: newBranding,  // 只返回改变的
  lastNodeVisited: 'extractBranding',
};
```

❌ **DON'T（不推荐）：**
- 返回完整的 state（浪费性能）
- 直接修改 state（破坏纯函数）

```typescript
// ❌ Bad
state.brandingInfo = newBranding;  // 不要直接修改
return state;  // 不要返回完整 state
```

### 3. 错误处理

✅ **DO（推荐）：**
- 使用 try-catch 捕获错误
- 返回友好的错误消息

```typescript
try {
  const branding = await extractBranding(url);
  return { brandingInfo: branding };
} catch (error) {
  console.error('Branding extraction error:', error);
  const errorMessage = new AIMessage({
    content: 'Sorry, I could not extract branding from that URL. Please try another one.',
  });
  return {
    messages: [...state.messages, errorMessage],
  };
}
```

---

## 附录：完整示例

### 完整的 Node 实现

```typescript
// packages/infrastructure/src/agent/nodes/exampleNode.ts

import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState, StateTransition } from '../types.js';

export async function exampleNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // 1️⃣ 日志（调试用）
  console.log('[ExampleNode] Processing:', {
    messageCount: state.messages.length,
    currentIntent: state.currentIntent,
  });
  
  try {
    // 2️⃣ 提取需要的信息
    const lastMessage = state.messages[state.messages.length - 1];
    const userInput = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : '';
    
    // 3️⃣ 执行业务逻辑
    const result = await processUserInput(userInput);
    
    // 4️⃣ 构造 AI 回复
    const responseMessage = new AIMessage({
      content: `I processed your input: ${result}`,
      additional_kwargs: {
        actionType: 'show_result',  // 🔑 告诉前端显示什么
        actionData: result,
      },
    });
    
    // 5️⃣ 定义下一步的可能路径
    const transitions: StateTransition[] = [
      {
        id: 'continue',
        label: '✅ Continue',
        description: 'Go to next step',
        targetNode: 'nextNode',
        trigger: 'button_click',
      },
      {
        id: 'restart',
        label: '🔄 Restart',
        description: 'Start over',
        targetNode: 'welcome',
        trigger: 'button_click',
      },
    ];
    
    // 6️⃣ 返回更新的 state
    return {
      messages: [...state.messages, responseMessage],
      // 更新其他字段（如果需要）
      someNewField: result,
      executionHistory: [...(state.executionHistory || []), 'exampleNode'],
      lastNodeVisited: 'exampleNode',
      availableTransitions: transitions,
      selectedTransition: undefined,  // 清除上一次的选择
    };
    
  } catch (error) {
    // 7️⃣ 错误处理
    console.error('[ExampleNode] Error:', error);
    
    const errorMessage = new AIMessage({
      content: 'Sorry, something went wrong. Please try again.',
    });
    
    return {
      messages: [...state.messages, errorMessage],
      executionHistory: [...(state.executionHistory || []), 'exampleNode:error'],
      lastNodeVisited: 'exampleNode',
      selectedTransition: undefined,
    };
  }
}

// 8️⃣ 辅助函数（私有）
async function processUserInput(input: string): Promise<any> {
  // 实现你的业务逻辑
  return { processed: input };
}
```

---

## 总结

### LangGraph 核心思想

1. **状态机思维**：将对话建模为状态转换
2. **纯函数 Node**：职责单一、可测试
3. **类型安全**：TypeScript 确保正确性
4. **可视化流程**：易于理解和维护

### 常见模式

```typescript
// 模式 1: 简单处理
Node A → Node B → Node C

// 模式 2: 条件分支
                ┌→ Node B1
Node A → Router ┤
                └→ Node B2

// 模式 3: 循环
Node A → Node B → Router → Node A (如果需要重试)
                     └→ Node C (如果成功)

// 模式 4: 强制路由（本项目使用）
Frontend Button → selectedTransition → 直接跳到指定 Node
```

### 进一步学习

- 📖 [LangGraph 官方文档](https://langchain-ai.github.io/langgraphjs/)
- 🎥 [LangGraph 视频教程](https://www.youtube.com/watch?v=bq6RL4_s6YQ)
- 💻 [项目源码](../packages/infrastructure/src/agent/)

---

**文档维护者：** AI Cursor  
**最后更新：** 2026-01-23  
**反馈：** 请创建 GitHub Issue


