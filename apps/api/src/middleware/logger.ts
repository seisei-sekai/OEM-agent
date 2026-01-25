import { Context, Next } from 'hono';

export async function loggerMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    duration: `${duration}ms`,
  }));
}



