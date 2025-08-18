// Response Router
// Routes user intents to appropriate handlers and system prompts
// Works with the intent classifier to determine response strategy

import { IntentResult } from './intent-classifier';

export interface RouteResult {
  handler: string;
  systemPrompt: string;
  shouldUseTools: boolean;
  context: any;
}

export function routeIntent(intentResult: IntentResult, currentMindmap?: any): RouteResult {
  // Validate high-confidence intents get appropriate routing
  if (intentResult.confidence >= 0.8) {
    switch (intentResult.intent) {
      case 'create_new':
        return {
          handler: 'creation',
          systemPrompt: 'You are a learning path creation expert. Help users create new modules, courses, and learning structures. Be creative and suggest best practices for organizing knowledge.',
          shouldUseTools: false,
          context: {
            intent: 'create_new',
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities,
            hasCurrentMindmap: !!currentMindmap
          }
        };

      case 'edit_existing':
        return {
          handler: 'editing',
          systemPrompt: 'You are a learning path editing assistant. Help users modify existing modules, update content, and refine their learning structures. Use available editing tools when appropriate.',
          shouldUseTools: true,
          context: {
            intent: 'edit_existing',
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities,
            currentMindmap: currentMindmap,
            canEdit: !!currentMindmap
          }
        };

      case 'ask_question':
        return {
          handler: 'explanation',
          systemPrompt: 'You are a helpful learning guide. Answer questions about learning paths, explain concepts, and provide guidance on educational topics. Be clear and informative.',
          shouldUseTools: false,
          context: {
            intent: 'ask_question',
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities,
            questionType: determineQuestionType(intentResult.extractedEntities)
          }
        };

      default:
        // This shouldn't happen with high confidence, but fallback
        return {
          handler: 'chat',
          systemPrompt: 'You are a helpful AI assistant. Engage in conversation and help users with their learning journey.',
          shouldUseTools: false,
          context: {
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities
          }
        };
    }
  }

  // Medium confidence intents
  if (intentResult.confidence >= 0.5) {
    switch (intentResult.intent) {
      case 'create_new':
        return {
          handler: 'creation',
          systemPrompt: 'You are a learning path creation expert. Help users create new learning content. Ask clarifying questions if needed.',
          shouldUseTools: false,
          context: {
            intent: 'create_new',
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities,
            needsClarification: true
          }
        };

      case 'edit_existing':
        return {
          handler: 'editing',
          systemPrompt: 'You are a learning path editing assistant. Help users modify content. Confirm they have something to edit before proceeding.',
          shouldUseTools: !!currentMindmap,
          context: {
            intent: 'edit_existing',
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities,
            currentMindmap: currentMindmap,
            needsConfirmation: true
          }
        };

      case 'ask_question':
        return {
          handler: 'explanation',
          systemPrompt: 'You are a helpful learning guide. Answer questions and provide explanations. Ask for clarification if the question is unclear.',
          shouldUseTools: false,
          context: {
            intent: 'ask_question',
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities,
            needsClarification: true
          }
        };

      default:
        return {
          handler: 'chat',
          systemPrompt: 'You are a helpful AI assistant. Engage in conversation and help users with their learning journey.',
          shouldUseTools: false,
          context: {
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            extractedEntities: intentResult.extractedEntities
          }
        };
    }
  }

  // Low confidence intents - default to conversational
  return {
    handler: 'chat',
    systemPrompt: 'You are a helpful AI assistant. Engage in conversation and help users with their learning journey. Ask questions to better understand their needs.',
    shouldUseTools: false,
    context: {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      extractedEntities: intentResult.extractedEntities,
      needsClarification: true
    }
  };
}

// Helper function to determine question type based on extracted entities
function determineQuestionType(entities: string[]): string {
  if (entities.some(entity => ['how', 'explain', 'help'].includes(entity))) {
    return 'how_to';
  }
  if (entities.some(entity => ['what', 'describe', 'tell me'].includes(entity))) {
    return 'what_is';
  }
  if (entities.some(entity => ['why', 'reason'].includes(entity))) {
    return 'why';
  }
  if (entities.some(entity => ['when', 'timing'].includes(entity))) {
    return 'when';
  }
  if (entities.some(entity => ['where', 'location'].includes(entity))) {
    return 'where';
  }
  if (entities.some(entity => ['who', 'person'].includes(entity))) {
    return 'who';
  }
  return 'general';
}

// Helper function to validate routing decision
export function validateRoute(routeResult: RouteResult, intentResult: IntentResult): boolean {
  // High confidence intents should have specific handlers
  if (intentResult.confidence >= 0.8) {
    const validHandlers = ['creation', 'editing', 'explanation'];
    if (!validHandlers.includes(routeResult.handler)) {
      return false;
    }
  }

  // Editing intent should use tools if mindmap exists
  if (intentResult.intent === 'edit_existing' && routeResult.context?.canEdit) {
    return routeResult.shouldUseTools === true;
  }

  // Non-editing intents should not use tools
  if (intentResult.intent !== 'edit_existing') {
    return routeResult.shouldUseTools === false;
  }

  return true;
}

// Helper function to get handler description
export function getHandlerDescription(handler: string): string {
  const descriptions = {
    creation: 'Creates new learning content and structures',
    editing: 'Modifies existing learning content using available tools',
    explanation: 'Provides explanations and answers questions',
    chat: 'Engages in general conversation and assistance'
  };
  return descriptions[handler as keyof typeof descriptions] || 'Unknown handler';
}
