import { Hono } from 'hono';
import { getDB } from '@repo/infrastructure';

const healthRoute = new Hono();

healthRoute.get('/', async (c) => {
  try {
    // Check MongoDB connection
    const db = getDB();
    await db.admin().ping();

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
        api: 'running',
      },
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 503);
  }
});

export default healthRoute;



