import { ChatSession, IChatSessionRepository } from '@repo/domain';
import { CreateSessionDTO } from '../dtos/ChatDTO.js';

export interface IStartChatSessionUseCase {
  execute(dto: CreateSessionDTO): Promise<ChatSession>;
}

export class StartChatSessionUseCase implements IStartChatSessionUseCase {
  constructor(
    private readonly sessionRepository: IChatSessionRepository
  ) {}

  async execute(dto: CreateSessionDTO): Promise<ChatSession> {
    const session = ChatSession.create(dto.userId);
    await this.sessionRepository.save(session);
    return session;
  }
}


