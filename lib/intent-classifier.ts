// Intent Classifier
// Works BEFORE the AI prompt parser to understand user intent
// This helps route commands to the appropriate processing logic

export interface IntentResult {
  intent: 'create_new' | 'edit_existing' | 'ask_question' | 'general_conversation';
  confidence: number;
  reasoning: string;
  extractedEntities: string[];
}

export function classifyUserIntent(message: string, hasCurrentMindmap: boolean): IntentResult {
  const lowerMessage = message.toLowerCase().trim();
  
  // Define intent patterns
  const createNewPatterns = [
    'create', 'make', 'build', 'generate', 'new', 'start', 'begin', 'initiate'
  ];
  
  const editExistingPatterns = [
    'change', 'edit', 'update', 'modify', 'add', 'remove', 'delete', 'alter', 
    'adjust', 'revise', 'rework', 'refactor', 'improve', 'enhance'
  ];
  
  const askQuestionPatterns = [
    'how', 'what', 'why', 'when', 'where', 'who', 'which', 'explain', 'help', 
    'tell me', 'show me', 'describe', 'clarify', 'understand', 'learn about'
  ];
  
  const learningWords = [
    'course', 'learning', 'path', 'knowledge', 'topic', 'subject', 'curriculum', 
    'syllabus', 'training', 'education'
  ];
  
  // PRIORITY 1: Check for edit_existing intent FIRST when there's an existing mindmap
  const hasEditWords = editExistingPatterns.some(word => lowerMessage.includes(word));
  
  if (hasEditWords && hasCurrentMindmap) {
    return {
      intent: 'edit_existing',
      confidence: 0.9,
      reasoning: `Message contains editing words (${editExistingPatterns.filter(w => lowerMessage.includes(w)).join(', ')}) and there is an active mindmap to edit`,
      extractedEntities: editExistingPatterns.filter(word => lowerMessage.includes(word))
    };
  }
  
  // PRIORITY 2: Check for create_new intent (but with editing priority logic)
  const hasCreateNewWords = createNewPatterns.some(word => lowerMessage.includes(word));
  const hasLearningWords = learningWords.some(word => lowerMessage.includes(word));
  
  // Negative patterns for creation - if message starts with editing verbs and hasCurrentMindmap=true, don't allow create_new
  const startsWithEditVerb = editExistingPatterns.some(verb => lowerMessage.startsWith(verb));
  if (startsWithEditVerb && hasCurrentMindmap) {
    return {
      intent: 'edit_existing',
      confidence: 0.9,
      reasoning: `Message starts with editing verb and there is an active mindmap - treating as edit_existing`,
      extractedEntities: editExistingPatterns.filter(word => lowerMessage.includes(word))
    };
  }
  
  if (hasCreateNewWords && hasLearningWords) {
    return {
      intent: 'create_new',
      confidence: 0.9,
      reasoning: `Message contains creation words (${createNewPatterns.filter(w => lowerMessage.includes(w)).join(', ')}) and learning-related terms (${learningWords.filter(w => lowerMessage.includes(w)).join(', ')})`,
      extractedEntities: learningWords.filter(word => lowerMessage.includes(word))
    };
  }
  
  if (hasCreateNewWords) {
    return {
      intent: 'create_new',
      confidence: 0.7,
      reasoning: `Message contains creation words (${createNewPatterns.filter(w => lowerMessage.includes(w)).join(', ')}) but lacks specific learning context`,
      extractedEntities: createNewPatterns.filter(word => lowerMessage.includes(word))
    };
  }
  
  // PRIORITY 3: Check for edit_existing intent when no mindmap exists
  if (hasEditWords && !hasCurrentMindmap) {
    return {
      intent: 'edit_existing',
      confidence: 0.4,
      reasoning: `Message contains editing words (${editExistingPatterns.filter(w => lowerMessage.includes(w)).join(', ')}) but no active mindmap exists to edit`,
      extractedEntities: editExistingPatterns.filter(word => lowerMessage.includes(word))
    };
  }
  
  // Check for ask_question intent
  const hasQuestionWords = askQuestionPatterns.some(word => lowerMessage.includes(word));
  
  if (hasQuestionWords) {
    return {
      intent: 'ask_question',
      confidence: 0.8,
      reasoning: `Message contains question words (${askQuestionPatterns.filter(w => lowerMessage.includes(w)).join(', ')}) indicating a request for information`,
      extractedEntities: askQuestionPatterns.filter(word => lowerMessage.includes(word))
    };
  }
  
  // Check for question mark (high confidence question indicator)
  if (message.includes('?')) {
    return {
      intent: 'ask_question',
      confidence: 0.9,
      reasoning: 'Message contains a question mark, indicating a direct question',
      extractedEntities: []
    };
  }
  
  // Fallback to general_conversation
  return {
    intent: 'general_conversation',
    confidence: 0.3,
    reasoning: 'Message does not clearly match any specific intent patterns - treating as general conversation',
    extractedEntities: []
  };
}

// Helper function to get confidence level description
export function getConfidenceDescription(confidence: number): string {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

// Helper function to check if intent is confident enough to proceed
export function isConfidentIntent(result: IntentResult, threshold: number = 0.5): boolean {
  return result.confidence >= threshold;
}

// Simple test to verify the classifier is working
console.log('=== INTENT CLASSIFIER TEST ===');
const testResult = classifyUserIntent("can you change the title of this course", true);
console.log('Test message: "can you change the title of this course"');
console.log('hasCurrentMindmap: true');
console.log('Intent:', testResult.intent);
console.log('Confidence:', testResult.confidence);
console.log('Reasoning:', testResult.reasoning);
console.log('Extracted Entities:', testResult.extractedEntities);
console.log('Confidence Level:', getConfidenceDescription(testResult.confidence));
console.log('Is Confident (>0.5):', isConfidentIntent(testResult));
console.log('================================');
