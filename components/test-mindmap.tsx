'use client';

import { useChatStore } from '@/lib/chat-store';
import { Button } from '@/components/ui/button';

export function TestMindmap() {
  const { addMessage } = useChatStore();

  const testMindmapJson = `Here's your learning path:

\`\`\`json
{
  "type": "mindmap",
  "data": {
    "id": "root",
    "title": "Web Development Fundamentals",
    "description": "Complete web development learning path for beginners",
    "children": [
      {
        "id": "html",
        "title": "HTML Basics",
        "level": 1,
        "difficulty": "beginner",
        "estimatedHours": 10,
        "skills": ["Semantic HTML", "Accessibility", "SEO Basics", "Form Handling"],
        "children": [
          {
            "id": "html-structure",
            "title": "Document Structure",
            "level": 2,
            "difficulty": "beginner",
            "estimatedHours": 2,
            "skills": ["DOCTYPE Declaration", "Head Section", "Body Structure"]
          },
          {
            "id": "html-elements",
            "title": "HTML Elements",
            "level": 2,
            "difficulty": "beginner",
            "estimatedHours": 4,
            "skills": ["Text Elements", "Links", "Images", "Lists"]
          }
        ]
      },
      {
        "id": "css",
        "title": "CSS Styling",
        "level": 1,
        "difficulty": "beginner",
        "estimatedHours": 15,
        "skills": ["Responsive Design", "CSS Grid", "Animations", "CSS Variables"],
        "children": [
          {
            "id": "css-selectors",
            "title": "CSS Selectors",
            "level": 2,
            "difficulty": "beginner",
            "estimatedHours": 5,
            "skills": ["Class Selectors", "ID Selectors", "Attribute Selectors", "Pseudo-classes"]
          },
          {
            "id": "css-layout",
            "title": "Layout & Flexbox",
            "level": 2,
            "difficulty": "intermediate",
            "estimatedHours": 8,
            "skills": ["Flexbox Properties", "Grid Layout", "Positioning", "Box Model"]
          }
        ]
      },
      {
        "id": "javascript",
        "title": "JavaScript Programming",
        "level": 1,
        "difficulty": "intermediate",
        "estimatedHours": 25,
        "skills": ["ES6+ Features", "Async Programming", "Error Handling", "Testing"],
        "children": [
          {
            "id": "js-basics",
            "title": "Variables & Functions",
            "level": 2,
            "difficulty": "beginner",
            "estimatedHours": 8,
            "skills": ["Variable Declaration", "Function Syntax", "Scope", "Closures"]
          },
          {
            "id": "js-dom",
            "title": "DOM Manipulation",
            "level": 2,
            "difficulty": "intermediate",
            "estimatedHours": 10,
            "skills": ["Element Selection", "Event Handling", "DOM Traversal", "Dynamic Content"]
          }
        ]
      }
    ]
  }
}
\`\`\`

This learning path covers the essential skills needed to become a web developer. Start with HTML to understand structure, then move to CSS for styling, and finally learn JavaScript for interactivity. Each module and lesson includes specific skills that will be mastered.`;

  const handleTestMindmap = () => {
    addMessage({
      role: 'assistant',
      content: testMindmapJson,
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/20">
      <h3 className="text-lg font-semibold mb-2">Test Mindmap Detection</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click the button below to simulate an AI message containing mindmap JSON.
        This should trigger the mindmap detection and display it on the left side.
      </p>
      <Button onClick={handleTestMindmap} className="w-full">
        Test Mindmap JSON Detection
      </Button>
    </div>
  );
}
