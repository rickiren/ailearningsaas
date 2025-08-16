import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses chat message content to extract JSON data
 * Specifically looks for mindmap JSON structures
 */
export function parseMessageForJson(content: string): { type: string; data: any } | null {
  try {
    // Look for JSON blocks in the content
    const jsonMatches = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/g);
    
    if (jsonMatches) {
      for (const match of jsonMatches) {
        // Extract the JSON content from the code block
        const jsonContent = match.replace(/```(?:json)?\s*/, '').replace(/\s*```/, '');
        
        try {
          const parsed = JSON.parse(jsonContent);
          
          // Check if this is a mindmap
          if (parsed.type === 'mindmap' && parsed.data) {
            return {
              type: 'mindmap',
              data: parsed.data
            };
          }
          
          // Check if the root object itself is a mindmap
          if (parsed.type === 'mindmap' && parsed.title && parsed.children) {
            return {
              type: 'mindmap',
              data: parsed
            };
          }
        } catch (parseError) {
          // Continue to next match if this one fails to parse
          continue;
        }
      }
    }
    
    // Look for raw JSON without code blocks - be more flexible
    // First, try to find any JSON object that might be a mindmap
    const jsonObjects = content.match(/\{[^{}]*"children"[^{}]*\}/g);
    
    if (jsonObjects) {
      for (const jsonStr of jsonObjects) {
        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check if this looks like a mindmap (has children array)
          if (parsed.children && Array.isArray(parsed.children) && parsed.title) {
            console.log('🔍 Found potential mindmap JSON:', parsed);
            return {
              type: 'mindmap',
              data: parsed
            };
          }
        } catch (parseError) {
          // Continue to next match if this one fails to parse
          continue;
        }
      }
    }
    
    // Also try to find JSON without code blocks (in case AI doesn't use them)
    const jsonRegex = /\{[\s\S]*?"type"\s*:\s*"mindmap"[\s\S]*?\}/;
    const match = content.match(jsonRegex);
    
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed.type === 'mindmap') {
          return {
            type: 'mindmap',
            data: parsed.data || parsed
          };
        }
      } catch (parseError) {
        // Ignore parse errors
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing message for JSON:', error);
    return null;
  }
}

/**
 * Validates mindmap data structure
 */
export function validateMindMapData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Check for required fields
  if (!data.title || !data.children || !Array.isArray(data.children)) {
    return false;
  }
  
  // Recursively validate children
  const validateNode = (node: any): boolean => {
    if (!node || typeof node !== 'object') return false;
    if (!node.id || !node.title) return false;
    
    if (node.children && Array.isArray(node.children)) {
      return node.children.every(validateNode);
    }
    
    return true;
  };
  
  return validateNode(data);
}

/**
 * Processes AI message content to separate conversational text from JSON data
 * Returns an object with display content (clean text) and extracted JSON
 */
export function processAIMessage(content: string): {
  displayContent: string;
  jsonData: { type: string; data: Record<string, unknown> } | null;
} {
  // Extract JSON for mind map (existing logic)
  const jsonData = parseMessageForJson(content);
  
  // Remove JSON blocks from display content
  let displayContent = content
    .replace(/```json\s*[\s\S]*?\s*```/g, '') // Remove JSON code blocks
    .replace(/```\s*[\s\S]*?\s*```/g, '')     // Remove any other code blocks
    .trim(); // Clean up whitespace
  
  // Also remove any raw JSON objects that look like mindmaps
  if (jsonData) {
    // Remove any large JSON objects from the display content
    displayContent = displayContent
      .replace(/\{[^{}]*"children"[^{}]*\}/g, '')
      .replace(/\{[\s\S]*?"type"\s*:\s*"mindmap"[\s\S]*?\}/g, '')
      .trim();
  }
  
  return {
    displayContent,
    jsonData
  };
}

/**
 * Checks if content contains streaming JSON that should be hidden from chat display
 */
export function hasStreamingJson(content: string): boolean {
  const jsonData = parseMessageForJson(content);
  return jsonData !== null;
}