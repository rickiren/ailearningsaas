import { aiEditingTools, AIEditingTools } from './ai-editing-tools';
import { MindMapNode } from '@/types/artifacts';

// AI Prompt Parser
// Converts natural language commands to function calls

export interface ParsedCommand {
  action: string;
  function: keyof AIEditingTools;
  parameters: any[];
  success: boolean;
  message: string;
}

export class AIPromptParser {
  private editingTools = aiEditingTools;

  // Parse natural language command and execute it
  async parseAndExecute(prompt: string): Promise<ParsedCommand> {
    const lowerPrompt = prompt.toLowerCase().trim();
    
    try {
      console.log('🔍 Parsing AI command:', prompt);
      
      // Try to match the prompt to known patterns
      const command = this.parseCommand(lowerPrompt);
      
      if (!command) {
        console.log('❌ No command pattern matched for:', prompt);
        return {
          action: 'unknown',
          function: 'editCourseInfo' as keyof AIEditingTools,
          parameters: [],
          success: false,
          message: 'I couldn\'t understand that command. Please try rephrasing it. Try commands like:\n• "add a new module called [Title]"\n• "add a new module" (creates "New Module")\n• "change the title of [Module] to [New Title]"\n• "add the skill [Skill] to [Module]"\n• "set the difficulty of [Module] to [beginner/intermediate/advanced]"\n• "delete the module [Module]"'
        };
      }
      
      console.log('✅ Command parsed successfully:', command);

      // Execute the command
      const result = await this.executeCommand(command);
      
      return {
        action: command.action,
        function: command.function,
        parameters: command.parameters,
        success: result,
        message: result ? 
          `Successfully ${command.action}` : 
          `Failed to ${command.action}. Please check the module exists and try again.`
      };

    } catch (error) {
      console.error('Error parsing AI prompt:', error);
      return {
        action: 'error',
        function: 'editCourseInfo' as keyof AIEditingTools,
        parameters: [],
        success: false,
        message: 'An error occurred while processing your request. Please try again.'
      };
    }
  }

  // Parse the command to determine what action to take
  private parseCommand(prompt: string): { action: string; function: keyof AIEditingTools; parameters: any[] } | null {
    console.log('🔍 parseCommand called with:', prompt);
    
    // Module title editing
    if (this.matchesPattern(prompt, ['change', 'edit', 'update', 'modify'], ['title', 'name'], ['to', 'as'])) {
      const match = prompt.match(/(?:change|edit|update|modify)\s+(?:the\s+)?(?:title|name)\s+(?:of\s+)?(.+?)\s+(?:to|as)\s+(.+)/i);
      if (match) {
        const moduleIdentifier = match[1].trim();
        const newTitle = match[2].trim().replace(/['"]/g, '');
        return {
          action: `changed title of "${moduleIdentifier}" to "${newTitle}"`,
          function: 'editModuleTitle',
          parameters: [moduleIdentifier, newTitle]
        };
      }
    }

    // Module description editing
    if (this.matchesPattern(prompt, ['change', 'edit', 'update', 'modify'], ['description', 'desc'], ['to', 'as'])) {
      const match = prompt.match(/(?:change|edit|update|modify)\s+(?:the\s+)?(?:description|desc)\s+(?:of\s+)?(.+?)\s+(?:to|as)\s+(.+)/i);
      if (match) {
        const moduleIdentifier = match[1].trim();
        const newDescription = match[2].trim().replace(/['"]/g, '');
        return {
          action: `changed description of "${moduleIdentifier}"`,
          function: 'editModuleDescription',
          parameters: [moduleIdentifier, newDescription]
        };
      }
    }

    // Module difficulty editing
    if (this.matchesPattern(prompt, ['change', 'edit', 'update', 'set'], ['difficulty', 'level'], ['to', 'as'])) {
      const match = prompt.match(/(?:change|edit|update|set)\s+(?:the\s+)?(?:difficulty|level)\s+(?:of\s+)?(.+?)\s+(?:to|as)\s+(beginner|intermediate|advanced)/i);
      if (match) {
        const moduleIdentifier = match[1].trim();
        const newDifficulty = match[2].toLowerCase() as 'beginner' | 'intermediate' | 'advanced';
        return {
          action: `changed difficulty of "${moduleIdentifier}" to ${newDifficulty}`,
          function: 'editModuleDifficulty',
          parameters: [moduleIdentifier, newDifficulty]
        };
      }
    }

    // Module hours editing
    if (this.matchesPattern(prompt, ['change', 'edit', 'update', 'set'], ['hours', 'time', 'duration'], ['to', 'as'])) {
      const match = prompt.match(/(?:change|edit|update|set)\s+(?:the\s+)?(?:hours|time|duration)\s+(?:of\s+)?(.+?)\s+(?:to|as)\s+(\d+(?:\.\d+)?)/i);
      if (match) {
        const moduleIdentifier = match[1].trim();
        const newHours = parseFloat(match[2]);
        return {
          action: `changed hours of "${moduleIdentifier}" to ${newHours}`,
          function: 'editModuleHours',
          parameters: [moduleIdentifier, newHours]
        };
      }
    }

    // Add skill to module
    if (this.matchesPattern(prompt, ['add', 'include'], ['skill'], ['to'])) {
      const match = prompt.match(/(?:add|include)\s+(?:the\s+)?skill\s+(.+?)\s+to\s+(.+)/i);
      if (match) {
        const skill = match[1].trim().replace(/['"]/g, '');
        const moduleIdentifier = match[2].trim();
        return {
          action: `added skill "${skill}" to "${moduleIdentifier}"`,
          function: 'addSkillToModule',
          parameters: [moduleIdentifier, skill]
        };
      }
    }

    // Remove skill from module
    if (this.matchesPattern(prompt, ['remove', 'delete', 'exclude'], ['skill'], ['from'])) {
      const match = prompt.match(/(?:remove|delete|exclude)\s+(?:the\s+)?skill\s+(.+?)\s+from\s+(.+)/i);
      if (match) {
        const skill = match[1].trim().replace(/['"]/g, '');
        const moduleIdentifier = match[2].trim();
        return {
          action: `removed skill "${skill}" from "${moduleIdentifier}"`,
          function: 'removeSkillFromModule',
          parameters: [moduleIdentifier, skill]
        };
      }
    }

    // Add prerequisite to module
    if (this.matchesPattern(prompt, ['add', 'include'], ['prerequisite', 'prereq'], ['to'])) {
      const match = prompt.match(/(?:add|include)\s+(?:the\s+)?(?:prerequisite|prereq)\s+(.+?)\s+to\s+(.+)/i);
      if (match) {
        const prerequisite = match[1].trim().replace(/['"]/g, '');
        const moduleIdentifier = match[2].trim();
        return {
          action: `added prerequisite "${prerequisite}" to "${moduleIdentifier}"`,
          function: 'addPrerequisiteToModule',
          parameters: [moduleIdentifier, prerequisite]
        };
      }
    }

    // Remove prerequisite from module
    if (this.matchesPattern(prompt, ['remove', 'delete', 'exclude'], ['prerequisite', 'prereq'], ['from'])) {
      const match = prompt.match(/(?:remove|delete|exclude)\s+(?:the\s+)?(?:prerequisite|prereq)\s+(.+?)\s+from\s+(.+)/i);
      if (match) {
        const prerequisite = match[1].trim().replace(/['"]/g, '');
        const moduleIdentifier = match[2].trim();
        return {
          action: `removed prerequisite "${prerequisite}" from "${moduleIdentifier}"`,
          function: 'removePrerequisiteFromModule',
          parameters: [moduleIdentifier, prerequisite]
        };
      }
    }

    // Add new module - more flexible pattern matching
    // Special case for "add a new module" without title
    if (prompt.toLowerCase().trim() === 'add a new module') {
      return {
        action: `added new module "New Module"`,
        function: 'addModule',
        parameters: [null, { title: 'New Module' }]
      };
    }
    
    if (this.matchesPattern(prompt, ['add', 'create', 'insert'], ['module', 'lesson', 'section', 'new'])) {
      // Try multiple regex patterns for better matching
      let match = prompt.match(/(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?(?:module|lesson|section)\s+(?:called\s+)?(.+?)(?:\s+to\s+(.+))?$/i);
      
      if (!match) {
        // Try simpler pattern for "add a new module"
        match = prompt.match(/(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?(?:module|lesson|section)/i);
        if (match) {
          // Extract title from the rest of the prompt
          const titleMatch = prompt.match(/(?:add|create|insert)\s+(?:a\s+)?(?:new\s+)?(?:module|lesson|section)\s+(.+)/i);
          if (titleMatch) {
            const fullTitle = titleMatch[1].trim();
            // Check if there's a "to" clause for parent
            const parentMatch = fullTitle.match(/(.+?)\s+to\s+(.+)/i);
            if (parentMatch) {
              const moduleTitle = parentMatch[1].trim().replace(/['"]/g, '');
              const parentIdentifier = parentMatch[2].trim();
              return {
                action: `added new module "${moduleTitle}"`,
                function: 'addModule',
                parameters: [parentIdentifier, { title: moduleTitle }]
              };
            } else {
              const moduleTitle = fullTitle.replace(/['"]/g, '');
              return {
                action: `added new module "${moduleTitle}"`,
                function: 'addModule',
                parameters: [null, { title: moduleTitle }]
              };
            }
          } else {
            // Handle case where no title is provided - create a default module
            return {
              action: `added new module "New Module"`,
              function: 'addModule',
              parameters: [null, { title: 'New Module' }]
            };
          }
        }
      }
      
      if (match) {
        const moduleTitle = match[1].trim().replace(/['"]/g, '');
        const parentIdentifier = match[2]?.trim() || null;
        return {
          action: `added new module "${moduleTitle}"`,
          function: 'addModule',
          parameters: [parentIdentifier, { title: moduleTitle }]
        };
      }
    }

    // Delete module
    if (this.matchesPattern(prompt, ['delete', 'remove', 'drop'], ['module', 'lesson', 'section'])) {
      const match = prompt.match(/(?:delete|remove|drop)\s+(?:the\s+)?(?:module|lesson|section)\s+(.+)/i);
      if (match) {
        const moduleIdentifier = match[1].trim();
        return {
          action: `deleted module "${moduleIdentifier}"`,
          function: 'deleteModule',
          parameters: [moduleIdentifier]
        };
      }
    }

    // Duplicate module
    if (this.matchesPattern(prompt, ['duplicate', 'copy', 'clone'], ['module', 'lesson', 'section'])) {
      const match = prompt.match(/(?:duplicate|copy|clone)\s+(?:the\s+)?(?:module|lesson|section)\s+(.+?)(?:\s+to\s+(.+))?$/i);
      if (match) {
        const moduleIdentifier = match[1].trim();
        const newParentIdentifier = match[2]?.trim() || undefined;
        return {
          action: `duplicated module "${moduleIdentifier}"`,
          function: 'duplicateModule',
          parameters: [moduleIdentifier, newParentIdentifier]
        };
      }
    }

    // Move module
    if (this.matchesPattern(prompt, ['move', 'relocate'], ['module', 'lesson', 'section'])) {
      const match = prompt.match(/(?:move|relocate)\s+(?:the\s+)?(?:module|lesson|section)\s+(.+?)\s+to\s+(.+)/i);
      if (match) {
        const moduleIdentifier = match[1].trim();
        const newParentIdentifier = match[2].trim();
        return {
          action: `moved module "${moduleIdentifier}" to "${newParentIdentifier}"`,
          function: 'moveModule',
          parameters: [moduleIdentifier, newParentIdentifier]
        };
      }
    }

    // Course title editing
    if (this.matchesPattern(prompt, ['change', 'edit', 'update', 'modify'], ['course', 'learning path'], ['title', 'name'], ['to', 'as'])) {
      const match = prompt.match(/(?:change|edit|update|modify)\s+(?:the\s+)?(?:course|learning\s+path)\s+(?:title|name)\s+(?:to|as)\s+(.+)/i);
      if (match) {
        const newTitle = match[1].trim().replace(/['"]/g, '');
        return {
          action: `changed course title to "${newTitle}"`,
          function: 'editCourseTitle',
          parameters: [newTitle]
        };
      }
    }

    // Course description editing
    if (this.matchesPattern(prompt, ['change', 'edit', 'update', 'modify'], ['course', 'learning path'], ['description', 'desc'], ['to', 'as'])) {
      const match = prompt.match(/(?:change|edit|update|modify)\s+(?:the\s+)?(?:course|learning\s+path)\s+(?:description|desc)\s+(?:to|as)\s+(.+)/i);
      if (match) {
        const newDescription = match[1].trim().replace(/['"]/g, '');
        return {
          action: `changed course description`,
          function: 'editCourseDescription',
          parameters: [newDescription]
        };
      }
    }

    // Merge modules
    if (this.matchesPattern(prompt, ['merge', 'combine'], ['module', 'lesson', 'section'])) {
      const match = prompt.match(/(?:merge|combine)\s+(?:the\s+)?(?:module|lesson|section)\s+(.+?)\s+(?:with|into)\s+(.+)/i);
      if (match) {
        const sourceIdentifier = match[1].trim();
        const targetIdentifier = match[2].trim();
        return {
          action: `merged module "${sourceIdentifier}" into "${targetIdentifier}"`,
          function: 'mergeModules',
          parameters: [sourceIdentifier, targetIdentifier]
        };
      }
    }

    return null;
  }

  // Helper function to check if prompt matches a pattern
  private matchesPattern(prompt: string, ...patternGroups: string[][]): boolean {
    const result = patternGroups.every(group => 
      group.some(word => prompt.toLowerCase().includes(word.toLowerCase()))
    );
    
    if (result) {
      console.log('✅ Pattern matched:', { prompt, patternGroups });
    }
    
    return result;
  }

  // Execute the parsed command
  private async executeCommand(command: { action: string; function: keyof AIEditingTools; parameters: any[] }): Promise<boolean> {
    try {
      const func = this.editingTools[command.function];
      if (typeof func === 'function') {
        // For module identification, we need to resolve the identifier to an actual module ID
        const resolvedParameters = await this.resolveModuleIdentifiers(command.parameters, command.function);
        const result = await func.apply(this.editingTools, resolvedParameters);
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error executing command:', error);
      return false;
    }
  }

  // Resolve module identifiers (titles) to actual module IDs
  private async resolveModuleIdentifiers(parameters: any[], functionName: string): Promise<any[]> {
    // Get current mindmap data to resolve identifiers
    const { currentArtifact } = this.editingTools['artifactStore' as any]?.getState() || {};
    if (!currentArtifact || currentArtifact.type !== 'mindmap') {
      throw new Error('No mindmap currently active');
    }

    const resolvedParameters = [...parameters];
    
    // Functions that need module ID resolution
    const needsResolution = [
      'editModuleTitle', 'editModuleDescription', 'editModuleDifficulty', 'editModuleHours',
      'addSkillToModule', 'removeSkillFromModule', 'addPrerequisiteToModule', 'removePrerequisiteFromModule',
      'deleteModule', 'duplicateModule', 'moveModule'
    ];

    if (needsResolution.includes(functionName)) {
      // First parameter is usually the module identifier
      if (resolvedParameters[0] && typeof resolvedParameters[0] === 'string') {
        const moduleId = this.findModuleIdByTitle(currentArtifact.data, resolvedParameters[0]);
        if (moduleId) {
          resolvedParameters[0] = moduleId;
        } else {
          throw new Error(`Module "${resolvedParameters[0]}" not found`);
        }
      }

      // For moveModule, second parameter also needs resolution
      if (functionName === 'moveModule' && resolvedParameters[1] && typeof resolvedParameters[1] === 'string') {
        const parentId = this.findModuleIdByTitle(currentArtifact.data, resolvedParameters[1]);
        if (parentId) {
          resolvedParameters[1] = parentId;
        } else {
          throw new Error(`Parent module "${resolvedParameters[1]}" not found`);
        }
      }

      // For mergeModules, both parameters need resolution
      if (functionName === 'mergeModules') {
        if (resolvedParameters[0] && typeof resolvedParameters[0] === 'string') {
          const sourceId = this.findModuleIdByTitle(currentArtifact.data, resolvedParameters[0]);
          if (sourceId) {
            resolvedParameters[0] = sourceId;
          } else {
            throw new Error(`Source module "${resolvedParameters[0]}" not found`);
          }
        }
        if (resolvedParameters[1] && typeof resolvedParameters[1] === 'string') {
          const targetId = this.findModuleIdByTitle(currentArtifact.data, resolvedParameters[1]);
          if (targetId) {
            resolvedParameters[1] = targetId;
          } else {
            throw new Error(`Target module "${resolvedParameters[1]}" not found`);
          }
        }
      }
    }

    return resolvedParameters;
  }

  // Find module ID by title (case-insensitive)
  private findModuleIdByTitle(root: MindMapNode, title: string): string | null {
    if (root.title.toLowerCase() === title.toLowerCase()) {
      return root.id;
    }
    
    if (root.children) {
      for (const child of root.children) {
        const found = this.findModuleIdByTitle(child, title);
        if (found) return found;
      }
    }
    
    return null;
  }
}

// Create and export a singleton instance
export const aiPromptParser = new AIPromptParser();

// Export the main parsing function for easier use
export const parseAndExecuteAICommand = (prompt: string) => aiPromptParser.parseAndExecute(prompt);
