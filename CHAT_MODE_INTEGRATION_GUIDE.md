# Chat Mode Integration Guide

Transform your chat interface to support **Chat Mode** (discussion only) and **Agent Mode** (full development capabilities).

## 🎯 What This Implements

**Chat Mode** - Safe discussion without code modifications:
- AI can explain, discuss, and provide advice
- AI CANNOT write, modify, or execute code  
- AI CANNOT access files or make project changes
- Read-only advisory mode only

**Agent Mode** - Full development capabilities:
- AI can read, write, and modify files
- AI can create components and execute actions
- AI can use all development tools
- Full access to project modification

## 🚀 Quick Integration

### Step 1: Replace Your Chat API Route

```typescript
// Replace /app/api/chat/route.ts with mode-aware version
import { ChatMode, getModeSystemPrompt, isToolAllowed } from '@/lib/chat-modes';

// Your API now respects mode and filters tools automatically
const availableTools = getToolsForMode(mode);
const modeAwareSystemMessage = generateModeAwareSystemMessage(mode, baseSystemMessage);
```

### Step 2: Add Mode Controls to Your Interface

```typescript
import { ChatModeToggle } from '@/components/chat/chat-mode-toggle';
import { ModeStatusIndicator } from '@/components/chat/mode-status-indicator';
import { useChatMode } from '@/hooks/use-chat-mode';

export function YourChatInterface() {
  const { currentMode, switchMode, modeConfig } = useChatMode();
  
  return (
    <div>
      {/* Add mode toggle */}
      <ChatModeToggle />
      
      {/* Show current mode status */}
      <ModeStatusIndicator />
      
      {/* Your existing chat messages */}
      {/* Your existing chat input */}
    </div>
  );
}
```

### Step 3: Make Messages Mode-Aware

```typescript
import { useModeAwareMessaging } from '@/components/chat/mode-aware-chat-handler';

const { sendModeAwareMessage, currentMode } = useModeAwareMessaging();

const handleSendMessage = async (message: string) => {
  // Message is automatically validated against current mode
  const canSend = await sendModeAwareMessage(message, {
    requireAgentMode: containsModificationKeywords(message)
  });
  
  if (canSend) {
    // Proceed with sending message
    await sendStreamingMessage(message);
  }
};
```

## 📁 Files Created

### Core Mode Logic
- `lib/chat-modes.ts` - Mode configurations, system prompts, tool access control
- `hooks/use-chat-mode.ts` - React hook for mode state management
- `components/chat/mode-aware-chat-handler.tsx` - Message validation and tool blocking

### UI Components  
- `components/chat/chat-mode-toggle.tsx` - Toggle button with mode switching
- `components/chat/mode-status-indicator.tsx` - Visual indicators showing current mode
- `components/chat/mode-integrated-chat-interface.tsx` - Complete chat interface with mode support

### API Integration
- `app/api/chat/route-with-mode-support.ts` - Enhanced API route that respects modes

## 🔧 Detailed Integration Steps

### 1. Update Your Existing Chat Component

```typescript
// Before - basic chat
export function ChatInterface() {
  const [message, setMessage] = useState('');
  
  const sendMessage = async () => {
    // Send to API without mode awareness
    await fetch('/api/chat', { 
      method: 'POST',
      body: JSON.stringify({ message })
    });
  };
}

// After - mode-aware chat
export function ChatInterface() {
  const [message, setMessage] = useState('');
  const { currentMode, handleRestrictedAction } = useChatMode();
  const { sendModeAwareMessage } = useModeAwareMessaging();
  
  const sendMessage = async () => {
    // Message automatically validated against current mode
    const canSend = await sendModeAwareMessage(message);
    
    if (canSend) {
      await fetch('/api/chat', { 
        method: 'POST',
        body: JSON.stringify({ 
          message,
          mode: currentMode  // Include mode in API call
        })
      });
    }
  };
}
```

### 2. Replace Your API Route

```typescript
// In /app/api/chat/route.ts
import { ChatMode, getModeSystemPrompt, isToolAllowed } from '@/lib/chat-modes';

export async function POST(request: NextRequest) {
  const { message, mode = 'chat' as ChatMode } = await request.json();
  
  // Get mode-appropriate tools (filtered automatically)
  const availableTools = getToolsForMode(mode);
  
  // Add mode-specific system prompt
  const modeSystemPrompt = getModeSystemPrompt(mode);
  
  // Your existing Claude API call now respects mode
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    system: modeSystemPrompt,
    tools: availableTools,  // Automatically filtered
    messages: [{ role: 'user', content: message }],
    // ... rest of your config
  });
}
```

### 3. Add Visual Mode Indicators

```typescript
// Add to your chat header
<div className="chat-header">
  <ChatModeToggle />
  <ModeStatusIndicator compact />
</div>

// Add mode warnings when needed
{lastRestrictedAction && (
  <ModeWarningBanner
    message="This action requires Agent Mode. Switch modes to modify files."
    type="warning"
  />
)}
```

## 🎨 Mode Behavior Examples

### Chat Mode Behavior
```typescript
// User: "Create a new React component for user login"
// AI Response:
"I'm in Chat Mode, so I can't create files directly. However, I can help you plan the component structure:

Here's what your LoginComponent.tsx should include:
- useState for email/password
- Form validation logic
- Submit handler
- Error handling

Would you like me to explain any of these concepts in detail? Switch to Agent Mode when you're ready for me to create the actual file."
```

### Agent Mode Behavior  
```typescript
// User: "Create a new React component for user login"
// AI Response:
"I'll create a complete login component for you.

[Creates LoginComponent.tsx with full implementation]
[Sets up proper TypeScript types]
[Adds styling and validation]

✅ Created components/auth/LoginComponent.tsx
✅ Added proper form validation
✅ Included TypeScript types

The component is ready to use in your app!"
```

## 🔒 Security & Safety Features

### Automatic Tool Blocking
```typescript
// In Chat Mode, these actions are automatically blocked:
- create_artifact() ❌ Blocked  
- update_artifact() ❌ Blocked
- file modifications ❌ Blocked
- shell commands ❌ Blocked

// Only discussion tools are available:
- explain_code() ✅ Allowed
- code_analysis() ✅ Allowed
```

### User Confirmation for Mode Switching
```typescript
// When switching to Agent Mode, users see:
"Switch to Agent Mode?

Agent Mode will give the AI full access to:
• Read and write files  
• Execute development actions
• Modify your codebase

Continue?"
```

### Restricted Action Warnings
```typescript
// When users try restricted actions in Chat Mode:
"❌ Action Blocked: Code modification not allowed in Chat Mode

💡 Suggestion: Switch to Agent Mode to modify files and execute actions"
```

## 📊 Mode Comparison

| Feature | Chat Mode | Agent Mode |
|---------|-----------|------------|
| **Discuss code** | ✅ Yes | ✅ Yes |
| **Explain concepts** | ✅ Yes | ✅ Yes |
| **Create files** | ❌ No | ✅ Yes |
| **Modify code** | ❌ No | ✅ Yes |
| **Run commands** | ❌ No | ✅ Yes |
| **Install packages** | ❌ No | ✅ Yes |
| **Safety level** | 🔒 Maximum | ⚡ Full access |

## 🧪 Testing Your Integration

1. **Test Chat Mode**:
   - Ask AI to explain code concepts ✅ Should work
   - Ask AI to create a file ❌ Should be blocked with helpful message
   - Try to modify existing code ❌ Should suggest switching modes

2. **Test Agent Mode**:
   - Ask AI to create components ✅ Should create files
   - Ask AI to modify code ✅ Should make changes
   - Ask AI to run build commands ✅ Should execute

3. **Test Mode Switching**:
   - Switch from Chat to Agent ✅ Should show confirmation
   - Switch from Agent to Chat ✅ Should switch immediately  
   - Try switching while streaming ✅ Should queue the switch

## 💡 Pro Tips

1. **Start in Chat Mode** - Safer default, users must opt-in to modifications
2. **Visual feedback** - Always show current mode clearly  
3. **Helpful suggestions** - When actions are blocked, suggest switching modes
4. **Confirmation dialogs** - Require confirmation when switching to Agent Mode
5. **Mode persistence** - Save user's preferred mode in localStorage

---

**Result**: Your chat now has safe Chat Mode for discussions and powerful Agent Mode for development work. Users can confidently explore ideas without accidental modifications, then switch to Agent Mode when they're ready to build!