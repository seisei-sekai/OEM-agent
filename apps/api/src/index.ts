import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { connectMongoDB } from '@repo/infrastructure';
import { corsMiddleware } from './middleware/cors.js';
import { loggerMiddleware } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import agentRoute from './routes/agent.js';
import sessionsRoute from './routes/sessions.js';
import brandingRoute from './routes/branding.js';
import productsRoute from './routes/products.js';
import healthRoute from './routes/health.js';

const app = new Hono();

// Middleware
app.use('*', corsMiddleware);
app.use('*', loggerMiddleware);

// Routes
app.route('/api/agent', agentRoute);
app.route('/api/sessions', sessionsRoute);
app.route('/api/branding', brandingRoute);
app.route('/api/products', productsRoute);
app.route('/health', healthRoute);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'OEM Agent API',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handler
app.onError(errorHandler);

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ Connected to MongoDB');

    // Start server
    serve({
      fetch: app.fetch,
      port: PORT,
    });

    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
export type AppType = typeof app;

