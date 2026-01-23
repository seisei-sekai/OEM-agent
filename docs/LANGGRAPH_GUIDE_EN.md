# Complete LangGraph Guide for OEM Agent (English)

**Created:** 2026-01-23  
**Last Updated:** 2026-01-23  
**Target Audience:** Developers who want to understand and modify AI Agent conversation flow

---

## 📋 Table of Contents

1. [What is LangGraph](#what-is-langgraph)
2. [Core Concepts](#core-concepts)
3. [Implementation in Project](#implementation-in-project)
4. [Conversation Flow Details](#conversation-flow-details)
5. [How to Modify and Extend](#how-to-modify-and-extend)
6. [Debugging and Testing](#debugging-and-testing)

---

## What is LangGraph

### Introduction

LangGraph is a framework for building **stateful AI applications**, developed by the LangChain team.

**Core Idea:** Model AI conversations as a **State Machine**

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│ Welcome │ ───> │ Classify│ ───> │ Extract │
│  Node   │      │  Intent │      │ Branding│
└─────────┘      └─────────┘      └─────────┘
```

### Why LangGraph?

**Traditional Approach (Hard to Maintain):**

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
    // ... more if-else
  }
  // ❌ Problems: Hard to maintain, test, visualize
}
```

**Using LangGraph (Clear and Maintainable):**

```typescript
const graph = new StateGraph<AgentState>()
  .addNode('welcome', welcomeNode)
  .addNode('classifyIntent', intentClassificationNode)
  .addNode('extractBranding', brandingExtractionNode)
  .addNode('recommendProducts', productRecommendationNode)
  .addNode('generateMockup', mockupGenerationNode)
  .addConditionalEdges('classifyIntent', routeByIntent)
  .compile();

// ✅ Benefits: Visualizable, Testable, Extensible
```

---

## Core Concepts

### 1. State

**Definition:** All information that needs to be remembered during conversation

```typescript
// packages/infrastructure/src/agent/types.ts

export interface AgentState {
  // 💬 Conversation history
  messages: BaseMessage[];
  
  // 🎯 Current state
  currentIntent?: 'branded_merch' | 'custom' | 'track_order' | 'general';
  
  // 🎨 Branding info
  brandingInfo?: {
    companyName?: string;
    logos: Array<{ url: string; width?: number; height?: number }>;
    colors: string[];
    websiteUrl?: string;
  };
  
  // 📦 Recommended products
  recommendedProducts?: Product[];
  
  // ✅ Confirmation status
  brandingConfirmed: boolean;
  
  // 🔄 State transitions
  availableTransitions?: StateTransition[];
  selectedTransition?: string;
  
  // 📊 Metadata
  sessionId: string;
  executionHistory: string[];
  turnCount: number;
  lastNodeVisited?: string;
}
```

### 2. Node

**Definition:** Processing unit that receives State, processes it, and returns new State

```typescript
async function myNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // 1. Read from state
  const { messages, brandingInfo } = state;
  
  // 2. Execute logic
  const result = await doSomething(messages);
  
  // 3. Return updated state (only changed fields)
  return {
    messages: [...messages, newMessage],
    someNewField: result,
  };
}
```

### 3. Edge

**Definition:** Path connecting nodes, determines next destination

**Two Types:**

#### (1) Normal Edge (Fixed)

```typescript
// Fixed route: A → B
graph.addEdge('nodeA', 'nodeB');
```

#### (2) Conditional Edge

```typescript
// Dynamic selection based on state: A → B or A → C
graph.addConditionalEdges(
  'nodeA',
  (state: AgentState) => {
    if (state.brandingInfo) {
      return 'nodeB';  // Has branding → go to B
    }
    return 'nodeC';    // No branding → go to C
  }
);
```

### 4. Channel

**Definition:** Update strategy for State fields

```typescript
const channels: StateGraphArgs<AgentState>['channels'] = {
  // Default: replace
  currentIntent: {
    value: (x: any, y: any) => y ?? x,
    default: () => undefined,
  },
  
  // Custom: append to array
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
};
```

---

## Implementation in Project

### Complete Conversation Flow

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌──────────────┐
│ initialRouter│
└────┬─────────┘
     │
     ▼
  First message?
     │
 YES │  NO
     │   │
     ▼   ▼
  welcome  classifyIntent
     │        │
     └────┬───┘
          │
          ▼
    Route by intent
          │
     ┌────┼────┐
     │    │    │
     ▼    ▼    ▼
  extract recommend  conversation
  Branding Products
     │        │
     └────┬───┘
          │
          ▼
    generateMockup
          │
          ▼
      ┌───────┐
      │  END  │
      └───────┘
```

### Code Structure

```
packages/infrastructure/src/agent/
├── graph.ts                     # Main graph definition ⭐
├── types.ts                     # State type definitions
├── AgentService.ts              # Agent service (invokes graph)
└── nodes/                       # All nodes
    ├── welcomeNode.ts           # 1️⃣ Welcome message
    ├── intentClassificationNode.ts  # 2️⃣ Intent classification
    ├── brandingExtractionNode.ts    # 3️⃣ Branding extraction
    ├── productRecommendationNode.ts # 4️⃣ Product recommendation
    ├── mockupGenerationNode.ts      # 5️⃣ Generate mockup
    └── conversationNode.ts          # 6️⃣ General conversation
```

---

## Conversation Flow Details

### Flow 1: User First Visit

```typescript
// Input
const input = {
  messages: [new HumanMessage('Hello')],
  sessionId: 'abc123',
  isFirstMessage: true,
};

// Execution flow
1. initialRouter: Detected isFirstMessage=true
   ↓
2. welcome: Return welcome message
   "Hi! I'm your AI assistant..."
   ↓
3. classifyIntent: Analyze user intent
   currentIntent = 'general'
   ↓
4. conversation: General conversation
   "How can I help you today?"
```

### Flow 2: User Inputs Website URL

```typescript
// Input
const input = {
  messages: [
    new HumanMessage('Hello'),
    new AIMessage('How can I help?'),
    new HumanMessage('https://monoya.com'),  // New message
  ],
  sessionId: 'abc123',
  isFirstMessage: false,
};

// Execution flow
1. initialRouter: isFirstMessage=false → classifyIntent
   ↓
2. classifyIntent: Detected URL
   currentIntent = 'branded_merch'
   ↓
3. extractBranding: Extract branding info
   brandingInfo = {
     companyName: 'Monoya',
     logos: [{ url: '...' }],
     colors: ['#FF6B6B'],
   }
   actionType = 'show_branding'  // 🔑 Key
   ↓
4. Frontend displays BrandingInfoCard (purple card)
```

### Flow 3: User Confirms → Recommend Products

```typescript
// Input
const input = {
  messages: [...],
  sessionId: 'abc123',
  brandingConfirmed: true,
  selectedTransition: 'confirm_branding',  // 🔑 Key
};

// Execution flow
1. initialRouter: Detected selectedTransition
   Force route → recommendProducts
   ↓
2. recommendProducts: Recommend products
   recommendedProducts = [
     { name: 'Coffee Mug', price: 5.99 },
     { name: 'T-Shirt', price: 12.99 },
   ]
   actionType = 'show_products'  // 🔑 Key
   ↓
3. Frontend displays product list
```

### Flow 4: Generate Mockup

```typescript
// Input (user clicks "Generate Mockup" button)
const input = {
  messages: [..., new HumanMessage('[FORCE] Generate mockup')],
  sessionId: 'abc123',
  selectedTransition: 'to_generate_mockup',  // 🔑 Key
  brandingConfirmed: true,
};

// Execution flow
1. initialRouter: Detected selectedTransition
   Force route → generateMockup
   ↓
2. generateMockup: Call DALL-E
   - If missing brandingInfo → auto-fill defaults
   - If missing recommendedProducts → auto-fill defaults
   - Call OpenAI DALL-E API
   - imageUrl = 'https://oaidalleapiprodscus...'
   actionType = 'show_product_image'  // 🔑 Key
   ↓
3. Frontend displays ProductMockupCard (blue card)
```

---

## How to Modify and Extend

### Example: Add New Node (Track Order)

**Requirement:** User can input order number to check status

#### Step 1: Define New Node

```typescript
// packages/infrastructure/src/agent/nodes/trackOrderNode.ts

export async function trackOrderNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
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
```

#### Step 2: Add to Graph

```typescript
// packages/infrastructure/src/agent/graph.ts

const workflow = new StateGraph<AgentState>({ channels })
  .addNode('welcome', welcomeNode)
  // ... existing nodes
  .addNode('trackOrder', trackOrderNode)  // ✅ New node
```

#### Step 3: Add Routing Logic

```typescript
function routeByIntent(state: AgentState): string {
  if (state.currentIntent === 'track_order') {
    return 'trackOrder';  // ✅ New route
  }
  // ... other routes
}
```

---

## Debugging and Testing

### 1. Add Logging

```typescript
export async function myNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[MyNode] Entering with state:', {
    messageCount: state.messages.length,
    currentIntent: state.currentIntent,
  });
  
  // ... processing
  
  console.log('[MyNode] Exiting with updates:', result);
  return result;
}
```

### 2. Unit Testing

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
    
    expect(result.messages).toHaveLength(2);
    expect(result.messages[1].content).toContain('AI assistant');
  });
});
```

### 3. Use Debug Panel

Frontend provides Debug Panel (click 🐛 button in bottom-left):

- **Current State**: Current node
- **Available Transitions**: Available state transitions
- **Execution History**: Node execution history
- **Graph Edges**: All possible paths

---

## Best Practices

### Node Design Principles

✅ **DO:**
- Single responsibility per node
- Node is a pure function
- Use `additional_kwargs` for frontend display info

❌ **DON'T:**
- Node does too many things
- Node has side effects (direct DB changes, sending emails)

### Error Handling

```typescript
try {
  const branding = await extractBranding(url);
  return { brandingInfo: branding };
} catch (error) {
  console.error('Branding extraction error:', error);
  const errorMessage = new AIMessage({
    content: 'Sorry, I could not extract branding from that URL.',
  });
  return {
    messages: [...state.messages, errorMessage],
  };
}
```

---

## Summary

### LangGraph Core Ideas

1. **State Machine Thinking**: Model conversation as state transitions
2. **Pure Function Nodes**: Single responsibility, testable
3. **Type Safety**: TypeScript ensures correctness
4. **Visual Flow**: Easy to understand and maintain

### Common Patterns

```typescript
// Pattern 1: Simple processing
Node A → Node B → Node C

// Pattern 2: Conditional branching
                ┌→ Node B1
Node A → Router ┤
                └→ Node B2

// Pattern 3: Loop
Node A → Node B → Router → Node A (if retry needed)
                     └→ Node C (if success)

// Pattern 4: Force routing (used in this project)
Frontend Button → selectedTransition → Jump directly to specific Node
```

---

**Documentation Maintainer:** AI Cursor  
**Last Updated:** 2026-01-23  
**Feedback:** Please create a GitHub Issue

