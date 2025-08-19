# Context Awareness System

## Overview

The Context Awareness System is a comprehensive AI-powered project analysis and intelligent file operations system that makes the AI truly project-aware and intelligent. It provides deep understanding of project structure, code patterns, and intelligent suggestions for file operations.

## Features Implemented

### 1. Project Structure Analysis
- **`analyze_project`**: Scans the entire project file structure
- **Framework Detection**: Automatically detects React, Next.js, Vue, Angular, or vanilla projects
- **Dependency Analysis**: Analyzes package.json for dependencies and scripts
- **File Classification**: Identifies components, pages, utilities, and other file types
- **Architecture Assessment**: Determines project complexity and architecture type

### 2. Smart Context Tools
- **`get_project_context`**: Comprehensive project information retrieval
- **`read_multiple_files`**: Read several related files at once for better context
- **`detect_code_patterns`**: Understand existing naming conventions and code style
- **`find_similar_files`**: Find related components or files based on content/purpose

### 3. Context-Aware Decision Making
- **Pattern Recognition**: AI considers existing code when creating new components
- **Convention Following**: Follows established patterns and naming conventions
- **Intelligent Suggestions**: Suggests improvements based on current project structure
- **Duplicate Prevention**: Avoids creating duplicate components or conflicting code

### 4. Enhanced Tool Intelligence
- **Smart Path Validation**: Validates file paths based on actual project structure
- **Context-Aware Suggestions**: Provides intelligent file location and naming suggestions
- **Dependency Analysis**: Understands file relationships and dependencies
- **Breaking Change Detection**: Identifies potential issues before they occur

### 5. Project Memory
- **Intelligent Caching**: Caches project structure analysis for faster responses
- **Change Tracking**: Remembers what files have been analyzed
- **Context Persistence**: Maintains context across multiple requests
- **Performance Optimization**: Reduces analysis time through smart caching

## Architecture

### Server-Side Components
- **`lib/context-awareness-server.ts`**: Core server-side implementation with Node.js file system access
- **API Routes**: RESTful endpoints for all context awareness operations
- **File System Operations**: Safe file reading, analysis, and pattern detection

### Client-Side Components
- **`lib/context-awareness-client.ts`**: Client-safe interface that communicates with server APIs
- **`lib/ai-editing-tools.ts`**: Enhanced AI editing tools with context awareness
- **Demo Interface**: Interactive demonstration of all system capabilities

### API Endpoints
- **`/api/context/analyze-project`**: GET - Analyze entire project structure
- **`/api/context/read-multiple`**: POST - Read multiple files with context
- **`/api/context/find-similar`**: POST - Find similar files by criteria
- **`/api/context/suggestions`**: POST - Get context-aware suggestions

## Usage Examples

### Basic Project Analysis
```typescript
import { contextAwarenessClient } from '@/lib/context-awareness-client';

// Analyze the entire project
const context = await contextAwarenessClient.analyzeProject();

console.log(`Project Type: ${context.projectType}`);
console.log(`Framework: ${context.framework}`);
console.log(`Total Components: ${context.analysis.totalComponents}`);
console.log(`Complexity: ${context.analysis.complexity}`);
```

### Finding Similar Files
```typescript
// Find files similar to a target file
const similarFiles = await contextAwarenessClient.findSimilarFiles(
  'app/components/Button.tsx',
  'purpose'
);

console.log('Similar files:', similarFiles);
```

### Getting Context-Aware Suggestions
```typescript
// Get suggestions for creating a new component
const suggestions = await contextAwarenessClient.getContextAwareSuggestions(
  'component',
  'UserProfile'
);

console.log('Suggested path:', suggestions.suggestedPath);
console.log('Suggested name:', suggestions.suggestedName);
console.log('Related files:', suggestions.relatedFiles);
```

### Reading Multiple Files
```typescript
// Read multiple related files for comprehensive context
const fileContents = await contextAwarenessClient.readMultipleFiles([
  'app/components/Header.tsx',
  'app/components/Footer.tsx',
  'app/components/Navigation.tsx'
]);

console.log('File contents:', fileContents);
```

## Code Patterns Detected

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile`, `NavigationBar`)
- **Files**: PascalCase (e.g., `Button.tsx`, `Header.tsx`)
- **Functions**: camelCase (e.g., `getUserData`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`, `MAX_RETRIES`)

### File Extensions
- **Components**: `.tsx`, `.jsx`, `.vue`
- **Pages**: `.tsx`, `.jsx`, `.vue`
- **Utilities**: `.ts`, `.js`
- **Styles**: `.css`, `.scss`, `.module.css`

### Folder Structure
- **Components**: `components/` or `src/components/`
- **Pages**: `app/` or `pages/`
- **Utilities**: `lib/` or `utils/`
- **Styles**: `styles/` or `css/`

## Project Analysis Output

### Basic Information
```typescript
{
  projectType: 'nextjs',
  framework: 'Next.js',
  version: '15.4.6',
  dependencies: { react: '^18.0.0', next: '^15.0.0' },
  devDependencies: { typescript: '^5.0.0' }
}
```

### File Statistics
```typescript
{
  totalFiles: 45,
  totalComponents: 12,
  totalPages: 8,
  totalUtilities: 15,
  complexity: 'medium',
  architecture: 'modular'
}
```

### Tech Stack Detection
```typescript
{
  techStack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
  recommendations: [
    'Consider breaking down large components into smaller, reusable pieces',
    'Implement a component library for consistency'
  ]
}
```

## Integration with AI Editing Tools

### Enhanced Artifact Creation
```typescript
import { aiEditingTools } from '@/lib/ai-editing-tools';

const result = await aiEditingTools.createArtifact({
  type: 'component',
  name: 'UserProfile',
  content: '// Component content here',
  followPatterns: true
});

console.log('Created at:', result.path);
console.log('Related files:', result.relatedFiles);
```

### Context-Aware Updates
```typescript
const result = await aiEditingTools.updateArtifact({
  path: 'app/components/Button.tsx',
  content: '// Updated content',
  preserveStructure: true
});

console.log('Update result:', result.message);
```

### Intelligent File Reading
```typescript
const result = await aiEditingTools.readFile({
  path: 'app/components/Button.tsx',
  includeContext: true,
  findRelated: true,
  analyzePatterns: true
});

console.log('File context:', result.context);
console.log('Related files:', result.relatedFiles);
console.log('Code patterns:', result.patterns);
```

## Demo Interface

### Access
Navigate to `/context-demo` to see the interactive demonstration of all context awareness capabilities.

### Features Demonstrated
- **Project Analysis**: Click "Analyze Project" to see comprehensive project breakdown
- **File Structure**: View hierarchical file structure with component/page/utility classification
- **Code Patterns**: See detected naming conventions and folder structures
- **Smart Suggestions**: Get context-aware suggestions for file operations
- **Similar File Detection**: Find files similar to a target file by various criteria

### Interactive Tabs
1. **Overview**: Project summary, statistics, and analysis
2. **File Structure**: Hierarchical view of all project files
3. **Code Patterns**: Detected naming conventions and folder structures
4. **Suggestions**: Context-aware suggestions and similar file detection

## Performance Features

### Intelligent Caching
- **Project Analysis**: Cached for 5 minutes to avoid repeated analysis
- **Code Patterns**: Cached until project structure changes
- **File Analysis**: Cached per file to avoid re-reading

### Optimized Operations
- **Batch File Reading**: Read multiple files in single API call
- **Smart File Filtering**: Only analyze relevant file types
- **Lazy Loading**: Load detailed analysis only when needed

## Error Handling

### Graceful Degradation
- **File Not Found**: Returns helpful error messages with suggestions
- **Permission Issues**: Handles file access errors gracefully
- **Invalid Paths**: Provides path validation and suggestions
- **Network Issues**: Handles API communication failures

### User-Friendly Messages
- **Clear Error Descriptions**: Explains what went wrong
- **Actionable Suggestions**: Provides next steps to resolve issues
- **Context Preservation**: Maintains available context even when errors occur

## Future Enhancements

### Planned Features
- **AST Analysis**: Deep code structure analysis using Abstract Syntax Trees
- **Semantic Understanding**: Better understanding of code purpose and relationships
- **Machine Learning**: Pattern recognition improvements through ML models
- **Real-time Updates**: Live project structure monitoring and updates

### Advanced Capabilities
- **Code Quality Metrics**: Automated code quality assessment
- **Refactoring Suggestions**: Intelligent refactoring recommendations
- **Performance Analysis**: Code performance impact analysis
- **Security Scanning**: Automated security vulnerability detection

## Technical Implementation

### Dependencies
- **`glob`**: File pattern matching and discovery
- **`fs`**: File system operations (server-side only)
- **`path`**: Path manipulation utilities (server-side only)

### Architecture Patterns
- **Separation of Concerns**: Server-side file operations, client-side UI
- **API-First Design**: RESTful endpoints for all operations
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Error Boundaries**: Graceful error handling at all levels

### Security Considerations
- **Path Validation**: Prevents directory traversal attacks
- **File Type Restrictions**: Only analyzes safe file types
- **Access Control**: Server-side only file operations
- **Input Sanitization**: Validates all user inputs

## Conclusion

The Context Awareness System successfully implements Step 4 of the AI learning path, providing comprehensive project understanding and intelligent file operations. The AI now has deep knowledge of project structure, follows established patterns, and makes context-aware decisions that improve code quality and consistency.

This system transforms the AI from a simple code generator into an intelligent project-aware assistant that understands the broader context of your codebase and makes informed decisions based on existing patterns and conventions.
