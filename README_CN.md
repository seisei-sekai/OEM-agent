# OEM Agent - AI 驱动的定制产品制造助手

**创建时间:** 2026-01-23-08:53 (东京时间)  
**最后更新:** 2026-01-23-08:53 (东京时间)  
**目的:** 完整的项目说明文档（中文版）

---

## 📖 目录

1. [项目简介](#项目简介)
2. [技术架构](#技术架构)
3. [核心技术栈详解](#核心技术栈详解)
4. [项目结构](#项目结构)
5. [快速开始](#快速开始)
6. [开发指南](#开发指南)
7. [部署到 GCP](#部署到-gcp)
8. [常见问题](#常见问题)

---

## 项目简介

OEM Agent 是一个基于 AI 的智能助手系统，帮助用户将创意转化为实际的定制产品。系统使用先进的 AI 技术（GPT-4）来理解用户需求，推荐合适的产品，并生成产品效果图。

### 主要功能

- 🤖 **智能对话助手**: 使用 LangGraph 构建的多步骤 AI 工作流
- 🎨 **品牌提取**: 自动从用户输入中提取品牌信息（logo、颜色等）
- 📦 **产品推荐**: 基于用户需求智能推荐合适的产品
- 🖼️ **效果图生成**: 使用 DALL-E 生成产品效果图
- 💬 **实时流式响应**: 使用 SSE（Server-Sent Events）实现流式对话

---

## 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                              │
│                     (Next.js 前端)                            │
│                    http://localhost:3000                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/SSE
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      API 服务器                               │
│                   (Hono + Node.js)                           │
│                  http://localhost:4000                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Application Layer (Use Cases)                       │  │
│  │  - StartChatSession                                  │  │
│  │  - SendMessage                                       │  │
│  │  - RecommendProducts                                 │  │
│  │  - ExtractBranding                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain Layer (Business Logic)                       │  │
│  │  - Entities: Product, ChatSession, Message           │  │
│  │  - Value Objects: Price, ColorCode                   │  │
│  │  - Services: CostCalculator                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Infrastructure Layer                                │  │
│  │  - Repositories (MongoDB)                            │  │
│  │  - AI Services (OpenAI)                              │  │
│  │  - Agent (LangGraph)                                 │  │
│  │  - Vector Search (Weaviate)                          │  │
│  └──────────────────────────────────────────────────────┘  │
└───────┬──────────────────────┬──────────────────────┬──────┘
        │                      │                      │
        ↓                      ↓                      ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   MongoDB    │      │   Weaviate   │      │   OpenAI     │
│  (数据库)     │      │  (向量搜索)   │      │  (AI 服务)   │
│ :27018       │      │  :9080       │      │  (云端)      │
└──────────────┘      └──────────────┘      └──────────────┘
```

### 设计模式

本项目采用 **领域驱动设计 (DDD)** 和 **清洁架构 (Clean Architecture)**:

1. **Domain Layer (领域层)**: 纯业务逻辑，不依赖任何外部框架
2. **Application Layer (应用层)**: 用例编排，协调领域对象
3. **Infrastructure Layer (基础设施层)**: 外部服务集成（数据库、AI 等）
4. **Presentation Layer (表现层)**: API 路由和前端界面

---

## 核心技术栈详解

### 1. Turborepo - Monorepo 管理工具

**什么是 Monorepo?**
- Monorepo 是将多个相关项目放在一个代码仓库中管理的方式
- 优点：代码共享方便、依赖管理统一、重构更容易

**Turborepo 的作用:**
```bash
# 一个命令构建所有包
pnpm build

# Turborepo 会自动:
# 1. 按依赖顺序构建 (domain → application → infrastructure → api)
# 2. 缓存构建结果 (没变化的包不重新构建)
# 3. 并行构建 (独立的包同时构建)
```

**项目中的 Monorepo 结构:**
```
oem-agent/
├── apps/              # 应用程序
│   ├── api/          # 后端 API (Hono)
│   └── web/          # 前端 (Next.js)
└── packages/          # 共享包
    ├── domain/       # 领域模型
    ├── application/  # 应用逻辑
    └── infrastructure/ # 基础设施
```

### 2. Hono - 轻量级 Web 框架

**为什么选择 Hono?**
- 🚀 **超快**: 比 Express 快 3-4 倍
- 📦 **轻量**: 核心只有 12KB
- 🔧 **简单**: API 设计直观，易于学习
- 🌐 **跨平台**: 可以运行在 Node.js、Cloudflare Workers、Deno 等

**基本用法示例:**
```typescript
import { Hono } from 'hono';

const app = new Hono();

// 定义路由
app.get('/hello', (c) => {
  return c.json({ message: 'Hello World!' });
});

// 中间件
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// 启动服务器
serve({ fetch: app.fetch, port: 4000 });
```

**项目中的使用:**
- `apps/api/src/index.ts`: 主应用
- `apps/api/src/routes/`: 各个路由模块
- `apps/api/src/middleware/`: CORS、日志、错误处理

### 3. Next.js - React 框架

**Next.js 的核心概念:**

#### App Router (新版路由系统)
```
app/
├── layout.tsx        # 全局布局
├── page.tsx          # 首页 (/)
└── about/
    └── page.tsx      # 关于页 (/about)
```

#### Server Components vs Client Components
```typescript
// Server Component (默认)
// 在服务器端渲染，可以直接访问数据库
async function ProductList() {
  const products = await db.products.findMany();
  return <div>{products.map(...)}</div>;
}

// Client Component (需要交互)
'use client';  // 必须声明
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### 数据获取
```typescript
// 服务器端获取数据
async function Page() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store' // 每次都获取新数据
  });
  const data = await res.json();
  return <div>{data}</div>;
}
```

**项目中的使用:**
- `apps/web/app/`: 页面和布局
- `apps/web/components/`: 可复用组件
- `apps/web/lib/`: 工具函数和状态管理

### 4. LangGraph.js - AI 工作流编排

**什么是 LangGraph?**
- LangGraph 是一个用于构建复杂 AI 工作流的框架
- 将 AI 任务分解为多个节点（Node），通过图（Graph）连接

**基本概念:**

#### 节点 (Node)
```typescript
// 一个节点就是一个处理函数
const intentClassificationNode = async (state: AgentState) => {
  // 使用 AI 分类用户意图
  const intent = await classifyIntent(state.messages);
  return { currentIntent: intent };
};
```

#### 状态 (State)
```typescript
// 整个工作流共享的状态
interface AgentState {
  messages: Message[];        // 对话历史
  currentIntent: string;      // 当前意图
  brandingInfo: BrandingInfo; // 品牌信息
  recommendedProducts: Product[]; // 推荐产品
}
```

#### 图 (Graph)
```typescript
const graph = new StateGraph({
  channels: { /* 状态定义 */ }
})
  .addNode('welcome', welcomeNode)
  .addNode('classify', intentClassificationNode)
  .addNode('extract', brandingExtractionNode)
  .addNode('recommend', productRecommendationNode)
  .addEdge('welcome', 'classify')
  .addConditionalEdges('classify', (state) => {
    // 根据意图选择下一个节点
    if (state.currentIntent === 'branding') return 'extract';
    if (state.currentIntent === 'product') return 'recommend';
    return 'conversation';
  });
```

**项目中的 AI 工作流:**
```
用户消息
    ↓
欢迎节点 (welcomeNode)
    ↓
意图分类 (intentClassificationNode)
    ↓
   ┌─────────────┬─────────────┐
   ↓             ↓             ↓
品牌提取    产品推荐      普通对话
   ↓             ↓             ↓
生成效果图    返回产品      聊天回复
```

### 5. TypeScript 类型系统

**为什么使用 TypeScript?**
- ✅ 类型安全：编译时发现错误
- 📝 更好的 IDE 支持：自动补全、重构
- 📚 代码即文档：类型就是最好的文档

**项目中的类型示例:**
```typescript
// 领域实体
class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: Price,
    public readonly category: ProductCategory
  ) {}
}

// DTO (数据传输对象)
interface CreateSessionDTO {
  userId?: string;
  context?: Record<string, unknown>;
}

// API 响应
interface ApiResponse<T> {
  data?: T;
  error?: string;
  timestamp: string;
}
```

---

## 项目结构

### 完整目录树

```
OEM_Agent/
├── apps/                          # 应用程序
│   ├── api/                       # 后端 API 服务
│   │   ├── src/
│   │   │   ├── di/               # 依赖注入
│   │   │   │   └── container.ts  # DI 容器配置
│   │   │   ├── middleware/       # 中间件
│   │   │   │   ├── cors.ts       # CORS 配置
│   │   │   │   ├── logger.ts     # 日志中间件
│   │   │   │   └── errorHandler.ts # 错误处理
│   │   │   ├── routes/           # API 路由
│   │   │   │   ├── agent.ts      # AI 助手路由
│   │   │   │   ├── sessions.ts   # 会话管理
│   │   │   │   ├── products.ts   # 产品相关
│   │   │   │   ├── branding.ts   # 品牌相关
│   │   │   │   └── health.ts     # 健康检查
│   │   │   └── index.ts          # 主入口
│   │   ├── Dockerfile            # Docker 配置
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                       # 前端应用
│       ├── app/                   # Next.js App Router
│       │   ├── layout.tsx         # 全局布局
│       │   ├── page.tsx           # 首页
│       │   └── globals.css        # 全局样式
│       ├── components/            # React 组件
│       │   └── floating-agent/    # 浮动 AI 助手
│       │       ├── FloatingAIAgent.tsx  # 主组件
│       │       ├── FloatingButton.tsx   # 浮动按钮
│       │       ├── ChatModal.tsx        # 对话弹窗
│       │       ├── ChatSidebar.tsx      # 侧边栏
│       │       ├── MessageList.tsx      # 消息列表
│       │       └── ChatInput.tsx        # 输入框
│       ├── lib/                   # 工具库
│       │   ├── api-client.ts      # API 客户端
│       │   └── store.ts           # 状态管理 (Zustand)
│       ├── Dockerfile
│       ├── next.config.js
│       ├── package.json
│       └── tailwind.config.ts     # Tailwind CSS 配置
│
├── packages/                      # 共享包
│   ├── domain/                    # 领域层
│   │   ├── src/
│   │   │   ├── entities/          # 实体
│   │   │   │   ├── Product.ts
│   │   │   │   ├── ChatSession.ts
│   │   │   │   ├── Message.ts
│   │   │   │   └── BrandingInfo.ts
│   │   │   ├── value-objects/     # 值对象
│   │   │   │   ├── Price.ts
│   │   │   │   ├── ColorCode.ts
│   │   │   │   ├── SessionId.ts
│   │   │   │   └── ProductCategory.ts
│   │   │   ├── repositories/      # 仓储接口
│   │   │   │   ├── IChatSessionRepository.ts
│   │   │   │   ├── IProductCatalogRepository.ts
│   │   │   │   └── IBrandingRepository.ts
│   │   │   ├── services/          # 领域服务
│   │   │   │   └── CostCalculator.ts
│   │   │   └── events/            # 领域事件
│   │   │       ├── SessionStarted.ts
│   │   │       ├── MessageSent.ts
│   │   │       └── ProductsRecommended.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── application/               # 应用层
│   │   ├── src/
│   │   │   ├── use-cases/         # 用例
│   │   │   │   ├── StartChatSessionUseCase.ts
│   │   │   │   ├── SendMessageUseCase.ts
│   │   │   │   ├── LoadChatHistoryUseCase.ts
│   │   │   │   ├── ExtractBrandingUseCase.ts
│   │   │   │   ├── RecommendProductsUseCase.ts
│   │   │   │   └── GenerateMockupUseCase.ts
│   │   │   ├── interfaces/        # 接口定义
│   │   │   │   ├── IAgentService.ts
│   │   │   │   ├── IBrandingExtractorService.ts
│   │   │   │   ├── IMockupGeneratorService.ts
│   │   │   │   └── IProductSearchService.ts
│   │   │   └── dtos/              # 数据传输对象
│   │   │       ├── ChatDTO.ts
│   │   │       ├── ProductDTO.ts
│   │   │       └── BrandingDTO.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── infrastructure/            # 基础设施层
│       ├── src/
│       │   ├── agent/             # LangGraph AI 工作流
│       │   │   ├── graph.ts       # 工作流定义
│       │   │   ├── AgentService.ts
│       │   │   ├── types.ts
│       │   │   └── nodes/         # 工作流节点
│       │   │       ├── welcomeNode.ts
│       │   │       ├── intentClassificationNode.ts
│       │   │       ├── brandingExtractionNode.ts
│       │   │       ├── productRecommendationNode.ts
│       │   │       └── conversationNode.ts
│       │   ├── ai/                # AI 服务
│       │   │   ├── OpenAIService.ts
│       │   │   ├── BrandingExtractorService.ts
│       │   │   └── MockupGeneratorService.ts
│       │   ├── repositories/      # 仓储实现
│       │   │   ├── MongoChatSessionRepository.ts
│       │   │   ├── MongoProductCatalogRepository.ts
│       │   │   └── MongoBrandingRepository.ts
│       │   ├── vector/            # 向量搜索
│       │   │   └── WeaviateProductSearch.ts
│       │   ├── database/          # 数据库
│       │   │   └── mongodb.ts
│       │   └── scripts/           # 工具脚本
│       │       └── seed-simple.ts # 数据库初始化
│       ├── package.json
│       └── tsconfig.json
│
├── terraform/                     # Terraform 配置
│   ├── main.tf                    # 主配置
│   ├── variables.tf               # 变量定义
│   ├── outputs.tf                 # 输出定义
│   ├── startup-script.sh          # VM 启动脚本
│   └── terraform.tfvars.example   # 变量示例
│
├── docker/                        # Docker 相关
│   └── mongo-init/
│       └── init.js                # MongoDB 初始化脚本
│
├── docs/                          # 文档
│   ├── ARCHITECTURE.md            # 架构文档
│   ├── API_DOCUMENTATION.md       # API 文档
│   ├── DEPLOYMENT.md              # 部署文档
│   └── TEST_REPORT.md             # 测试报告
│
├── docker-compose.yml             # Docker Compose 配置
├── turbo.json                     # Turborepo 配置
├── pnpm-workspace.yaml            # PNPM 工作区配置
├── package.json                   # 根 package.json
├── tsconfig.json                  # 根 TypeScript 配置
├── .env                           # 环境变量 (不提交)
├── env.template                   # 环境变量模板
├── start-demo.sh                  # 启动脚本
├── stop-demo.sh                   # 停止脚本
└── README_CN.md                   # 本文档
```

### 关键文件说明

#### 根目录配置文件

**`turbo.json`** - Turborepo 配置
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // 先构建依赖包
      "outputs": ["dist/**"]     // 缓存输出目录
    },
    "dev": {
      "cache": false,            // 开发模式不缓存
      "persistent": true         // 持续运行
    }
  }
}
```

**`pnpm-workspace.yaml`** - PNPM 工作区
```yaml
packages:
  - 'apps/*'      # 所有应用
  - 'packages/*'  # 所有共享包
```

**`docker-compose.yml`** - 服务编排
```yaml
services:
  mongodb:    # 数据库
  weaviate:   # 向量搜索
  api:        # 后端 API
  web:        # 前端
```

---

## 快速开始

### 前置要求

1. **Node.js** >= 20.0.0
   ```bash
   # 检查版本
   node --version
   
   # 如果需要安装，推荐使用 nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

2. **PNPM** >= 8.0.0
   ```bash
   # 安装 pnpm
   npm install -g pnpm
   
   # 或使用 corepack (Node.js 内置)
   corepack enable pnpm
   ```

3. **Docker** 和 **Docker Compose**
   ```bash
   # macOS
   brew install --cask docker
   
   # 启动 Docker Desktop
   open -a Docker
   
   # 验证安装
   docker --version
   docker-compose --version
   ```

4. **OpenAI API Key**
   - 访问 https://platform.openai.com/api-keys
   - 创建新的 API key
   - 保存好，后面会用到

### 安装步骤

#### 1. 克隆项目
```bash
cd ~/Desktop
git clone <your-repo-url> OEM_Agent
cd OEM_Agent
```

#### 2. 安装依赖
```bash
# 安装所有包的依赖 (包括 apps 和 packages)
pnpm install
```

这个命令会:
- 安装根目录的依赖
- 安装 `apps/api` 的依赖
- 安装 `apps/web` 的依赖
- 安装 `packages/domain` 的依赖
- 安装 `packages/application` 的依赖
- 安装 `packages/infrastructure` 的依赖
- 创建包之间的链接（workspace 协议）

#### 3. 配置环境变量
```bash
# 复制环境变量模板
cp env.template .env

# 编辑 .env 文件
nano .env  # 或使用你喜欢的编辑器
```

填入你的配置:
```bash
# API 配置
PORT=4000
NODE_ENV=development

# 数据库配置
MONGODB_URL=mongodb://localhost:27018
MONGODB_DB_NAME=oem_agent

# 向量数据库配置
WEAVIATE_URL=http://localhost:9080

# OpenAI API 配置
OPENAI_API_KEY=sk-your-actual-api-key-here  # 替换为你的 API key

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### 4. 构建所有包
```bash
# 构建所有包 (按依赖顺序)
pnpm build
```

这会按顺序构建:
1. `@repo/domain` (没有依赖)
2. `@repo/application` (依赖 domain)
3. `@repo/infrastructure` (依赖 domain 和 application)
4. `@repo/api` (依赖所有包)
5. `@repo/web` (依赖 domain)

#### 5. 启动服务

**方式一: 使用启动脚本 (推荐)**
```bash
# 启动所有服务
./start-demo.sh

# 这会启动:
# - MongoDB (端口 27018)
# - Weaviate (端口 9080)
# - API 服务器 (端口 4000)
```

**方式二: 手动启动**
```bash
# 终端 1: 启动基础设施
docker-compose up -d mongodb weaviate

# 终端 2: 启动 API
cd apps/api
pnpm start

# 终端 3: 启动前端
cd apps/web
pnpm dev
```

#### 6. 初始化数据库
```bash
# 填充示例产品数据
node packages/infrastructure/dist/scripts/seed-simple.js
```

#### 7. 验证安装

打开浏览器访问:
- **前端**: http://localhost:3000
- **API 健康检查**: http://localhost:4000/health
- **MongoDB**: localhost:27018
- **Weaviate**: http://localhost:9080

测试 API:
```bash
# 健康检查
curl http://localhost:4000/health

# 创建会话
curl -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# 获取产品列表
curl http://localhost:4000/api/products
```

### 停止服务

```bash
# 使用停止脚本
./stop-demo.sh

# 或手动停止
docker-compose down
pkill -f "node.*dist/index.js"
pkill -f "next"
```

---

## 开发指南

### 开发工作流

#### 1. 创建新功能

**场景: 添加一个新的产品类别**

```bash
# 1. 在 domain 层添加新的值对象
# packages/domain/src/value-objects/ProductMaterial.ts
export class ProductMaterial {
  constructor(public readonly value: string) {
    if (!['cotton', 'polyester', 'silk'].includes(value)) {
      throw new Error('Invalid material');
    }
  }
}

# 2. 更新 Product 实体
# packages/domain/src/entities/Product.ts
import { ProductMaterial } from '../value-objects/ProductMaterial.js';

export class Product {
  constructor(
    // ... 其他属性
    public readonly material: ProductMaterial
  ) {}
}

# 3. 重新构建
pnpm build

# 4. 运行测试
pnpm test
```

#### 2. 添加新的 API 端点

```typescript
// apps/api/src/routes/materials.ts
import { Hono } from 'hono';

const materialsRoute = new Hono();

materialsRoute.get('/', async (c) => {
  const materials = ['cotton', 'polyester', 'silk'];
  return c.json({ materials });
});

export default materialsRoute;

// apps/api/src/index.ts
import materialsRoute from './routes/materials.js';

app.route('/api/materials', materialsRoute);
```

#### 3. 添加前端组件

```typescript
// apps/web/components/MaterialSelector.tsx
'use client';

import { useState } from 'react';

export function MaterialSelector() {
  const [material, setMaterial] = useState('cotton');
  
  return (
    <select value={material} onChange={(e) => setMaterial(e.target.value)}>
      <option value="cotton">棉</option>
      <option value="polyester">涤纶</option>
      <option value="silk">丝绸</option>
    </select>
  );
}
```

### 常用命令

```bash
# 开发模式 (所有包同时监听变化)
pnpm dev

# 构建所有包
pnpm build

# 只构建特定包
pnpm --filter @repo/domain build
pnpm --filter @repo/api build

# 运行测试
pnpm test

# 运行特定包的测试
pnpm --filter @repo/domain test

# 类型检查
pnpm type-check

# 代码格式化
pnpm format

# 清理所有构建产物
pnpm clean

# 添加依赖到特定包
pnpm --filter @repo/api add express
pnpm --filter @repo/web add -D @types/react

# 查看依赖树
pnpm list --depth=0
```

### 调试技巧

#### 1. 调试 API 服务器

在 VS Code 中创建 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "program": "${workspaceFolder}/apps/api/dist/index.js",
      "preLaunchTask": "build-api",
      "env": {
        "PORT": "4000",
        "MONGODB_URL": "mongodb://localhost:27018"
      }
    }
  ]
}
```

#### 2. 查看日志

```bash
# API 日志
tail -f /tmp/oem-api.log

# MongoDB 日志
docker-compose logs -f mongodb

# Weaviate 日志
docker-compose logs -f weaviate
```

#### 3. 数据库调试

```bash
# 连接到 MongoDB
mongosh mongodb://localhost:27018/oem_agent

# 查看集合
show collections

# 查询数据
db.products.find().pretty()
db.chat_sessions.find().pretty()

# 删除所有数据
db.products.deleteMany({})
```

### 测试策略

#### 1. 单元测试 (Vitest)

```typescript
// packages/domain/src/value-objects/__tests__/Price.test.ts
import { describe, it, expect } from 'vitest';
import { Price } from '../Price.js';

describe('Price', () => {
  it('should create a valid price', () => {
    const price = Price.create({ amount: 100, currency: 'USD' });
    expect(price.amount).toBe(100);
    expect(price.currency).toBe('USD');
  });

  it('should throw error for negative amount', () => {
    expect(() => {
      Price.create({ amount: -10, currency: 'USD' });
    }).toThrow('Price amount must be non-negative');
  });
});
```

运行测试:
```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test --coverage
```

#### 2. 集成测试

```typescript
// apps/api/src/routes/__tests__/products.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import productsRoute from '../products.js';

describe('Products API', () => {
  let app: Hono;

  beforeAll(() => {
    app = new Hono();
    app.route('/api/products', productsRoute);
  });

  it('should return products list', async () => {
    const res = await app.request('/api/products');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.products).toBeInstanceOf(Array);
  });
});
```

#### 3. 端到端测试

```bash
# 测试完整流程
./test-e2e.sh

# 或手动测试
curl -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}' | jq .

# 保存 session ID
SESSION_ID="<从上面获取>"

# 发送消息
curl -X POST http://localhost:4000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"我想定制T恤\"}"
```

---

## 部署到 GCP

### 架构概览

```
Internet
    ↓
Cloud Load Balancer (HTTPS)
    ↓
Cloud Run (容器化应用)
    ├── API Service
    └── Web Service
    ↓
Cloud SQL (MongoDB)
Cloud Memorystore (Redis - 可选)
```

### 方式一: 使用 Terraform (推荐)

#### 1. 准备工作

```bash
# 安装 Terraform
brew install terraform

# 安装 Google Cloud SDK
brew install --cask google-cloud-sdk

# 登录 GCP
gcloud auth login
gcloud auth application-default login

# 设置项目
gcloud config set project YOUR_PROJECT_ID
```

#### 2. 配置 Terraform

```bash
cd terraform

# 复制变量模板
cp terraform.tfvars.example terraform.tfvars

# 编辑变量
nano terraform.tfvars
```

填入配置:
```hcl
project_id = "your-gcp-project-id"
region     = "asia-northeast1"  # 东京
zone       = "asia-northeast1-a"

# VM 配置
machine_type = "e2-medium"
disk_size_gb = 20

# 应用配置
app_port     = 4000
mongodb_port = 27018

# 环境变量
openai_api_key = "sk-your-api-key"
```

#### 3. 部署

```bash
# 初始化 Terraform
terraform init

# 查看将要创建的资源
terraform plan

# 执行部署
terraform apply

# 确认部署
# 输入 'yes'
```

部署完成后会输出:
```
Outputs:

instance_ip = "35.xxx.xxx.xxx"
instance_name = "oem-agent-vm"
ssh_command = "gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a"
```

#### 4. 验证部署

```bash
# SSH 到服务器
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a

# 检查服务状态
sudo systemctl status oem-agent

# 查看日志
sudo journalctl -u oem-agent -f

# 测试 API
curl http://localhost:4000/health
```

#### 5. 访问应用

```bash
# 获取外部 IP
EXTERNAL_IP=$(terraform output -raw instance_ip)

# 访问应用
curl http://$EXTERNAL_IP:4000/health
open http://$EXTERNAL_IP:3000
```

### 方式二: 使用 Cloud Run (无服务器)

#### 1. 构建 Docker 镜像

```bash
# 构建 API 镜像
docker build -f apps/api/Dockerfile -t gcr.io/YOUR_PROJECT_ID/oem-api:latest .

# 构建 Web 镜像
docker build -f apps/web/Dockerfile -t gcr.io/YOUR_PROJECT_ID/oem-web:latest .

# 推送到 Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/oem-api:latest
docker push gcr.io/YOUR_PROJECT_ID/oem-web:latest
```

#### 2. 部署到 Cloud Run

```bash
# 部署 API
gcloud run deploy oem-api \
  --image gcr.io/YOUR_PROJECT_ID/oem-api:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URL=mongodb://your-mongodb-url,OPENAI_API_KEY=sk-xxx"

# 部署 Web
gcloud run deploy oem-web \
  --image gcr.io/YOUR_PROJECT_ID/oem-web:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://oem-api-xxx.run.app"
```

#### 3. 设置 MongoDB (Cloud SQL 或 MongoDB Atlas)

**选项 A: MongoDB Atlas (推荐)**
```bash
# 1. 访问 https://cloud.mongodb.com/
# 2. 创建免费集群
# 3. 获取连接字符串
# 4. 更新 Cloud Run 环境变量

gcloud run services update oem-api \
  --update-env-vars "MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/oem_agent"
```

**选项 B: 自托管 MongoDB**
```bash
# 创建 VM 运行 MongoDB
gcloud compute instances create mongodb-vm \
  --machine-type=e2-medium \
  --zone=asia-northeast1-a \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud

# SSH 到 VM 并安装 MongoDB
gcloud compute ssh mongodb-vm --zone=asia-northeast1-a

# 在 VM 上安装 MongoDB
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
```

### 方式三: 使用 Google Kubernetes Engine (GKE)

#### 1. 创建 GKE 集群

```bash
# 创建集群
gcloud container clusters create oem-agent-cluster \
  --zone asia-northeast1-a \
  --num-nodes 2 \
  --machine-type e2-medium

# 获取凭证
gcloud container clusters get-credentials oem-agent-cluster \
  --zone asia-northeast1-a
```

#### 2. 创建 Kubernetes 配置

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oem-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: oem-api
  template:
    metadata:
      labels:
        app: oem-api
    spec:
      containers:
      - name: api
        image: gcr.io/YOUR_PROJECT_ID/oem-api:latest
        ports:
        - containerPort: 4000
        env:
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: oem-secrets
              key: mongodb-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: oem-secrets
              key: openai-key
---
apiVersion: v1
kind: Service
metadata:
  name: oem-api-service
spec:
  type: LoadBalancer
  selector:
    app: oem-api
  ports:
  - port: 80
    targetPort: 4000
```

#### 3. 部署到 GKE

```bash
# 创建 secrets
kubectl create secret generic oem-secrets \
  --from-literal=mongodb-url='mongodb://...' \
  --from-literal=openai-key='sk-...'

# 部署应用
kubectl apply -f k8s/deployment.yaml

# 查看状态
kubectl get pods
kubectl get services

# 获取外部 IP
kubectl get service oem-api-service
```

### CI/CD 配置

#### GitHub Actions

创建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
    
    - name: Build and Push Docker Images
      run: |
        docker build -f apps/api/Dockerfile -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/oem-api:${{ github.sha }} .
        docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/oem-api:${{ github.sha }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy oem-api \
          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/oem-api:${{ github.sha }} \
          --platform managed \
          --region asia-northeast1 \
          --allow-unauthenticated
```

### 监控和日志

#### 1. 查看日志

```bash
# Cloud Run 日志
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=oem-api" \
  --limit 50 \
  --format json

# VM 日志
gcloud compute ssh oem-agent-vm --zone=asia-northeast1-a \
  --command "sudo journalctl -u oem-agent -n 100"
```

#### 2. 设置监控

```bash
# 创建健康检查
gcloud compute health-checks create http oem-health-check \
  --port 4000 \
  --request-path /health

# 创建告警
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="OEM API Down" \
  --condition-display-name="API Unhealthy" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=60s
```

### 成本优化

#### 1. 使用 Cloud Run (按需付费)
- 只在有请求时运行
- 自动扩缩容
- 免费额度: 每月 200 万请求

#### 2. 使用 Preemptible VMs
```hcl
# terraform/main.tf
resource "google_compute_instance" "vm" {
  scheduling {
    preemptible       = true
    automatic_restart = false
  }
}
```

#### 3. 使用 Cloud CDN
```bash
gcloud compute backend-services update oem-backend \
  --enable-cdn \
  --cache-mode CACHE_ALL_STATIC
```

---

## 常见问题

### 安装和配置

**Q: `pnpm install` 失败怎么办?**
```bash
# 清理缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules packages/*/node_modules apps/*/node_modules

# 重新安装
pnpm install
```

**Q: TypeScript 编译错误?**
```bash
# 清理所有构建产物
pnpm clean

# 重新构建
pnpm build
```

**Q: Docker 容器启动失败?**
```bash
# 查看日志
docker-compose logs mongodb
docker-compose logs weaviate

# 重启容器
docker-compose restart mongodb

# 完全重建
docker-compose down -v
docker-compose up -d
```

### 开发问题

**Q: 修改代码后没有生效?**
```bash
# 确保重新构建了包
pnpm --filter @repo/domain build

# 如果是 API，需要重启
pkill -f "node.*dist/index.js"
cd apps/api && pnpm start
```

**Q: 前端无法连接 API?**
```bash
# 检查 API 是否运行
curl http://localhost:4000/health

# 检查 CORS 配置
# apps/api/src/middleware/cors.ts

# 检查环境变量
echo $NEXT_PUBLIC_API_URL
```

**Q: MongoDB 连接失败?**
```bash
# 检查 MongoDB 是否运行
docker ps | grep mongodb

# 测试连接
mongosh mongodb://localhost:27018/oem_agent

# 检查端口
lsof -i :27018
```

### 部署问题

**Q: Terraform 部署失败?**
```bash
# 查看详细错误
terraform apply -var-file=terraform.tfvars

# 检查 GCP 权限
gcloud auth list
gcloud projects get-iam-policy YOUR_PROJECT_ID

# 启用必要的 API
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
```

**Q: Cloud Run 内存不足?**
```bash
# 增加内存限制
gcloud run services update oem-api \
  --memory 1Gi \
  --cpu 2
```

**Q: 如何回滚部署?**
```bash
# Terraform
terraform destroy
terraform apply

# Cloud Run
gcloud run services update-traffic oem-api \
  --to-revisions PREVIOUS_REVISION=100
```

### 性能问题

**Q: API 响应慢?**
```bash
# 检查数据库索引
mongosh mongodb://localhost:27018/oem_agent
db.products.getIndexes()

# 添加索引
db.products.createIndex({ category: 1, price: 1 })

# 启用查询分析
db.setProfilingLevel(2)
db.system.profile.find().pretty()
```

**Q: 前端加载慢?**
```bash
# 分析构建大小
cd apps/web
pnpm build
npx @next/bundle-analyzer

# 优化建议:
# 1. 使用动态导入
# 2. 启用图片优化
# 3. 使用 CDN
```

---

## 总结

### 项目亮点

1. ✅ **现代化架构**: 使用 DDD 和清洁架构
2. ✅ **类型安全**: 全栈 TypeScript
3. ✅ **可扩展**: Monorepo + Turborepo
4. ✅ **AI 驱动**: LangGraph + GPT-4
5. ✅ **容器化**: Docker + Docker Compose
6. ✅ **云原生**: 支持 GCP 部署
7. ✅ **测试完善**: 单元测试 + 集成测试

### 下一步

- [ ] 添加用户认证 (JWT)
- [ ] 实现支付集成 (Stripe)
- [ ] 添加订单管理
- [ ] 实现实时通知 (WebSocket)
- [ ] 添加管理后台
- [ ] 性能优化和缓存
- [ ] 完善监控和日志
- [ ] 编写更多测试

### 学习资源

- **Turborepo**: https://turbo.build/repo/docs
- **Hono**: https://hono.dev/
- **Next.js**: https://nextjs.org/docs
- **LangGraph**: https://langchain-ai.github.io/langgraphjs/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **DDD**: https://martinfowler.com/bliki/DomainDrivenDesign.html
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

---

**祝你开发愉快！🚀**

如有问题，请查看 `docs/` 目录下的其他文档或提交 Issue。


