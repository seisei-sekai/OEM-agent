import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SendMessageUseCase } from '../SendMessageUseCase';
import { ChatSession, Message, IChatSessionRepository } from '@repo/domain';
import { IAgentService, AgentStreamEvent } from '../../interfaces/IAgentService';
import { SendMessageDTO } from '../../dtos/ChatDTO';

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let mockRepository: IChatSessionRepository;
  let mockAgentService: IAgentService;
  let testSession: ChatSession;

  beforeEach(() => {
    testSession = ChatSession.create('user-123');

    mockRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(testSession),
      findByUserId: vi.fn(),
      delete: vi.fn(),
      saveMessage: vi.fn(),
      findMessagesBySessionId: vi.fn().mockResolvedValue([]),
    };

    mockAgentService = {
      chat: vi.fn().mockResolvedValue(createMockAsyncIterable()),
      classifyIntent: vi.fn().mockResolvedValue('general'),
    };

    useCase = new SendMessageUseCase(mockRepository, mockAgentService);
  });

  function createMockAsyncIterable(): AsyncIterable<AgentStreamEvent> {
    return {
      async *[Symbol.asyncIterator]() {
        yield { type: 'token', data: { content: 'Hello' } };
        yield { type: 'complete', data: {} };
      },
    };
  }

  describe('execute', () => {
    it('should throw error if session not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);

      const dto: SendMessageDTO = {
        sessionId: 'non-existent',
        message: 'Hello',
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Session non-existent not found');
    });

    it('should save user message to repository', async () => {
      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'Hello, how are you?',
      };

      await useCase.execute(dto);

      expect(mockRepository.saveMessage).toHaveBeenCalledOnce();
      const savedMessage = vi.mocked(mockRepository.saveMessage).mock.calls[0][0];
      expect(savedMessage).toBeInstanceOf(Message);
      expect(savedMessage.getContent()).toBe('Hello, how are you?');
      expect(savedMessage.getRole()).toBe('user');
    });

    it('should increment message count on session', async () => {
      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'Test message',
      };

      const initialCount = testSession.getMessageCount();
      await useCase.execute(dto);

      expect(mockRepository.save).toHaveBeenCalledWith(testSession);
      expect(testSession.getMessageCount()).toBe(initialCount + 1);
    });

    it('should update session context if provided', async () => {
      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'Show me red shirts',
        context: {
          pageUrl: 'https://example.com/products',
          viewedProducts: ['prod-1'],
        },
      };

      await useCase.execute(dto);

      expect(testSession.getContext()).toEqual(
        expect.objectContaining({
          pageUrl: 'https://example.com/products',
          viewedProducts: ['prod-1'],
        })
      );
    });

    it('should pass message history to agent service', async () => {
      const previousMessages = [
        Message.create({
          sessionId: testSession.getId(),
          role: 'user',
          content: 'Previous message',
        }),
        Message.create({
          sessionId: testSession.getId(),
          role: 'agent',
          content: 'Previous response',
        }),
      ];

      vi.mocked(mockRepository.findMessagesBySessionId).mockResolvedValueOnce(previousMessages);

      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'New message',
      };

      await useCase.execute(dto);

      expect(mockAgentService.chat).toHaveBeenCalledWith(
        testSession.getId(),
        [
          { role: 'user', content: 'Previous message' },
          { role: 'agent', content: 'Previous response' },
        ],
        {}
      );
    });

    it('should return async iterable from agent service', async () => {
      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'Hello',
      };

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(typeof result[Symbol.asyncIterator]).toBe('function');
    });

    it('should handle context in agent service call', async () => {
      const context = {
        pageUrl: 'https://example.com',
        pageType: 'landing' as const,
      };

      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'Test',
        context,
      };

      await useCase.execute(dto);

      expect(mockAgentService.chat).toHaveBeenCalledWith(
        testSession.getId(),
        [],
        expect.objectContaining({
          pageUrl: 'https://example.com',
          pageType: 'landing',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should propagate repository save errors', async () => {
      const error = new Error('Failed to save');
      vi.mocked(mockRepository.saveMessage).mockRejectedValueOnce(error);

      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'Test',
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Failed to save');
    });

    it('should handle agent service errors gracefully', async () => {
      const error = new Error('Agent service unavailable');
      vi.mocked(mockAgentService.chat).mockRejectedValueOnce(error);

      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: 'Test',
      };

      await expect(useCase.execute(dto)).rejects.toThrow('Agent service unavailable');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', async () => {
      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: '',
      };

      await useCase.execute(dto);

      const savedMessage = vi.mocked(mockRepository.saveMessage).mock.calls[0][0];
      expect(savedMessage.getContent()).toBe('');
    });

    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(10000);
      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: longMessage,
      };

      await useCase.execute(dto);

      const savedMessage = vi.mocked(mockRepository.saveMessage).mock.calls[0][0];
      expect(savedMessage.getContent()).toBe(longMessage);
    });

    it('should handle special characters in message', async () => {
      const dto: SendMessageDTO = {
        sessionId: testSession.getId(),
        message: '!@#$%^&*(){}[]|\\<>?/',
      };

      await useCase.execute(dto);

      const savedMessage = vi.mocked(mockRepository.saveMessage).mock.calls[0][0];
      expect(savedMessage.getContent()).toBe('!@#$%^&*(){}[]|\\<>?/');
    });
  });
});

