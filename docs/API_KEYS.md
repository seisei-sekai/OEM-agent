# API Keys Configuration Guide

**Created:** 2026-01-23-13-11 (Tokyo Time)  
**Last Updated:** 2026-01-23-13-11 (Tokyo Time)  
**Purpose:** 配置指南 - 设置项目所需的API密钥和环境变量

---

## 快速配置步骤

### 1. OpenAI API Key (必需)

这是项目运行的**必需配置**，用于AI对话功能。

**获取步骤：**

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录或注册账号
3. 进入 [API Keys 页面](https://platform.openai.com/api-keys)
4. 点击 "Create new secret key"
5. 复制生成的密钥（格式：`sk-...`）

**配置到项目：**

```bash
# 编辑 .env 文件
nano .env

# 或者使用 vim
vim .env

# 或者使用 VSCode
code .env
```

找到这一行：
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

替换为：
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**重启服务：**
```bash
docker compose restart api
```

---

## 完整环境变量说明

### .env 文件示例

```bash
# ============================================
# API Configuration
# ============================================
PORT=4000
NODE_ENV=development

# ============================================
# Database Configuration
# ============================================
MONGODB_URL=mongodb://localhost:27018
MONGODB_DB_NAME=oem_agent

# ============================================
# Vector Database Configuration
# ============================================
WEAVIATE_URL=http://localhost:9080

# ============================================
# OpenAI API Configuration (必需)
# ============================================
OPENAI_API_KEY=sk-proj-your-actual-key-here

# ============================================
# Frontend Configuration
# ============================================
NEXT_PUBLIC_API_URL=http://localhost:4000

# ============================================
# Security (Optional)
# ============================================
# JWT_SECRET=your-jwt-secret-here
# CORS_ORIGIN=http://localhost:3000
```

---

## 各配置项详解

### 必需配置

#### `OPENAI_API_KEY`
- **作用**: AI对话功能的核心，调用GPT-4模型
- **格式**: `sk-proj-...` 或 `sk-...`
- **获取**: https://platform.openai.com/api-keys
- **注意**: 
  - 需要有效的OpenAI账户和余额
  - 密钥需保密，不要提交到Git
  - 项目使用 `gpt-4o-mini` 模型

### 数据库配置

#### `MONGODB_URL`
- **作用**: MongoDB数据库连接地址
- **本地开发**: `mongodb://localhost:27018`
- **Docker内部**: `mongodb://mongodb:27017`
- **说明**: Docker Compose会自动配置

#### `MONGODB_DB_NAME`
- **作用**: 数据库名称
- **默认值**: `oem_agent`
- **说明**: 存储会话、消息、产品等数据

#### `WEAVIATE_URL`
- **作用**: Weaviate向量数据库地址
- **本地开发**: `http://localhost:9080`
- **Docker内部**: `http://weaviate:8080`
- **说明**: 用于产品向量搜索和推荐

### 前端配置

#### `NEXT_PUBLIC_API_URL`
- **作用**: 前端访问API的地址
- **本地开发**: `http://localhost:4000`
- **生产环境**: 设置为实际的API域名
- **注意**: 必须以 `NEXT_PUBLIC_` 开头才能在浏览器中使用

### 可选配置

#### `NODE_ENV`
- **作用**: 运行环境
- **可选值**: `development` | `production` | `test`
- **默认**: `development`

#### `PORT`
- **作用**: API服务器端口
- **默认**: `4000`
- **注意**: 需与 `NEXT_PUBLIC_API_URL` 保持一致

---

## 验证配置

### 1. 检查配置文件

```bash
# 查看配置（不显示密钥）
cat .env | grep -v "sk-"
```

### 2. 测试OpenAI连接

```bash
# 重启服务
docker compose restart api

# 查看日志
docker logs oem_agent-api-1 --tail 50

# 应该看到：
# ✅ Connected to MongoDB
# 🚀 Server running on http://localhost:4000
```

### 3. 测试AI对话

```bash
# 创建会话
SESSION_ID=$(curl -s -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.session.id')

# 发送消息
curl -N -X POST http://localhost:4000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"hello\",\"context\":{\"pageUrl\":\"http://localhost:3000\",\"pageType\":\"landing\"}}"
```

如果配置正确，应该看到流式返回的SSE事件：
```
event: token
data: {"type":"token","data":{"text":"Hello!"}}

event: complete
data: {"type":"complete","data":{}}
```

如果没有配置OpenAI key，会看到：
```
data: {"type":"token","data":{"text":"Echo: hello"}}
```

---

## 常见问题

### Q: 显示 "Echo: xxx" 而不是AI回复？

**原因**: 没有配置有效的 `OPENAI_API_KEY`

**解决**:
1. 检查 `.env` 文件中的 `OPENAI_API_KEY`
2. 确保密钥格式正确（`sk-` 开头）
3. 确保OpenAI账户有余额
4. 重启API服务：`docker compose restart api`

### Q: 报错 "OpenAI API key not found"？

**解决**:
```bash
# 确认.env文件存在
ls -la .env

# 如果不存在，从模板创建
cp env.template .env

# 编辑并添加你的密钥
nano .env
```

### Q: 更新配置后不生效？

**解决**:
```bash
# 必须重启对应的服务
docker compose restart api    # API配置变更
docker compose restart web    # 前端配置变更

# 或重启所有服务
docker compose restart
```

### Q: 在生产环境如何配置？

**GCP部署**:
```bash
# 使用环境变量而不是.env文件
export OPENAI_API_KEY=sk-proj-xxx
export MONGODB_URL=mongodb://your-mongo-host:27017
export NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# 启动服务
npm start
```

**Docker Compose生产部署**:
```yaml
services:
  api:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    env_file:
      - .env.production
```

---

## 安全建议

### 1. 保护API密钥

```bash
# .env文件权限设置
chmod 600 .env

# 确保.env在.gitignore中
echo ".env" >> .gitignore
```

### 2. 不同环境使用不同密钥

- 开发环境：`.env.development`
- 测试环境：`.env.test`
- 生产环境：`.env.production` 或环境变量

### 3. 定期轮换密钥

OpenAI建议定期更新API密钥，可以在平台上创建新密钥并删除旧密钥。

### 4. 监控API使用量

访问 [OpenAI Usage](https://platform.openai.com/usage) 监控API调用和费用。

---

## 快速命令参考

```bash
# 检查配置
cat .env | grep -v "sk-"

# 编辑配置
nano .env

# 重启服务
docker compose restart api

# 查看日志
docker logs oem_agent-api-1 -f

# 测试健康检查
curl http://localhost:4000/health

# 完整重启
docker compose down && docker compose up -d
```

---

## 相关文档

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API接口文档
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker配置说明
