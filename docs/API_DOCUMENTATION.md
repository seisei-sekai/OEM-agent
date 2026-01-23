# API Documentation

**Created:** 2026-01-23
**Last Updated:** 2026-01-23  
**Purpose:** Complete API reference for OEM Agent system

---

## Base URL

- Local Development: `http://localhost:3001`
- Production: `http://YOUR_VM_IP:3001`

---

## Authentication

Currently using anonymous sessions. Future: JWT-based authentication.

---

## Agent Chat API

### Send Message (SSE Streaming)

Stream a conversation with the AI agent.

**Endpoint:** `POST /api/agent/chat`

**Request:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I want to create branded merchandise",
  "context": {
    "pageUrl": "http://localhost:3000/products",
    "pageType": "catalog",
    "viewedProducts": ["prod_001", "prod_002"],
    "cartItems": []
  }
}
```

**Response:** Server-Sent Events (SSE) Stream

```
event: token
data: {"type":"token","data":{"text":"Hello! "}}

event: token
data: {"type":"token","data":{"text":"I can help "}}

event: action
data: {"type":"action","data":{"type":"show_products","payload":[...]}}

event: complete
data: {"type":"complete","data":{"sessionId":"550e8400..."}}
```

**Event Types:**

- `token`: Individual text tokens as they're generated
- `action`: Special actions (show_products, show_branding)
- `complete`: Message generation complete
- `error`: Error occurred

**Example (JavaScript):**

```javascript
const response = await fetch('/api/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'uuid',
    message: 'Hello',
    context: {}
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Process SSE events
}
```

---

## Session Management API

### Create Session

Create a new chat session.

**Endpoint:** `POST /api/sessions`

**Request:**

```json
{
  "userId": "user_123" // optional
}
```

**Response:**

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user_123",
    "title": "New conversation",
    "createdAt": "2026-01-23T10:00:00.000Z",
    "updatedAt": "2026-01-23T10:00:00.000Z",
    "messageCount": 0,
    "context": {}
  }
}
```

### Get Chat History

Get all chat sessions for a user.

**Endpoint:** `GET /api/sessions?userId={userId}&limit={limit}`

**Query Parameters:**

- `userId` (required): User identifier
- `limit` (optional): Maximum number of sessions (default: 50)

**Response:**

```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user_123",
      "title": "Branded merchandise inquiry",
      "createdAt": "2026-01-23T10:00:00.000Z",
      "updatedAt": "2026-01-23T10:30:00.000Z",
      "messageCount": 15,
      "context": {}
    }
  ]
}
```

### Get Session by ID

Get details of a specific session.

**Endpoint:** `GET /api/sessions/:id`

**Response:**

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Branded merchandise inquiry",
    "messageCount": 15,
    ...
  }
}
```

### Get Session Messages

Get all messages in a session.

**Endpoint:** `GET /api/sessions/:id/messages`

**Response:**

```json
{
  "messages": [
    {
      "id": "msg_001",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "I want branded merchandise",
      "timestamp": "2026-01-23T10:00:00.000Z"
    },
    {
      "id": "msg_002",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "role": "agent",
      "content": "I can help you with that!",
      "timestamp": "2026-01-23T10:00:02.000Z"
    }
  ]
}
```

### Delete Session

Delete a chat session and all its messages.

**Endpoint:** `DELETE /api/sessions/:id`

**Response:**

```json
{
  "success": true
}
```

---

## Product API

### Recommend Products

Get AI-powered product recommendations.

**Endpoint:** `POST /api/products/recommend`

**Request:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "intent": "branded_merch",
  "brandingId": "branding_123", // optional
  "filters": {
    "category": "apparel", // optional
    "minPrice": 5, // optional
    "maxPrice": 20, // optional
    "minQuantity": 50 // optional
  },
  "limit": 20 // optional, default: 20
}
```

**Response:**

```json
{
  "products": [
    {
      "id": "prod_001",
      "name": "Unstructured Baseball Cap",
      "description": "Classic 6-panel baseball cap...",
      "category": "apparel",
      "priceFrom": { "amount": 5.77, "currency": "USD" },
      "minQuantity": 20,
      "imageUrl": "https://...",
      "colors": [
        { "name": "Black", "hex": "#000000" }
      ],
      "specs": {},
      "printMethods": ["embroidery", "screen-print"],
      "leadTimeDays": 14
    }
  ],
  "total": 12
}
```

### Get Product by ID

Get details of a specific product.

**Endpoint:** `GET /api/products/:id`

**Response:**

```json
{
  "product": {
    "id": "prod_001",
    "name": "Unstructured Baseball Cap",
    ...
  }
}
```

### Search Products

Search products by keyword.

**Endpoint:** `GET /api/products/search?q={query}&category={category}&limit={limit}`

**Query Parameters:**

- `q`: Search query (required)
- `category`: Filter by category (optional)
- `limit`: Maximum results (optional, default: 20)

**Response:**

```json
{
  "products": [...],
  "total": 5
}
```

---

## Branding API

### Extract Branding from URL

Extract branding information from a website.

**Endpoint:** `POST /api/branding/extract-url`

**Request:**

```json
{
  "url": "https://example.com",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_123" // optional
}
```

**Response:**

```json
{
  "branding": {
    "id": "branding_123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "companyName": "Example Company",
    "websiteUrl": "https://example.com",
    "logos": [
      {
        "url": "https://example.com/logo.png",
        "width": 200,
        "height": 200,
        "format": "png"
      }
    ],
    "colors": ["#6366F1", "#4F46E5"],
    "extractedAt": "2026-01-23T10:00:00.000Z",
    "method": "url_scraping"
  }
}
```

### Extract Branding from File Upload

Upload a logo file for branding extraction.

**Endpoint:** `POST /api/branding/extract-upload`

**Request:** `multipart/form-data`

**Status:** Not yet implemented (returns 501)

---

## Health Check

Check API and database health.

**Endpoint:** `GET /health`

**Response (Healthy):**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T10:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "api": "running"
  }
}
```

**Response (Unhealthy):**

```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-23T10:00:00.000Z",
  "error": "MongoDB connection failed"
}
```

**Status Code:** 503 (Service Unavailable)

---

## Error Responses

All endpoints may return error responses:

### Validation Error (400)

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["message"],
      "message": "Expected string, received number"
    }
  ]
}
```

### Not Found (404)

```json
{
  "error": "Resource not found",
  "message": "Session 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

### Internal Server Error (500)

```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

- **Agent Chat:** 60 requests per hour per session
- **Product Recommendations:** 100 requests per hour per user
- **Branding Extraction:** 10 requests per hour per user

**Rate Limit Response (429):**

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## Versioning

Current API version: `v1`

Future versions will be accessible via `/api/v2/...`

---

## SDK Examples

### Node.js

```javascript
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

async function sendMessage(sessionId, message) {
  const response = await fetch(`${API_URL}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });

  // Handle SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    console.log(chunk);
  }
}
```

### Python

```python
import requests
import json

API_URL = "http://localhost:3001"

def send_message(session_id, message):
    response = requests.post(
        f"{API_URL}/api/agent/chat",
        json={"sessionId": session_id, "message": message},
        stream=True
    )
    
    for line in response.iter_lines():
        if line.startswith(b'data: '):
            data = json.loads(line[6:])
            print(data)
```

---

## Support

For API questions:
- Check this documentation
- Review code examples in `/examples`
- Open GitHub issue



