'use client';

export type ChatMode = 'chat' | 'agent';

export interface ModeConfig {
  id: ChatMode;
  name: string;
  description: string;
  systemPrompt: string;
  allowedTools: string[];
  capabilities: string[];
  restrictions: string[];
  icon: string;
  color: string;
  bgColor: string;
}

// Mode-specific system prompts that control AI behavior
export const CHAT_MODE_CONFIGS: Record<ChatMode, ModeConfig> = {
  chat: {
    id: 'chat',
    name: 'Chat Mode',
    description: 'Discussion and advice only - no code modifications',
    systemPrompt: `You are an AI assistant in CHAT MODE - discussion and advisory only.

STRICT RESTRICTIONS IN CHAT MODE:
- You CANNOT write, modify, or create any files
- You CANNOT execute any development actions
- You CANNOT access project files or make changes
- You CANNOT use tools like Write, Edit, MultiEdit, Bash, etc.
- You are in READ-ONLY advisory mode only

WHAT YOU CAN DO IN CHAT MODE:
- Discuss code concepts and best practices
- Answer questions about programming and development
- Explain how code works or provide theoretical guidance
- Give advice on architecture and design patterns
- Help with debugging by suggesting approaches
- Provide learning resources and explanations

IMPORTANT: If the user asks you to modify code, create files, or make project changes, politely explain that you're in Chat Mode and suggest they switch to Agent Mode for those actions.

Always start responses by acknowledging you're in Chat Mode when relevant.`,
    allowedTools: [],
    capabilities: [
      'Discuss code and concepts',
      'Answer programming questions', 
      'Explain how code works',
      'Provide architectural advice',
      'Suggest debugging approaches',
      'Share learning resources'
    ],
    restrictions: [
      'Cannot modify files',
      'Cannot create new code',
      'Cannot execute actions',
      'Cannot access project files',
      'Read-only mode only'
    ],
    icon: '💬',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  
  agent: {
    id: 'agent',
    name: 'Agent Mode', 
    description: 'Full development capabilities - can modify code and files',
    systemPrompt: `You are an AI assistant in AGENT MODE - full development capabilities enabled.

FULL CAPABILITIES IN AGENT MODE:
- You CAN read, write, and modify files
- You CAN create new components and features  
- You CAN execute development actions
- You CAN use all available tools (Write, Edit, MultiEdit, Bash, etc.)
- You CAN make actual changes to the codebase
- You CAN run tests, builds, and other commands

APPROACH IN AGENT MODE:
- Always understand the existing codebase before making changes
- Follow established patterns and conventions
- Make incremental, well-tested changes
- Provide clear explanations of what you're doing
- Ask for confirmation on significant changes

You have full access to modify the project. Use your tools responsibly to help the user achieve their development goals.`,
    allowedTools: [
      'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Glob', 'Grep', 
      'LS', 'WebFetch', 'WebSearch', 'Task', 'NotebookEdit'
    ],
    capabilities: [
      'Read and write files',
      'Create new components',
      'Modify existing code', 
      'Execute shell commands',
      'Run tests and builds',
      'Install dependencies',
      'Full project access'
    ],
    restrictions: [
      'Should follow security best practices',
      'Must respect existing code patterns',
      'Should ask before major changes'
    ],
    icon: '🤖',
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50'
  }
};

// Tool access control
export function isToolAllowed(tool: string, mode: ChatMode): boolean {
  const config = CHAT_MODE_CONFIGS[mode];
  
  // In chat mode, no modification tools are allowed
  if (mode === 'chat') {
    // Allow only read-only tools
    const readOnlyTools = ['Read', 'Glob', 'Grep', 'LS', 'WebFetch', 'WebSearch'];
    return readOnlyTools.includes(tool);
  }
  
  // In agent mode, all tools are allowed
  return config.allowedTools.length === 0 || config.allowedTools.includes(tool);
}

// Get mode-specific system prompt
export function getModeSystemPrompt(mode: ChatMode): string {
  return CHAT_MODE_CONFIGS[mode].systemPrompt;
}

// Get mode configuration
export function getModeConfig(mode: ChatMode): ModeConfig {
  return CHAT_MODE_CONFIGS[mode];
}

// Validate if an action is allowed in current mode
export function validateModeAction(action: string, mode: ChatMode): {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
} {
  const modifyingActions = [
    'write file', 'edit file', 'create component', 'modify code',
    'run command', 'install package', 'delete file', 'update config'
  ];
  
  const isModifyingAction = modifyingActions.some(a => 
    action.toLowerCase().includes(a.toLowerCase())
  );
  
  if (mode === 'chat' && isModifyingAction) {
    return {
      allowed: false,
      reason: 'Code modification not allowed in Chat Mode',
      suggestion: 'Switch to Agent Mode to modify files and execute actions'
    };
  }
  
  return { allowed: true };
}

// Mode transition helpers
export function canSwitchToMode(fromMode: ChatMode, toMode: ChatMode): boolean {
  // Can always switch between modes
  return true;
}

export function getModeTransitionMessage(fromMode: ChatMode, toMode: ChatMode): string {
  if (fromMode === 'chat' && toMode === 'agent') {
    return 'Switched to Agent Mode - I can now modify files and execute actions';
  }
  
  if (fromMode === 'agent' && toMode === 'chat') {
    return 'Switched to Chat Mode - I can only discuss and provide advice (no code modifications)';
  }
  
  return `Switched to ${CHAT_MODE_CONFIGS[toMode].name}`;
}