import { Hono } from 'hono';
import { stream, streamSSE } from 'hono/streaming';
import { container } from '../di/container.js';
import { ISendMessageUseCase, SendMessageDTOSchema } from '@repo/application';

const agentRoute = new Hono();

agentRoute.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    
    // 🔍 DEBUG: Log incoming request
    console.log('[AgentRoute] Incoming request:', {
      sessionId: body.sessionId,
      message: body.message?.substring(0, 50),
      contextKeys: Object.keys(body.context || {}),
      selectedTransition: body.context?.selectedTransition,
    });
    
    const dto = SendMessageDTOSchema.parse(body);

    const sendMessageUseCase = container.resolve<ISendMessageUseCase>('ISendMessageUseCase');

    return streamSSE(c, async (stream) => {
      const eventStream = await sendMessageUseCase.execute(dto);

      for await (const event of eventStream) {
        await stream.writeSSE({
          data: JSON.stringify(event),
          event: event.type,
        });

        // End stream on complete or error
        if (event.type === 'complete' || event.type === 'error') {
          break;
        }
      }
    });
  } catch (error) {
    return c.json({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default agentRoute;


