import {
  StartChatSessionUseCase,
  SendMessageUseCase,
  LoadChatHistoryUseCase,
  ExtractBrandingUseCase,
  RecommendProductsUseCase,
  GenerateMockupUseCase,
} from '@repo/application';
import {
  MongoChatSessionRepository,
  MongoProductCatalogRepository,
  MongoBrandingRepository,
  // WeaviateProductSearch,
  OpenAIService,
  BrandingExtractorService,
  MockupGeneratorService,
  LangGraphAgentService,
} from '@repo/infrastructure';
import { IAgentService, AgentMessage, AgentStreamEvent, AgentContext } from '@repo/application';

// Simple mock agent service for now
class SimpleAgentService implements IAgentService {
  async chat(
    sessionId: string,
    messages: AgentMessage[],
    context?: AgentContext
  ): Promise<AsyncIterable<AgentStreamEvent>> {
    return this.chatGenerator(sessionId, messages, context);
  }

  private async *chatGenerator(
    sessionId: string,
    messages: AgentMessage[],
    context?: AgentContext
  ): AsyncIterable<AgentStreamEvent> {
    const lastMessage = messages[messages.length - 1];
    yield {
      type: 'token',
      data: { text: `Echo: ${lastMessage?.content || 'Hello!'}` },
    };
    yield {
      type: 'complete',
      data: { sessionId },
    };
  }

  async classifyIntent(message: string): Promise<string> {
    return 'general';
  }
}

export class DIContainer {
  private instances = new Map<string, any>();

  constructor() {
    this.registerServices();
  }

  private registerServices() {
    // Repositories
    const chatSessionRepo = new MongoChatSessionRepository();
    const productCatalogRepo = new MongoProductCatalogRepository();
    const brandingRepo = new MongoBrandingRepository();
    // const vectorSearch = new WeaviateProductSearch(); // Temporarily disabled

    this.instances.set('IChatSessionRepository', chatSessionRepo);
    this.instances.set('IProductCatalogRepository', productCatalogRepo);
    this.instances.set('IBrandingRepository', brandingRepo);
    // this.instances.set('IVectorSearch', vectorSearch);

    // AI Services
    const openAIService = new OpenAIService();
    const brandingExtractor = new BrandingExtractorService(openAIService);
    const mockupGenerator = new MockupGeneratorService(openAIService);

    this.instances.set('OpenAIService', openAIService);
    this.instances.set('IBrandingExtractor', brandingExtractor);
    this.instances.set('IMockupGenerator', mockupGenerator);

    // Use Cases
    const startSessionUseCase = new StartChatSessionUseCase(chatSessionRepo);
    const sendMessageUseCase = new SendMessageUseCase(chatSessionRepo, null as any); // Will be set after agent
    const loadHistoryUseCase = new LoadChatHistoryUseCase(chatSessionRepo);
    const extractBrandingUseCase = new ExtractBrandingUseCase(brandingExtractor, brandingRepo);
    const recommendProductsUseCase = new RecommendProductsUseCase(
      productCatalogRepo,
      brandingRepo,
      null as any // vectorSearch temporarily disabled
    );
    const generateMockupUseCase = new GenerateMockupUseCase(mockupGenerator);

    this.instances.set('IStartChatSessionUseCase', startSessionUseCase);
    this.instances.set('ISendMessageUseCase', sendMessageUseCase);
    this.instances.set('ILoadChatHistoryUseCase', loadHistoryUseCase);
    this.instances.set('IExtractBrandingUseCase', extractBrandingUseCase);
    this.instances.set('IRecommendProductsUseCase', recommendProductsUseCase);
    this.instances.set('IGenerateMockupUseCase', generateMockupUseCase);

    // Agent Service (using LangGraph with OpenAI)
    const agentService = new LangGraphAgentService({
      extractBrandingUseCase,
      recommendProductsUseCase,
      generateMockupUseCase,
    });

    this.instances.set('IAgentService', agentService);

    // Update SendMessageUseCase with agent
    const updatedSendMessageUseCase = new SendMessageUseCase(chatSessionRepo, agentService);
    this.instances.set('ISendMessageUseCase', updatedSendMessageUseCase);
  }

  resolve<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Service ${key} not registered in DI container`);
    }
    return instance;
  }
}

export const container = new DIContainer();

