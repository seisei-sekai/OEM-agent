import { END } from '@langchain/langgraph';
import { AgentState } from './types.js';

/**
 * Routing functions determine which node to visit next based on current state
 */

/**
 * Routes from initial router node
 * Priority order:
 * 1. Force transitions (selectedTransition with _force suffix)
 * 2. Available transitions
 * 3. First vs subsequent message check
 */
export function routeInitial(state: AgentState): string {
  console.log('[RouteInitial] Called with state:', {
    selectedTransition: state.selectedTransition,
    isFirstMessage: state.isFirstMessage,
    hasAvailableTransitions: !!state.availableTransitions?.length,
  });

  // PRIORITY 1: Force transitions bypass normal flow
  if (state.selectedTransition) {
    console.log('[RouteInitial] 🎯 DETECTED selectedTransition:', state.selectedTransition);
    
    // Direct force routing to specific nodes
    const forceRoutes: Record<string, string> = {
      'to_recommend_products_force': 'recommendProducts',
      'to_recommend_products': 'recommendProducts',
      'to_generate_mockup_force': 'generateMockup',
      'to_generate_mockup': 'generateMockup',
      'to_mockup': 'generateMockup',
    };
    
    if (forceRoutes[state.selectedTransition]) {
      console.log('[RouteInitial] ⚡ FORCE ROUTING →', forceRoutes[state.selectedTransition]);
      return forceRoutes[state.selectedTransition]!;
    }
    
    // Check if transition is in availableTransitions
    const transition = state.availableTransitions?.find(t => t.id === state.selectedTransition);
    if (transition && transition.targetNode !== 'classifyIntent') {
      console.log('[RouteInitial] ⚡ ROUTING to:', transition.targetNode);
      return transition.targetNode;
    }
  }
  
  // PRIORITY 2: Skip welcome for subsequent messages
  if (state.isFirstMessage === false) {
    console.log('[RouteInitial] → classifyIntent (subsequent message)');
    return 'classifyIntent';
  }
  
  console.log('[RouteInitial] → welcome (first message)');
  return 'welcome';
}

/**
 * Routes after intent classification
 * Uses sophisticated logic to determine next node based on:
 * - User-selected transitions (highest priority)
 * - Content-based force transitions
 * - Branding flow state
 * - Product recommendation flow state
 */
export function routeByIntent(state: AgentState): string {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  const contentLower = content.toLowerCase();

  // PRIORITY 1: User-selected transitions override all automatic routing
  if (state.selectedTransition) {
    console.log('[RouteByIntent] 🎯 FORCED TRANSITION:', state.selectedTransition);
    
    // Known transition mappings
    const transitionRoutes: Record<string, string> = {
      'confirm_branding': 'recommendProducts',
      'to_mockup': 'generateMockup',
      'to_generate_mockup': 'generateMockup',
      'to_recommend_products': 'recommendProducts',
    };
    
    if (transitionRoutes[state.selectedTransition]) {
      console.log('[RouteByIntent] ✅', state.selectedTransition, '→', transitionRoutes[state.selectedTransition]);
      return transitionRoutes[state.selectedTransition]!;
    }
    
    // Fallback: search in availableTransitions
    const transition = state.availableTransitions?.find(t => t.id === state.selectedTransition);
    if (transition) {
      console.log('[RouteByIntent] ✅ Found transition:', transition.id, '→', transition.targetNode);
      return transition.targetNode;
    }
  }

  // PRIORITY 2: Content-based force routing (special [FORCE] marker)
  if (content.includes('[FORCE]')) {
    if (contentLower.includes('mockup') || contentLower.includes('generate')) {
      console.log('[RouteByIntent] 🚀 FORCE CONTENT → generateMockup');
      return 'generateMockup';
    }
    if (contentLower.includes('product') || contentLower.includes('recommend')) {
      console.log('[RouteByIntent] 🚀 FORCE CONTENT → recommendProducts');
      return 'recommendProducts';
    }
  }
  
  // PRIORITY 3: Loop prevention
  if ((state.executionHistory || []).length > 10) {
    console.warn('[RouteByIntent] Max execution history reached, ending conversation turn');
    return 'conversation';
  }
  
  // PRIORITY 4: Automatic flow-based routing
  console.log('[RouteByIntent] Automatic routing check:', {
    hasBrandingInfo: !!state.brandingInfo,
    brandingConfirmed: state.brandingConfirmed,
    hasProducts: !!state.recommendedProducts,
    currentIntent: state.currentIntent,
    lastMessage: content.substring(0, 50),
  });
  
  // Check for URL pattern (start branding flow)
  if (content.match(/(https?:\/\/[^\s]+)/) && !state.brandingInfo) {
    return 'extractBranding';
  }
  
  // Branding confirmed → recommend products
  if (state.brandingInfo && state.brandingConfirmed === true && !state.recommendedProducts) {
    console.log('[RouteByIntent] ✅ Branding confirmed → recommendProducts');
    return 'recommendProducts';
  }
  
  // User confirming branding via message content
  if (state.brandingInfo && !state.recommendedProducts) {
    const confirmationKeywords = ['yes', 'confirm', 'use this', 'use it', 'proceed', 'continue'];
    const isConfirming = confirmationKeywords.some(kw => contentLower.includes(kw));
    
    if (isConfirming) {
      console.log('[RouteByIntent] ✅ User confirmed branding → recommendProducts');
      return 'recommendProducts';
    }
  }
  
  // User requesting mockup/visualization
  if (state.brandingInfo && state.recommendedProducts) {
    const visualizationKeywords = ['show', 'image', 'photo', 'mockup', 't-shirt', 'mug', 'hoodie', 'cup'];
    const isRequestingVisualization = visualizationKeywords.some(kw => contentLower.includes(kw));
    
    if (isRequestingVisualization) {
      console.log('[RouteByIntent] ✅ Requesting visualization → generateMockup');
      return 'generateMockup';
    }
  }
  
  // Default fallback
  console.log('[RouteByIntent] ⚠️ No specific route matched → conversation');
  return 'conversation';
}

/**
 * Terminal condition - always end after final nodes
 */
export function shouldEnd(state: AgentState): string {
  return END;
}

