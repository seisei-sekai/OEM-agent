# DDD Mermaid 图表生成指南

**Created:** 2026-01-29-22:05 (Tokyo Time)  
**Last Updated:** 2026-01-29-22:05 (Tokyo Time)  
**Purpose:** 使用 Mermaid 生成 DDD 架构图的完整指南

---

## 🎯 三种方案对比

| 方案 | 工具 | 复杂度 | 推荐度 | 特点 |
|------|------|--------|--------|------|
| **方案 1** | dependency-cruiser | ⭐ | ⭐⭐⭐⭐⭐ | 已安装，一行命令 |
| **方案 2** | typescript-graph | ⭐⭐ | ⭐⭐⭐⭐ | 专业 TS 工具，更多选项 |
| **方案 3** | 手写 Mermaid | ⭐⭐⭐ | ⭐⭐⭐ | 最灵活，适合战略设计 |

---

## 方案 1：dependency-cruiser 生成 Mermaid（推荐）⭐

### 已安装且可用

```bash
# 生成 Mermaid 格式的依赖图
pnpm ddd:mermaid

# 输出文件
docs/ddd-diagrams/dependencies.mmd
```

### 查看方法

**在线查看（最简单）：**
```bash
# macOS - 复制到剪贴板
cat docs/ddd-diagrams/dependencies.mmd | pbcopy

# 然后访问 https://mermaid.live/ 粘贴查看
```

**在 GitHub 中查看：**
- Mermaid 图表可以直接在 GitHub Markdown 中渲染
- 在 README 或文档中使用 \`\`\`mermaid 代码块

**在 VS Code 中查看：**
```bash
# 安装 Mermaid 预览插件
code --install-extension bierner.markdown-mermaid

# 打开 dependencies.md 文件，使用 Markdown Preview
```

### 优点

✅ 无需额外安装  
✅ 自动生成完整依赖图  
✅ 纯文本格式，Git 友好  
✅ 支持颜色和样式配置  

### 缺点

❌ 生成的图表可能过于复杂（315 行）  
❌ 需要在线编辑器或插件才能可视化  

---

## 方案 2：typescript-graph（专业工具）

### 安装

```bash
pnpm add -D -w typescript-graph
```

### 使用

```bash
# 生成整个项目的依赖图
npx tsx-graph --format mermaid --output docs/ddd-diagrams/ts-dependencies.mmd

# 生成特定目录的依赖图
npx tsx-graph packages/domain --format mermaid --output docs/ddd-diagrams/domain.mmd
```

### 添加到 package.json

```json
{
  "scripts": {
    "ddd:mermaid-ts": "tsx-graph packages --format mermaid --output docs/ddd-diagrams/typescript-graph.mmd"
  }
}
```

### 优点

✅ 专门为 TypeScript 设计  
✅ 更多过滤和配置选项  
✅ 可以生成单个模块的依赖图  
✅ 输出更简洁  

### 缺点

❌ 需要额外安装  
❌ 配置相对复杂  

---

## 方案 3：手写 Mermaid（最灵活）

### 适用场景

- 战略设计图（Bounded Context 关系）
- 简化的架构概览
- 自定义样式和布局

### 示例：DDD 战略设计图

创建 `docs/ddd-diagrams/strategic-design.md`:

\`\`\`markdown
# DDD 战略设计

\`\`\`mermaid
graph TB
    subgraph "Core Domain"
        Domain[Domain Layer<br/>核心业务逻辑]
    end
    
    subgraph "Supporting Subdomain"
        Application[Application Layer<br/>用例和应用服务]
    end
    
    subgraph "Generic Subdomain"
        Infrastructure[Infrastructure Layer<br/>技术实现]
    end
    
    subgraph "Applications"
        API[API Service<br/>REST API]
        Web[Web App<br/>Next.js]
    end
    
    %% Dependencies
    Application --> Domain
    Infrastructure --> Domain
    API --> Application
    API --> Infrastructure
    Web --> Application
    
    %% Styles
    style Domain fill:#ffcccc
    style Application fill:#ccffcc
    style Infrastructure fill:#ccccff
    style API fill:#ffffcc
    style Web fill:#ffccff
\`\`\`
\`\`\`

### 示例：领域模型类图

\`\`\`mermaid
classDiagram
    class Product {
        +UUID id
        +String name
        +Price price
        +ProductCategory category
        +ColorCode color
        +calculateDiscount()
    }
    
    class Price {
        +Number amount
        +String currency
        +isValid()
    }
    
    class ChatSession {
        +SessionId id
        +Message[] messages
        +addMessage()
        +getHistory()
    }
    
    class BrandingInfo {
        +LogoImage logo
        +ColorCode primaryColor
        +String businessName
    }
    
    Product --> Price
    Product --> ColorCode
    ChatSession --> Message
    BrandingInfo --> LogoImage
    BrandingInfo --> ColorCode
\`\`\`

### 示例：用例流程图

\`\`\`mermaid
sequenceDiagram
    participant User
    participant API
    participant Application
    participant Domain
    participant Infrastructure
    
    User->>API: 发送消息
    API->>Application: SendMessageUseCase
    Application->>Domain: ChatSession.addMessage()
    Application->>Infrastructure: AgentService
    Infrastructure->>Domain: 更新会话状态
    Infrastructure-->>Application: 返回响应
    Application-->>API: DTO
    API-->>User: 流式响应
\`\`\`

### 优点

✅ 完全可控的布局和样式  
✅ 简洁清晰的高层视图  
✅ 适合文档和演示  
✅ 易于理解和维护  

### 缺点

❌ 需要手动编写和更新  
❌ 不会自动反映代码变化  

---

## 🔧 工具配置

### VS Code 插件推荐

```bash
# Mermaid Preview
code --install-extension bierner.markdown-mermaid

# Mermaid Editor
code --install-extension tomoyukim.vscode-mermaid-editor
```

### GitHub 中使用

在任何 Markdown 文件中：

\`\`\`markdown
\`\`\`mermaid
graph LR
    A[Domain] --> B[Application]
    B --> C[Infrastructure]
\`\`\`
\`\`\`

GitHub 会自动渲染 Mermaid 图表。

---

## 📊 输出对比

| 格式 | 文件大小 | 可读性 | Git 友好 | 编辑难度 |
|------|----------|--------|----------|----------|
| **SVG** | 163KB | ⭐⭐⭐⭐⭐ | ⭐⭐ | ❌ 不可编辑 |
| **Mermaid** | ~15KB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ 可编辑 |
| **HTML** | 366KB | ⭐⭐⭐⭐⭐ | ⭐ | ❌ 不可编辑 |

---

## 🚀 推荐工作流

### 开发阶段

```bash
# 使用 dependency-cruiser 验证规则
pnpm ddd:validate
```

### 文档阶段

```bash
# 生成 Mermaid 格式
pnpm ddd:mermaid

# 手写战略设计图
# 编辑 docs/ddd-diagrams/strategic-design.md
```

### Code Review

```bash
# 生成所有格式
pnpm ddd:all

# 在 PR 中展示 Mermaid 图表
# GitHub 会自动渲染
```

---

## 📚 完整命令列表

```bash
# SVG 格式（需要 graphviz）
pnpm ddd:graph        # 详细依赖图
pnpm ddd:archi        # 架构层级图

# Mermaid 格式
pnpm ddd:mermaid      # Mermaid 依赖图

# HTML 报告
pnpm ddd:report       # 交互式报告

# 验证规则
pnpm ddd:validate     # DDD 规则验证

# 全部生成
pnpm ddd:all          # 生成所有格式
```

---

## 💡 最佳实践

### 1. 分层使用不同格式

```
- 战略设计 → 手写 Mermaid（简洁清晰）
- 战术设计 → dependency-cruiser Mermaid（完整详细）
- 代码审查 → SVG（可视化最好）
- 文档说明 → 手写 Mermaid（易于理解）
```

### 2. Git 版本控制

```bash
# Mermaid 文件适合提交
git add docs/ddd-diagrams/*.mmd
git add docs/ddd-diagrams/*.md

# SVG 文件可以 gitignore（太大）
echo "docs/ddd-diagrams/*.svg" >> .gitignore
```

### 3. 文档组织

```
docs/ddd-diagrams/
├── dependencies.mmd          # 自动生成
├── dependencies.md           # Mermaid 说明
├── strategic-design.md       # 手写战略图
├── domain-model.md           # 手写领域模型
└── use-case-flows.md         # 手写用例流程
```

---

## 🔗 参考资源

- [Mermaid 官方文档](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [GitHub Mermaid 支持](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)
- [dependency-cruiser 文档](https://github.com/sverweij/dependency-cruiser)
- [typescript-graph](https://github.com/ysk8hori/typescript-graph)

---

## 📝 快速开始

```bash
# 1. 生成 Mermaid 图表
pnpm ddd:mermaid

# 2. 在线查看
cat docs/ddd-diagrams/dependencies.mmd | pbcopy
# 访问 https://mermaid.live/ 粘贴

# 3. 或在 GitHub 中查看
# 提交 dependencies.md 到 GitHub
# GitHub 会自动渲染 Mermaid 代码块
```

**推荐方式：** 使用 `pnpm ddd:mermaid` 生成完整依赖图，手写战略设计图用于文档。
