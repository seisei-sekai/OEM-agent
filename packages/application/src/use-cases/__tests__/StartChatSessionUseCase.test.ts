import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StartChatSessionUseCase } from '../StartChatSessionUseCase';
import { ChatSession, IChatSessionRepository } from '@repo/domain';

describe('StartChatSessionUseCase', () => {
  let useCase: StartChatSessionUseCase;
  let mockRepository: IChatSessionRepository;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      delete: vi.fn(),
      saveMessage: vi.fn(),
      findMessagesBySessionId: vi.fn(),
    };

    useCase = new StartChatSessionUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should create a new chat session', async () => {
      const dto = { userId: 'user-123' };
      
      const session = await useCase.execute(dto);

      expect(session).toBeInstanceOf(ChatSession);
      expect(session.getUserId()).toBe('user-123');
    });

    it('should save the session to repository', async () => {
      const dto = { userId: 'user-456' };
      
      await useCase.execute(dto);

      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(ChatSession)
      );
    });

    it('should generate unique session ID', async () => {
      const dto = { userId: 'user-789' };
      
      const session1 = await useCase.execute(dto);
      const session2 = await useCase.execute(dto);

      expect(session1.getId()).not.toBe(session2.getId());
    });

    it('should create session with zero message count', async () => {
      const dto = { userId: 'user-123' };
      
      const session = await useCase.execute(dto);

      expect(session.getMessageCount()).toBe(0);
    });

    it('should propagate repository errors', async () => {
      const dto = { userId: 'user-123' };
      const error = new Error('Database connection failed');
      
      vi.mocked(mockRepository.save).mockRejectedValueOnce(error);

      await expect(useCase.execute(dto)).rejects.toThrow('Database connection failed');
    });

    it('should handle multiple concurrent session creations', async () => {
      const dto1 = { userId: 'user-1' };
      const dto2 = { userId: 'user-2' };
      const dto3 = { userId: 'user-3' };

      const [session1, session2, session3] = await Promise.all([
        useCase.execute(dto1),
        useCase.execute(dto2),
        useCase.execute(dto3),
      ]);

      expect(session1.getUserId()).toBe('user-1');
      expect(session2.getUserId()).toBe('user-2');
      expect(session3.getUserId()).toBe('user-3');
      expect(mockRepository.save).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty userId', async () => {
      const dto = { userId: '' };
      
      const session = await useCase.execute(dto);

      expect(session.getUserId()).toBe('');
    });

    it('should handle special characters in userId', async () => {
      const dto = { userId: 'user-@#$%^&*()' };
      
      const session = await useCase.execute(dto);

      expect(session.getUserId()).toBe('user-@#$%^&*()');
    });
  });
});

