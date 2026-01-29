# DDD 战略设计图

基于项目的 DDD 架构手工绘制的战略设计图。

---

## 架构层级关系

```mermaid
graph TB
    subgraph "Core Domain - 核心领域"
        Domain[Domain Layer<br/>实体、值对象、领域服务<br/>Product, ChatSession, BrandingInfo]
    end
    
    subgraph "Supporting Subdomain - 支持子域"
        Application[Application Layer<br/>用例和应用服务<br/>SendMessage, GenerateMockup]
    end
    
    subgraph "Generic Subdomain - 通用子域"
        Infrastructure[Infrastructure Layer<br/>技术实现<br/>MongoDB, Weaviate, OpenAI]
    end
    
    subgraph "Applications - 应用层"
        API[API Service<br/>Hono REST API<br/>Port: 3001]
        Web[Web App<br/>Next.js<br/>Port: 3000]
    end
    
    %% Dependencies
    Application -->|依赖| Domain
    Infrastructure -.->|实现接口| Domain
    API -->|使用| Application
    API -->|DI注入| Infrastructure
    Web -->|调用| API
    
    %% Styles
    style Domain fill:#ffcccc,stroke:#cc0000,stroke-width:3px
    style Application fill:#ccffcc,stroke:#00cc00,stroke-width:3px
    style Infrastructure fill:#ccccff,stroke:#0000cc,stroke-width:3px
    style API fill:#ffffcc,stroke:#cccc00,stroke-width:2px
    style Web fill:#ffccff,stroke:#cc00cc,stroke-width:2px
```

---

## 领域模型关系

```mermaid
classDiagram
    class Product {
        +UUID id
        +String name
        +Price price
        +ProductCategory category
        +ColorCode color
        +String description
        +calculateDiscount()
        +isAvailable()
    }
    
    class Price {
        +Number amount
        +String currency
        +isValid()
        +format()
    }
    
    class ColorCode {
        +String hex
        +isValid()
        +toRGB()
    }
    
    class ProductCategory {
        <<enumeration>>
        APPAREL
        ACCESSORIES
        HOME_GOODS
        CUSTOM
    }
    
    class ChatSession {
        +SessionId id
        +Message[] messages
        +Date createdAt
        +addMessage(Message)
        +getHistory()
    }
    
    class Message {
        +UUID id
        +String content
        +String role
        +Date timestamp
    }
    
    class BrandingInfo {
        +String businessName
        +LogoImage logo
        +ColorCode primaryColor
        +ColorCode secondaryColor
        +String description
    }
    
    class LogoImage {
        +String url
        +String alt
        +isValid()
    }
    
    Product --> Price : has
    Product --> ColorCode : has
    Product --> ProductCategory : categorized by
    ChatSession --> Message : contains many
    BrandingInfo --> LogoImage : has
    BrandingInfo --> ColorCode : uses
    
    style Product fill:#ffcccc
    style ChatSession fill:#ffcccc
    style BrandingInfo fill:#ffcccc
    style Price fill:#ffe6e6
    style ColorCode fill:#ffe6e6
    style Message fill:#ffe6e6
    style LogoImage fill:#ffe6e6
```

---

## 核心用例流程

### 发送消息用例

```mermaid
sequenceDiagram
    actor User
    participant Web as Web App
    participant API as API Server
    participant UC as SendMessageUseCase
    participant Session as ChatSession
    participant Agent as AgentService
    participant LangGraph as LangGraph
    
    User->>Web: 输入消息
    Web->>API: POST /api/sessions/{id}/messages
    API->>UC: execute(sessionId, message)
    UC->>Session: addMessage(message)
    UC->>Agent: processMessage(session)
    Agent->>LangGraph: 执行对话流程
    
    alt 产品推荐
        LangGraph->>LangGraph: intentClassificationNode
        LangGraph->>LangGraph: productRecommendationNode
    else 品牌提取
        LangGraph->>LangGraph: brandingExtractionNode
    else 生成 Mockup
        LangGraph->>LangGraph: mockupGenerationNode
    else 普通对话
        LangGraph->>LangGraph: conversationNode
    end
    
    LangGraph-->>Agent: 响应流
    Agent-->>UC: 结果
    UC-->>API: DTO
    API-->>Web: SSE Stream
    Web-->>User: 实时显示
    
    style User fill:#e1f5ff
    style Session fill:#ffcccc
    style LangGraph fill:#ccccff
```

---

## 应用服务依赖图

```mermaid
graph LR
    subgraph "Use Cases"
        UC1[SendMessageUseCase]
        UC2[StartChatSessionUseCase]
        UC3[GenerateMockupUseCase]
        UC4[ExtractBrandingUseCase]
        UC5[RecommendProductsUseCase]
    end
    
    subgraph "Domain Services"
        CS[CostCalculator]
    end
    
    subgraph "Domain Entities"
        ChatSession[ChatSession]
        BrandingInfo[BrandingInfo]
        Product[Product]
    end
    
    subgraph "Infrastructure Services"
        Agent[AgentService]
        Mockup[MockupGenerator]
        Branding[BrandingExtractor]
        Vector[VectorSearch]
    end
    
    UC1 --> ChatSession
    UC1 --> Agent
    UC2 --> ChatSession
    UC3 --> Mockup
    UC4 --> Branding
    UC4 --> BrandingInfo
    UC5 --> Vector
    UC5 --> Product
    
    Agent -.->|实现| IAgentService
    Mockup -.->|实现| IMockupGenerator
    Branding -.->|实现| IBrandingExtractor
    Vector -.->|实现| IVectorSearch
    
    style UC1 fill:#ccffcc
    style UC2 fill:#ccffcc
    style UC3 fill:#ccffcc
    style UC4 fill:#ccffcc
    style UC5 fill:#ccffcc
    style ChatSession fill:#ffcccc
    style BrandingInfo fill:#ffcccc
    style Product fill:#ffcccc
    style Agent fill:#ccccff
    style Mockup fill:#ccccff
    style Branding fill:#ccccff
    style Vector fill:#ccccff
```

---

## LangGraph 状态流转

```mermaid
stateDiagram-v2
    [*] --> Welcome: 新会话
    
    Welcome --> InitialRouter: 欢迎消息
    InitialRouter --> IntentClassification: 解析意图
    
    IntentClassification --> ProductRecommendation: 产品查询
    IntentClassification --> BrandingExtraction: 品牌信息
    IntentClassification --> Conversation: 普通对话
    
    ProductRecommendation --> MockupGeneration: 生成 Mockup
    BrandingExtraction --> MockupGeneration: 生成 Mockup
    Conversation --> InitialRouter: 继续对话
    
    MockupGeneration --> [*]: 完成
    
    note right of IntentClassification
        使用 LLM 分类用户意图：
        - product_inquiry
        - branding_info
        - general_conversation
    end note
    
    note right of ProductRecommendation
        向量搜索 Weaviate
        返回相关产品
    end note
    
    note right of BrandingExtraction
        从用户输入提取：
        - 品牌名称
        - Logo URL
        - 主色调
    end note
```

---

## 基础设施依赖

```mermaid
graph TB
    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4, DALL-E]
        MongoDB[(MongoDB<br/>数据持久化)]
        Weaviate[(Weaviate<br/>向量搜索)]
    end
    
    subgraph "Infrastructure Layer"
        Agent[AgentService<br/>LangGraph 编排]
        AI[OpenAI Service<br/>LLM 调用]
        Mockup[MockupGenerator<br/>DALL-E 生成]
        Branding[BrandingExtractor<br/>信息提取]
        VectorDB[VectorSearch<br/>产品搜索]
        
        subgraph "Repositories"
            ChatRepo[ChatSessionRepository]
            BrandRepo[BrandingRepository]
            ProductRepo[ProductCatalogRepository]
        end
    end
    
    Agent --> AI
    Mockup --> OpenAI
    Branding --> AI
    VectorDB --> Weaviate
    
    ChatRepo --> MongoDB
    BrandRepo --> MongoDB
    ProductRepo --> MongoDB
    
    style OpenAI fill:#74aa9c
    style MongoDB fill:#4db33d
    style Weaviate fill:#ff6b6b
    style Agent fill:#ccccff
    style AI fill:#ccccff
    style Mockup fill:#ccccff
    style Branding fill:#ccccff
    style VectorDB fill:#ccccff
```

---

## 部署架构

```mermaid
graph TB
    subgraph "Client"
        Browser[Browser<br/>用户浏览器]
    end
    
    subgraph "Docker Compose - Local Dev"
        Web[web:3000<br/>Next.js]
        API[api:3001<br/>Hono API]
        Mongo[mongo:27017<br/>MongoDB]
        Weaviate[weaviate:8080<br/>向量数据库]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
    end
    
    Browser --> Web
    Browser --> API
    Web --> API
    API --> Mongo
    API --> Weaviate
    API --> OpenAI
    
    style Browser fill:#e1f5ff
    style Web fill:#ffccff
    style API fill:#ffffcc
    style Mongo fill:#4db33d,color:#fff
    style Weaviate fill:#ff6b6b,color:#fff
    style OpenAI fill:#74aa9c,color:#fff
```

---

## 说明

这些图表是手工编写的，用于：
- 📚 **文档说明** - 在 README 和设计文档中使用
- 👥 **团队沟通** - 新成员 onboarding
- 🎯 **架构决策** - ADR (Architecture Decision Record)
- 📊 **演示展示** - 向 stakeholder 解释架构

### 查看方式

1. **GitHub** - 直接在 GitHub 上查看此文件，Mermaid 会自动渲染
2. **VS Code** - 安装 Markdown Preview Mermaid 插件
3. **在线** - 复制代码到 https://mermaid.live/

### 更新

这些图表需要手动更新。当架构发生变化时，请及时更新对应的图表。

---

**相关文档：**
- [DDD_MERMAID_GUIDE.md](../DDD_MERMAID_GUIDE.md) - Mermaid 完整指南
- [DDD_VISUALIZATION.md](../DDD_VISUALIZATION.md) - 可视化工具文档
- [ARCHITECTURE.md](../ARCHITECTURE.md) - 架构文档
