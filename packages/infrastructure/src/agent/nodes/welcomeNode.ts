import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState, StateTransition } from '../types.js';

export async function welcomeNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  const welcomeMessage = new AIMessage({
    content: `Welcome to OEM Agent! 👋 I'm your AI assistant for turning product ideas into real things.

Want to see something cool? I can instantly mock up merch with your branding. Just drop in your website or upload your logo or artwork, and watch the magic happen! ✨

How can I help you today?`,
  });

  const transitions: StateTransition[] = [
    {
      id: 'welcome_to_classify',
      label: 'Continue',
      description: 'Proceed to classify your intent',
      targetNode: 'classifyIntent',
    },
  ];

  return {
    messages: [welcomeMessage],
    currentIntent: 'idle',
    executionHistory: [...(state.executionHistory || []), 'welcome'],
    lastNodeVisited: 'welcome',
    availableTransitions: transitions,
    selectedTransition: undefined,  // Clear after use
  };
}

