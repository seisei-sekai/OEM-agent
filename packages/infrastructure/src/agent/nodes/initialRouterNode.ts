import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState, StateTransition } from '../types.js';

/**
 * Initial router node - decides whether to show welcome or skip to classification
 * This is the entry point of the graph for every user turn
 */
export async function initialRouterNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  console.log('[InitialRouterNode] Incoming state:', {
    selectedTransition: state.selectedTransition,
    isFirstMessage: state.isFirstMessage,
    brandingConfirmed: state.brandingConfirmed,
  });

  // Define available transitions from this node
  const transitions: StateTransition[] = [
    {
      id: 'to_welcome',
      label: 'Show Welcome',
      description: 'Start with welcome message',
      targetNode: 'welcome',
      trigger: '__first_message__',
    },
    {
      id: 'to_classify',
      label: 'Classify Intent',
      description: 'Skip welcome and classify user intent',
      targetNode: 'classifyIntent',
      trigger: '__subsequent_message__',
    },
  ];
  
  const result = {
    executionHistory: [...(state.executionHistory || []), 'initialRouter'],
    turnCount: (state.turnCount || 0) + 1,
    lastNodeVisited: 'initialRouter',
    availableTransitions: transitions,
    // CRITICAL: Preserve selectedTransition for routing
    selectedTransition: state.selectedTransition,
  };

  console.log('[InitialRouterNode] Returning state:', {
    selectedTransition: result.selectedTransition,
  });

  return result;
}

