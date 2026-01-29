import { Hono } from 'hono';
import { container } from '../di/container.js';
import {
  IStartChatSessionUseCase,
  ILoadChatHistoryUseCase,
  CreateSessionDTOSchema,
  LoadChatHistoryDTOSchema,
} from '@repo/application';
import { IChatSessionRepository, ChatSession } from '@repo/domain';

const sessionsRoute = new Hono();

// Create new session
sessionsRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const dto = CreateSessionDTOSchema.parse(body);

    const useCase = container.resolve<IStartChatSessionUseCase>('IStartChatSessionUseCase');
    const session = await useCase.execute(dto);

    return c.json({
      session: session.toJSON(),
    }, 201);
  } catch (error) {
    return c.json({
      error: 'Failed to create session',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get chat history
sessionsRoute.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const dto = LoadChatHistoryDTOSchema.parse({ userId, limit });
    const useCase = container.resolve<ILoadChatHistoryUseCase>('ILoadChatHistoryUseCase');
    const sessions = await useCase.execute(dto);

    return c.json({
      sessions: sessions.map((s: ChatSession) => s.toJSON()),
    });
  } catch (error) {
    return c.json({
      error: 'Failed to load chat history',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get session by ID
sessionsRoute.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const repo = container.resolve<IChatSessionRepository>('IChatSessionRepository');
    const session = await repo.findById(id);

    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({
      session: session.toJSON(),
    });
  } catch (error) {
    return c.json({
      error: 'Failed to get session',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get session messages
sessionsRoute.get('/:id/messages', async (c) => {
  try {
    const id = c.req.param('id');
    const repo = container.resolve<IChatSessionRepository>('IChatSessionRepository');
    const messages = await repo.findMessagesBySessionId(id);

    return c.json({
      messages: messages.map(m => m.toJSON()),
    });
  } catch (error) {
    return c.json({
      error: 'Failed to get messages',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Delete session
sessionsRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const repo = container.resolve<IChatSessionRepository>('IChatSessionRepository');
    await repo.delete(id);

    return c.json({ success: true });
  } catch (error) {
    return c.json({
      error: 'Failed to delete session',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default sessionsRoute;

