import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean);

    // Allow if origin is in the list
    if (allowedOrigins.includes(origin)) {
      return origin;
    }
    
    // Allow if no origin (same-origin request)
    if (!origin) {
      return origin;
    }
    
    // For production: allow IP-based origins (e.g., http://34.84.2.46:3000)
    // This handles direct IP access to the deployed app
    if (origin.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+$/)) {
      return origin;
    }
    
    // Fallback to first allowed origin
    return allowedOrigins[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
});



