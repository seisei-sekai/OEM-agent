import { ChatSession, IChatSessionRepository } from '@repo/domain';
import { LoadChatHistoryDTO } from '../dtos/ChatDTO.js';

export interface ILoadChatHistoryUseCase {
  execute(dto: LoadChatHistoryDTO): Promise<ChatSession[]>;
}

export class LoadChatHistoryUseCase implements ILoadChatHistoryUseCase {
  constructor(
    private readonly sessionRepository: IChatSessionRepository
  ) {}

  async execute(dto: LoadChatHistoryDTO): Promise<ChatSession[]> {
    return this.sessionRepository.findByUserId(dto.userId, dto.limit || 50);
  }
}


