# Drills Page - Interactive Learning Exercise Builder

The Drills page provides a comprehensive interface for creating, managing, and previewing interactive learning exercises, similar to Claude's artifact builder but specifically designed for educational content.

## Features

### 🎯 **Main Drills Page** (`/drills`)
- Clean, minimal design inspired by Claude's artifacts interface
- Three-panel layout with resizable panels
- Responsive design that works on desktop and mobile

### 📚 **Drill List Sidebar** (Left Panel)
- Shows all created drills with preview cards
- Each drill displays:
  - Title and skill name
  - Difficulty level (beginner/intermediate/advanced)
  - Estimated completion time
  - Drill type icon (HTML, JSX, Interactive, etc.)
- Search and filter functionality
- "Create New Drill" button at the bottom

### 🖥️ **Drill Preview Area** (Center Panel)
- Large preview of selected drill
- Live HTML rendering for web-based drills
- Code display for React/JSX components
- Edit mode with code editor
- Full-screen preview option
- Drill metadata display (learning objectives, difficulty, etc.)

### 🤖 **AI Chat Sidebar** (Right Panel)
- Specialized drill creation assistant
- Quick start suggestions:
  - Code Practice
  - Simulation
  - Interactive Tool
- AI generates functional code artifacts
- Automatic detection of HTML and JSX code blocks
- Real-time drill creation and modification

## Drill Types Supported

1. **HTML Drills** - Web-based interactive exercises
2. **JSX/React Drills** - React component practice
3. **Interactive Drills** - Dynamic learning tools
4. **Simulation Drills** - Real-world scenario practice
5. **Quiz Drills** - Assessment and testing

## How to Use

### Creating a New Drill
1. Navigate to `/drills`
2. Click "Create New Drill" button
3. Use the AI chat to describe your desired drill
4. The AI will generate functional code
5. Preview and test the drill in real-time
6. Save and manage your drills

### Example AI Prompts
- "Create an HTML form validation drill for beginners"
- "Build a React counter component with state management"
- "Make an interactive CSS Grid layout exercise"
- "Create a JavaScript function practice drill"

### Managing Drills
- **Edit**: Click the edit button to modify drill code
- **Copy**: Copy drill code to clipboard
- **Delete**: Remove drills you no longer need
- **Full Screen**: Expand preview for better testing
- **Search**: Find drills by title, skill, or content

## Technical Implementation

### Components
- `DrillsPage` - Main page layout with three panels
- `DrillListSidebar` - Left sidebar with drill list
- `DrillPreview` - Center preview/editor area
- `DrillChatSidebar` - Right AI chat interface
- `Navigation` - Top navigation bar

### State Management
- Uses Zustand store (`drill-store.ts`)
- Manages drill CRUD operations
- Handles drill selection and updates
- Supports drill versioning and metadata

### Data Structure
```typescript
interface Drill {
  id: string;
  title: string;
  description: string;
  type: DrillType;
  skillName: string;
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  code: string;
  metadata: {
    version: number;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
  };
}
```

## Future Enhancements

- [ ] Database integration with Supabase
- [ ] Drill sharing and collaboration
- [ ] Advanced drill templates
- [ ] Progress tracking and analytics
- [ ] Integration with course builder
- [ ] Export/import functionality
- [ ] Mobile-optimized interface
- [ ] Real-time collaboration

## Getting Started

1. Ensure all dependencies are installed: `npm install`
2. Start the development server: `npm run dev`
3. Navigate to `http://localhost:3000/drills`
4. Start creating interactive learning exercises!

The drills page provides a powerful foundation for creating engaging, hands-on learning experiences that complement your AI-powered learning path system.
