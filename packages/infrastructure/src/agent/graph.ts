import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from './types.js';
import { stateChannels } from './stateChannels.js';
import { routeInitial, routeByIntent, shouldEnd } from './routing.js';
import {
  initialRouterNode,
  welcomeNode,
  intentClassificationNode,
  brandingExtractionNode,
  productRecommendationNode,
  conversationNode,
  mockupGenerationNode,
} from './nodes/index.js';

/**
 * Creates the LangGraph state graph for the AI agent
 * 
 * Graph Flow:
 * 1. START → initialRouter (decides welcome vs classify)
 * 2. initialRouter → welcome | classifyIntent
 * 3. welcome → classifyIntent
 * 4. classifyIntent → extractBranding | recommendProducts | generateMockup | conversation
 * 5. All terminal nodes → END
 * 
 * Features:
 * - User-driven transitions via selectedTransition
 * - Automatic flow detection (URLs, confirmations, etc.)
 * - Loop prevention via executionHistory
 */
export function createAgentGraph(): any {
  const workflow = new StateGraph<AgentState>({
    channels: stateChannels as any,
  });

  // Register all nodes
  addNodes(workflow);

  // Define edges and routing logic
  defineEdges(workflow);

  return workflow.compile();
}

/**
 * Register all node functions with the workflow
 */
function addNodes(workflow: StateGraph<AgentState>): void {
  workflow.addNode('initialRouter', initialRouterNode);
  workflow.addNode('welcome', welcomeNode);
  workflow.addNode('classifyIntent', intentClassificationNode);
  workflow.addNode('extractBranding', brandingExtractionNode);
  workflow.addNode('recommendProducts', productRecommendationNode);
  workflow.addNode('generateMockup', mockupGenerationNode);
  workflow.addNode('conversation', conversationNode);
}

/**
 * Define edges between nodes with routing logic
 */
function defineEdges(workflow: StateGraph<AgentState>): void {
  // Entry point
  workflow.setEntryPoint('initialRouter');

  // From initialRouter - conditional routing
  workflow.addConditionalEdges(
    'initialRouter',
    routeInitial,
    {
      'welcome': 'welcome',
      'classifyIntent': 'classifyIntent',
      'recommendProducts': 'recommendProducts', // Direct force path
      'generateMockup': 'generateMockup',       // Direct force path
    }
  );

  // Welcome always goes to classification
  workflow.addEdge('welcome', 'classifyIntent');

  // From classifyIntent - sophisticated conditional routing
  workflow.addConditionalEdges(
    'classifyIntent',
    routeByIntent,
    {
      'extractBranding': 'extractBranding',
      'recommendProducts': 'recommendProducts',
      'generateMockup': 'generateMockup',
      'conversation': 'conversation',
    }
  );

  // All terminal nodes end the turn (wait for user input)
  workflow.addConditionalEdges('extractBranding', shouldEnd);
  workflow.addConditionalEdges('recommendProducts', shouldEnd);
  workflow.addConditionalEdges('generateMockup', shouldEnd);
  workflow.addConditionalEdges('conversation', shouldEnd);
}

// Export the compiled graph
export const agentGraph: any = createAgentGraph();
