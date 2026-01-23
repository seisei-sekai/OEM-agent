import { Message, IChatSessionRepository } from '@repo/domain';
import { SendMessageDTO } from '../dtos/ChatDTO.js';
import { IAgentService, AgentStreamEvent } from '../interfaces/IAgentService.js';

export interface ISendMessageUseCase {
  execute(dto: SendMessageDTO): Promise<AsyncIterable<AgentStreamEvent>>;
}

export class SendMessageUseCase implements ISendMessageUseCase {
  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly agentService: IAgentService
  ) {}

  async execute(dto: SendMessageDTO): Promise<AsyncIterable<AgentStreamEvent>> {
    // Validate session exists
    const session = await this.sessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new Error(`Session ${dto.sessionId} not found`);
    }

    // Save user message
    const userMessage = Message.create({
      sessionId: dto.sessionId,
      role: 'user',
      content: dto.message,
    });
    await this.sessionRepository.saveMessage(userMessage);
    session.incrementMessageCount();
    
    // Update context if provided
    if (dto.context) {
      session.updateContext(dto.context);
    }
    
    await this.sessionRepository.save(session);

    // Get previous messages for context
    const previousMessages = await this.sessionRepository.findMessagesBySessionId(dto.sessionId);
    const messageHistory = previousMessages.map(m => ({
      role: m.getRole(),
      content: m.getContent(),
    }));

    // Merge session context with incoming context
    // This ensures brandingInfo and other state persists across turns
    const sessionContext = session.getContext() || {};
    const mergedContext = {
      ...sessionContext,
      ...dto.context,
    };

    // Debug logging
    console.log('[SendMessageUseCase] Context merge:', {
      sessionId: dto.sessionId,
      sessionContext: Object.keys(sessionContext),
      incomingContext: Object.keys(dto.context || {}),
      mergedContext: Object.keys(mergedContext),
      hasBrandingInfo: !!(mergedContext as any).brandingInfo,
      brandingConfirmed: (mergedContext as any).brandingConfirmed,
      selectedTransition: (mergedContext as any).selectedTransition, // 🔍 DEBUG
    });

    // Get agent response stream
    const agentStream = await this.agentService.chat(dto.sessionId, messageHistory, mergedContext);

    // Stream agent response with merged context and handle context updates
    return this.wrapWithContextPersistence(dto.sessionId, agentStream);
  }
  
  private async *wrapWithContextPersistence(
    sessionId: string,
    eventStream: AsyncIterable<AgentStreamEvent>
  ): AsyncIterable<AgentStreamEvent> {
    const contextUpdates: Record<string, any> = {};
    
    try {
      for await (const event of eventStream) {
        // Capture context updates
        if (event.type === 'context_update') {
          console.log('[SendMessageUseCase] Capturing context update:', event.data);
          Object.assign(contextUpdates, event.data);
          // Don't yield context_update events to the client
          continue;
        }
        
        // Yield all other events
        yield event;
      }
    } finally {
      // Save accumulated context updates to session
      if (Object.keys(contextUpdates).length > 0) {
        console.log('[SendMessageUseCase] Saving context updates to session:', {
          sessionId,
          updates: Object.keys(contextUpdates)
        });
        const session = await this.sessionRepository.findById(sessionId);
        if (session) {
          session.updateContext(contextUpdates);
          await this.sessionRepository.save(session);
          console.log('[SendMessageUseCase] Context saved successfully');
        }
      } else {
        console.log('[SendMessageUseCase] No context updates to save');
      }
    }
  }
}


