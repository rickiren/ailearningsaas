// Test file for AI Editing Tools
// This file can be run with Jest or similar testing framework

import { aiEditingTools } from './ai-editing-tools';
import { parseAndExecuteAICommand } from './ai-prompt-parser';

// Mock the artifact store for testing
jest.mock('./artifact-store', () => ({
  useArtifactStore: {
    getState: () => ({
      currentArtifact: {
        id: 'test-artifact',
        type: 'mindmap',
        data: {
          id: 'root',
          title: 'Test Course',
          description: 'A test course',
          level: 0,
          children: [
            {
              id: 'module-1',
              title: 'JavaScript Basics',
              description: 'Learn JavaScript',
              level: 1,
              difficulty: 'beginner',
              estimatedHours: 2,
              skills: ['Variables', 'Functions'],
              prerequisites: ['HTML Basics'],
              children: []
            },
            {
              id: 'module-2',
              title: 'React Components',
              description: 'Build React apps',
              level: 1,
              difficulty: 'intermediate',
              estimatedHours: 3,
              skills: ['JSX', 'Props'],
              prerequisites: ['JavaScript Basics'],
              children: []
            }
          ]
        }
      }
    })
  }
}));

describe('AI Editing Tools', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Module Title Editing', () => {
    test('should change module title successfully', async () => {
      const result = await aiEditingTools.editModuleTitle('module-1', 'JavaScript Fundamentals');
      expect(result).toBe(true);
    });

    test('should fail for non-existent module', async () => {
      const result = await aiEditingTools.editModuleTitle('non-existent', 'New Title');
      expect(result).toBe(false);
    });
  });

  describe('Module Description Editing', () => {
    test('should change module description successfully', async () => {
      const result = await aiEditingTools.editModuleDescription('module-1', 'Learn JavaScript fundamentals');
      expect(result).toBe(true);
    });
  });

  describe('Module Difficulty Editing', () => {
    test('should change difficulty to intermediate', async () => {
      const result = await aiEditingTools.editModuleDifficulty('module-1', 'intermediate');
      expect(result).toBe(true);
    });

    test('should change difficulty to advanced', async () => {
      const result = await aiEditingTools.editModuleDifficulty('module-1', 'advanced');
      expect(result).toBe(true);
    });
  });

  describe('Module Hours Editing', () => {
    test('should change estimated hours', async () => {
      const result = await aiEditingTools.editModuleHours('module-1', 4);
      expect(result).toBe(true);
    });
  });

  describe('Skills Management', () => {
    test('should add skill to module', async () => {
      const result = await aiEditingTools.addSkillToModule('module-1', 'ES6 Syntax');
      expect(result).toBe(true);
    });

    test('should remove skill from module', async () => {
      const result = await aiEditingTools.removeSkillFromModule('module-1', 'Variables');
      expect(result).toBe(true);
    });
  });

  describe('Prerequisites Management', () => {
    test('should add prerequisite to module', async () => {
      const result = await aiEditingTools.addPrerequisiteToModule('module-1', 'CSS Basics');
      expect(result).toBe(true);
    });

    test('should remove prerequisite from module', async () => {
      const result = await aiEditingTools.removePrerequisiteFromModule('module-1', 'HTML Basics');
      expect(result).toBe(true);
    });
  });

  describe('Module Management', () => {
    test('should add new module', async () => {
      const result = await aiEditingTools.addModule(null, {
        title: 'New Module',
        description: 'A new module',
        level: 1,
        difficulty: 'beginner',
        estimatedHours: 2
      });
      expect(result).toBe(true);
    });

    test('should delete module', async () => {
      const result = await aiEditingTools.deleteModule('module-2');
      expect(result).toBe(true);
    });

    test('should duplicate module', async () => {
      const result = await aiEditingTools.duplicateModule('module-1');
      expect(result).toBe(true);
    });
  });

  describe('Course-Level Editing', () => {
    test('should change course title', async () => {
      const result = await aiEditingTools.editCourseTitle('Advanced JavaScript Course');
      expect(result).toBe(true);
    });

    test('should change course description', async () => {
      const result = await aiEditingTools.editCourseDescription('An advanced JavaScript course');
      expect(result).toBe(true);
    });
  });
});

describe('AI Prompt Parser', () => {
  test('should parse title change command', async () => {
    const result = await parseAndExecuteAICommand('change the title of "JavaScript Basics" to "JavaScript Fundamentals"');
    expect(result.success).toBe(true);
    expect(result.action).toContain('changed title');
  });

  test('should parse difficulty change command', async () => {
    const result = await parseAndExecuteAICommand('set the difficulty of "JavaScript Basics" to intermediate');
    expect(result.success).toBe(true);
    expect(result.action).toContain('changed difficulty');
  });

  test('should parse add skill command', async () => {
    const result = await parseAndExecuteAICommand('add the skill "ES6 Syntax" to "JavaScript Basics"');
    expect(result.success).toBe(true);
    expect(result.action).toContain('added skill');
  });

  test('should parse add module command', async () => {
    const result = await parseAndExecuteAICommand('add a new module called "State Management"');
    expect(result.success).toBe(true);
    expect(result.action).toContain('added new module');
  });

  test('should handle unknown command gracefully', async () => {
    const result = await parseAndExecuteAICommand('this is not a valid command');
    expect(result.success).toBe(false);
    expect(result.message).toContain('couldn\'t understand');
  });
});

// Example usage in real application:
/*
// User types in chat: "change the title of 'JavaScript Basics' to 'JavaScript Fundamentals'"

// The system:
1. Detects this is an editing command
2. Parses the command using AI prompt parser
3. Resolves "JavaScript Basics" to module ID
4. Calls editModuleTitle('module-1', 'JavaScript Fundamentals')
5. Updates the mindmap state
6. Shows success feedback
7. Saves to database

// Result: Module title is updated in real-time across the UI
*/
