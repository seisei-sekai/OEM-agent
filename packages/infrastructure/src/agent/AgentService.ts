import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { IAgentService, AgentMessage, AgentStreamEvent, AgentContext } from '@repo/application';
import { agentGraph } from './graph.js';
import { AgentDependencies } from './types.js';

export class LangGraphAgentService implements IAgentService {
  constructor(private readonly dependencies: AgentDependencies) { }

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
    try {
      // Convert ALL messages to LangChain format to maintain conversation context
      const langChainMessages = messages.map(m => {
        if (m.role === 'user') {
          return new HumanMessage({ content: m.content });
        } else {
          return new AIMessage({ content: m.content });
        }
      });

      if (langChainMessages.length === 0) {
        yield {
          type: 'error',
          data: { message: 'No messages found' },
        };
        return;
      }

      // Check if this is the first user message (only user message in history)
      const isFirstMessage = messages.filter(m => m.role === 'user').length === 1;

      const input = {
        messages: langChainMessages, // Pass FULL history, not just last message
        sessionId,
        context: context || {},
        isFirstMessage, // Pass flag to skip welcome node for subsequent messages
        executionHistory: [], // Reset execution history for each turn
        turnCount: 0,
        brandingConfirmed: context?.brandingConfirmed || false, // Extract from context
        brandingInfo: context?.brandingInfo || undefined, // Pass branding from session context
        recommendedProducts: context?.recommendedProducts || undefined, // Pass products from session context
        selectedTransition: context?.selectedTransition || undefined, // User-selected transition
      };

      // Debug logging
      console.log('[AgentService] Input state:', {
        sessionId,
        brandingConfirmed: input.brandingConfirmed,
        hasBrandingInfo: !!input.brandingInfo,
        hasRecommendedProducts: !!input.recommendedProducts,
        selectedTransition: input.selectedTransition, // 🔍 DEBUG
        messageCount: input.messages.length,
        lastMessage: input.messages[input.messages.length - 1]?.content,
      });

      // Stream the agent's response
      const stream = await agentGraph.stream(input, {
        configurable: this.dependencies,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        // Extract the latest AI message
        const nodeKey = Object.keys(chunk)[0];
        const nodeOutput = chunk[nodeKey];

        if (nodeOutput?.messages?.length) {
          const latestMessage = nodeOutput.messages[nodeOutput.messages.length - 1];

          if (latestMessage._getType() === 'ai') {
            const content = typeof latestMessage.content === 'string'
              ? latestMessage.content
              : '';

            const newContent = content.slice(fullResponse.length);
            fullResponse = content;

            if (newContent) {
              const words = newContent.split(' ');
              for (let i = 0; i < words.length; i++) {
                const word = i === 0 ? words[i] : ' ' + words[i];
                yield {
                  type: 'token',
                  data: { text: word },
                };
              }
            }

            // ✅ SIMPLIFIED: Only forward actionType if explicitly set by node
            if (latestMessage.additional_kwargs?.actionType) {
              const actionType = latestMessage.additional_kwargs.actionType;
              const actionData = latestMessage.additional_kwargs.actionData;

              console.log('[AgentService] 📤 Forwarding action:', actionType);

              yield {
                type: 'action',
                data: {
                  type: actionType,
                  payload: actionData,
                },
              };
            }
          }
        }

        // ✅ SIMPLIFIED: Only persist context updates, don't send UI actions
        // Nodes are responsible for setting actionType in their messages

        // Persist branding info to session
        if (nodeOutput?.brandingInfo) {
          yield {
            type: 'context_update',
            data: {
              brandingInfo: nodeOutput.brandingInfo,
            },
          };
        }

        // Persist recommended products to session
        if (nodeOutput?.recommendedProducts) {
          yield {
            type: 'context_update',
            data: {
              recommendedProducts: nodeOutput.recommendedProducts,
            },
          };
        }

        // Check for available transitions
        if (nodeOutput?.availableTransitions && nodeOutput.availableTransitions.length > 0) {
          yield {
            type: 'transitions',
            data: nodeOutput.availableTransitions,
          };
        }
      }

      yield {
        type: 'complete',
        data: { sessionId },
      };
    } catch (error) {
      console.error('Agent error:', error);
      yield {
        type: 'error',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async classifyIntent(message: string): Promise<string> {
    // Simple keyword-based classification as fallback
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('logo') || lowerMessage.includes('brand') || lowerMessage.includes('merch')) {
      return 'branded_merch';
    }
    if (lowerMessage.includes('custom') || lowerMessage.includes('manufacture')) {
      return 'custom';
    }
    if (lowerMessage.includes('track') || lowerMessage.includes('order') || lowerMessage.includes('shipment')) {
      return 'track_order';
    }

    return 'general';
  }
}

