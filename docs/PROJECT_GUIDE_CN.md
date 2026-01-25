# OEM Agent 项目完整指南（中文版）

**创建时间：** 2026-01-23  
**最后更新：** 2026-01-23  
**目标读者：** 前端/后端新手，有基础 React 和 Flask 经验

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈详解](#技术栈详解)
3. [项目结构](#项目结构)
4. [核心概念](#核心概念)
5. [开发指南](#开发指南)
6. [部署指南](#部署指南)

---

## 项目概述

### 这是什么项目？

OEM Agent 是一个智能 AI 助手系统，帮助用户：
- 上传网站 URL，自动提取品牌信息（logo、颜色）
- 基于品牌推荐定制产品
- 使用 AI 生成产品效果图（mockup）

### 核心功能

```
用户输入网站 URL (https://monoya.com)
    ↓
AI 提取品牌信息（logo、颜色）
    ↓
推荐定制产品（杯子、T恤等）
    ↓
生成产品效果图（DALL-E）
```

---

## 技术栈详解

### 1. Turborepo（项目管理工具）

**是什么？**
- Monorepo 管理工具，类似于 Yarn Workspaces 或 Lerna
- 可以在一个代码库中管理多个项目（前端、后端、共享库）

**为什么用它？**
- **统一版本管理**：所有包使用相同版本的依赖
- **增量构建**：只构建改动的部分，加快构建速度
- **代码共享**：前后端可以共享 TypeScript 类型定义

**关键文件：**
```
turbo.json          # Turborepo 配置文件
pnpm-workspace.yaml # pnpm 工作空间配置
```

**在本项目中的作用：**
```
OEM_Agent/
├── apps/          # 应用程序
│   ├── api/       # 后端 API
│   └── web/       # 前端 Web
└── packages/      # 共享包
    ├── domain/    # 业务逻辑
    ├── application/
    └── infrastructure/
```

### 2. Hono（后端框架）

**是什么？**
- 超轻量级 Web 框架（类似于 Flask）
- 专为边缘计算和高性能设计

**对比 Flask：**

```python
# Flask (你熟悉的)
@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}
```

```typescript
// Hono (新框架)
app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});
```

**特点：**
- 🚀 **极快**：比 Express 快 3-4 倍
- 🪶 **轻量**：核心只有 13KB
- 🔒 **类型安全**：TypeScript 原生支持

**在本项目中的作用：**
- 处理所有 API 请求（`/api/chat`, `/health`, `/sessions`）
- 作为 LangGraph Agent 的 HTTP 接口
- 管理 SSE（Server-Sent Events）流式响应

**关键文件：**
```
apps/api/src/
├── index.ts           # 主入口文件
├── routes/            # API 路由
│   ├── agent.ts       # AI Agent 路由
│   ├── health.ts      # 健康检查
│   └── sessions.ts    # 会话管理
└── middleware/        # 中间件
    ├── cors.ts        # CORS 配置
    └── logger.ts      # 日志记录
```

### 3. Next.js（前端框架）

**是什么？**
- React 的生产级框架
- 提供服务端渲染（SSR）、路由、API 等功能

**对比 React：**

```jsx
// React (你熟悉的 - 需要 react-router)
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
// Next.js (文件系统路由 - 更简单)
// app/page.tsx 自动对应 '/' 路由
export default function Home() {
  return <div>Home Page</div>;
}
```

**特点：**
- 📁 **文件系统路由**：`app/about/page.tsx` → `/about`
- ⚡ **App Router**（新版）：更好的性能和 SEO
- 🎨 **内置 CSS 支持**：Tailwind CSS、CSS Modules

**在本项目中的作用：**
- 渲染 AI Agent 聊天界面
- 管理前端状态（Zustand）
- 处理用户交互

**关键文件：**
```
apps/web/
├── app/                   # Next.js 13+ App Router
│   ├── layout.tsx         # 全局布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   └── floating-agent/    # AI Agent 组件
│       ├── ChatModal.tsx  # 聊天窗口
│       ├── MessageList.tsx# 消息列表
│       └── ...
└── lib/                   # 工具库
    ├── api-client.ts      # API 客户端
    └── store.ts           # 状态管理（Zustand）
```

### 4. LangGraph.js（AI 工作流引擎）

**是什么？**
- 用于构建状态化 AI 应用的框架
- 将 AI 对话流程建模为状态机（State Machine）

**核心概念：**

```typescript
// 定义状态
interface AgentState {
  messages: Message[];        // 对话历史
  currentIntent: string;      // 当前意图
  brandingInfo?: BrandingInfo;// 品牌信息
  recommendedProducts?: Product[];
}

// 定义节点（处理逻辑）
async function extractBrandingNode(state: AgentState) {
  // 提取品牌信息
  const branding = await extractBranding(state.messages);
  return { ...state, brandingInfo: branding };
}

// 定义边（路由逻辑）
function routeByIntent(state: AgentState): string {
  if (state.currentIntent === 'branded_merch') {
    return 'extractBranding';
  }
  return 'conversation';
}

// 构建图
const graph = new StateGraph<AgentState>()
  .addNode('welcome', welcomeNode)
  .addNode('classifyIntent', intentClassificationNode)
  .addNode('extractBranding', brandingExtractionNode)
  .addConditionalEdges('classifyIntent', routeByIntent)
  .compile();
```

**在本项目中的作用：**
- 管理 AI Agent 的对话流程
- 根据用户意图路由到不同的处理节点
- 维护对话状态和历史

**关键文件：**
```
packages/infrastructure/src/agent/
├── graph.ts               # LangGraph 主图定义
├── types.ts               # 状态类型定义
└── nodes/                 # 各个处理节点
    ├── welcomeNode.ts     # 欢迎消息
    ├── intentClassificationNode.ts  # 意图分类
    ├── brandingExtractionNode.ts    # 品牌提取
    ├── productRecommendationNode.ts # 产品推荐
    └── mockupGenerationNode.ts      # 效果图生成
```

---

## 项目结构

### 目录树说明

```
OEM_Agent/
├── 📁 apps/                    # 应用程序
│   ├── 📁 api/                 # 后端 API（Hono）
│   │   ├── Dockerfile          # API 容器化配置
│   │   ├── package.json        # API 依赖
│   │   └── src/                # API 源代码
│   │       ├── index.ts        # 入口文件
│   │       ├── routes/         # API 路由
│   │       └── middleware/     # 中间件
│   │
│   └── 📁 web/                 # 前端 Web（Next.js）
│       ├── Dockerfile          # Web 容器化配置
│       ├── package.json        # Web 依赖
│       ├── app/                # Next.js App Router
│       ├── components/         # React 组件
│       └── lib/                # 工具库
│
├── 📁 packages/                # 共享包（DDD 架构）
│   ├── 📁 domain/              # 领域层（业务实体）
│   │   └── src/
│   │       ├── entities/       # 实体类
│   │       ├── value-objects/  # 值对象
│   │       └── repositories/   # 仓储接口
│   │
│   ├── 📁 application/         # 应用层（用例）
│   │   └── src/
│   │       ├── use-cases/      # 业务用例
│   │       ├── dtos/           # 数据传输对象
│   │       └── interfaces/     # 接口定义
│   │
│   └── 📁 infrastructure/      # 基础设施层
│       └── src/
│           ├── agent/          # LangGraph Agent
│           ├── ai/             # AI 服务（OpenAI）
│           ├── database/       # 数据库连接
│           ├── repositories/   # 仓储实现
│           └── vector/         # 向量数据库（Weaviate）
│
├── 📁 Business/                # 业务文档
│   └── Feature/
│       └── Floated-AI-Agent/
│           ├── PRD_CURSOR.md   # ⚠️ 产品需求文档（不能删除）
│           ├── PRD_GEMINI.md
│           └── PRD_HUMAN.md
│
├── 📁 docs/                    # 技术文档
│   ├── INDEX.md                # 文档索引
│   ├── ARCHITECTURE.md         # 架构说明
│   ├── TechStack.md            # 技术栈
│   └── API_DOCUMENTATION.md    # API 文档
│
├── 📁 terraform/               # 基础设施即代码
│   ├── main.tf                 # Terraform 主配置
│   ├── variables.tf            # 变量定义
│   └── startup-script.sh       # GCP 启动脚本
│
├── 📁 docker/                  # Docker 配置
│   └── mongo-init/
│       └── init.js             # MongoDB 初始化脚本
│
├── docker-compose.yml          # Docker Compose 配置
├── turbo.json                  # Turborepo 配置
├── pnpm-workspace.yaml         # pnpm 工作空间配置
├── .env                        # 环境变量（包含 API 密钥）
└── README.md                   # 项目说明
```

---

## 核心概念

### 1. Domain-Driven Design (DDD)

**什么是 DDD？**
- 一种软件设计方法论，将业务逻辑和技术实现分离
- 项目按业务领域（Domain）组织，而不是技术层

**三层架构：**

```
┌─────────────────────────────────────┐
│    Domain Layer (领域层)             │
│  - 纯业务逻辑，不依赖任何技术框架     │
│  - 实体（Entity）、值对象（Value Object）│
│  Example: Product, Price, BrandingInfo│
└─────────────────────────────────────┘
            ↓ 依赖
┌─────────────────────────────────────┐
│  Application Layer (应用层)          │
│  - 业务用例（Use Cases）             │
│  - 协调领域对象完成业务流程          │
│  Example: SendMessageUseCase         │
└─────────────────────────────────────┘
            ↓ 依赖
┌─────────────────────────────────────┐
│ Infrastructure Layer (基础设施层)    │
│  - 技术实现（数据库、API、AI）        │
│  - 实现领域层定义的接口              │
│  Example: MongoRepository, OpenAI    │
└─────────────────────────────────────┘
```

**为什么用 DDD？**
- ✅ **业务逻辑独立**：不受技术框架变化影响
- ✅ **可测试性强**：可以单独测试业务逻辑
- ✅ **可维护性好**：职责清晰，易于理解

### 2. Monorepo（单体仓库）

**什么是 Monorepo？**
- 将多个相关项目放在一个 Git 仓库中管理
- 相反的是 Polyrepo（每个项目一个仓库）

**优势：**
- ✅ **代码共享容易**：packages 可以被 apps 直接引用
- ✅ **统一版本管理**：所有项目使用相同的依赖版本
- ✅ **原子化提交**：前后端改动可以一起提交

**在本项目中的应用：**

```typescript
// apps/api/src/routes/agent.ts 可以直接引用
import { SendMessageUseCase } from '@repo/application';
import { Product } from '@repo/domain';
import { LangGraphAgentService } from '@repo/infrastructure';

// 这些包都在同一个仓库中，通过 workspace 机制链接
```

### 3. Server-Sent Events (SSE)

**什么是 SSE？**
- 服务器主动向客户端推送数据的技术
- 类似于 WebSocket，但更简单（单向通信）

**为什么用 SSE？**
- AI 生成文本是逐字输出的（流式响应）
- 用户可以实时看到 AI 的思考过程

**实现示例：**

```typescript
// 后端（Hono）
app.post('/api/chat', async (c) => {
  return streamSSE(c, async (stream) => {
    for await (const chunk of aiStream) {
      await stream.writeSSE({
        data: JSON.stringify({ type: 'token', text: chunk }),
      });
    }
  });
});

// 前端（React）
const eventSource = new EventSource('/api/chat');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    setMessage(prev => prev + data.text);
  }
};
```

---

## 开发指南

### 环境要求

- **Node.js**: v20+
- **pnpm**: v8.15.0+
- **Docker**: v20+
- **Docker Compose**: v2.20+

### 本地开发步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd OEM_Agent
```

#### 2. 安装依赖

```bash
# 安装 pnpm（如果还没有）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp env.template .env

# 编辑 .env 文件，填入你的 OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here
```

#### 4. 启动服务

```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 5. 访问应用

- **前端 Web**: http://localhost:3000
- **后端 API**: http://localhost:4000
- **API 健康检查**: http://localhost:4000/health

### 开发工作流

#### 修改前端代码

```bash
# 1. 修改 apps/web/ 下的文件
# 2. 重新构建 Web 容器
docker-compose build web
docker-compose up -d web
```

#### 修改后端代码

```bash
# 1. 修改 apps/api/ 下的文件
# 2. 重新构建 API 容器
docker-compose build api
docker-compose up -d api
```

#### 修改共享包

```bash
# 1. 修改 packages/ 下的文件
# 2. 重新构建所有依赖它的容器
docker-compose build --no-cache
docker-compose up -d
```

### 常用命令

```bash
# 查看所有容器状态
docker-compose ps

# 查看特定容器日志
docker logs -f oem_agent-api-1
docker logs -f oem_agent-web-1

# 进入容器内部调试
docker exec -it oem_agent-api-1 sh

# 停止所有服务
docker-compose down

# 清理所有数据（包括数据库）
docker-compose down --volumes
```

---

## 部署指南

详见 [Terraform 部署指南](./TERRAFORM_DEPLOYMENT_CN.md)

---

## 常见问题

### Q1: 为什么使用 pnpm 而不是 npm/yarn？

**A:** pnpm 的优势：
- 🚀 **更快**：使用硬链接，安装速度快
- 💾 **更省空间**：所有项目共享依赖缓存
- 🔒 **更严格**：避免幽灵依赖（phantom dependencies）

### Q2: 为什么要用 Docker？

**A:** Docker 的优势：
- ✅ **环境一致性**：开发、测试、生产环境完全一致
- ✅ **隔离性**：每个服务独立运行，不会相互影响
- ✅ **易于部署**：一键启动所有服务

### Q3: LangGraph 和普通的 if-else 有什么区别？

**A:** LangGraph 的优势：
- ✅ **可视化**：可以用图形表示对话流程
- ✅ **状态管理**：自动管理对话状态和历史
- ✅ **可扩展**：容易添加新的对话分支

对比：

```typescript
// 普通 if-else（难以维护）
if (intent === 'branding') {
  if (hasBranding) {
    if (confirmed) {
      recommendProducts();
    }
  } else {
    extractBranding();
  }
}

// LangGraph（清晰易懂）
graph
  .addNode('extractBranding', extractBrandingNode)
  .addNode('recommendProducts', recommendProductsNode)
  .addConditionalEdges('extractBranding', (state) => 
    state.brandingConfirmed ? 'recommendProducts' : 'wait'
  );
```

---

## 下一步

- 📖 阅读 [LangGraph 详细指南](./LANGGRAPH_GUIDE_CN.md)
- 🚀 查看 [API 文档](./API_DOCUMENTATION.md)
- 🏗️ 学习 [架构设计](./ARCHITECTURE.md)
- ☁️ 部署到 [GCP](./TERRAFORM_DEPLOYMENT_CN.md)

---

**文档维护者：** AI Cursor  
**最后更新：** 2026-01-23  
**反馈：** 如有问题，请创建 GitHub Issue


