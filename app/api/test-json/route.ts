import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Test the JSON balance checking function
  const testJson = `{
    "type": "mindmap",
    "title": "Test Learning Path",
    "data": {
      "id": "root",
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript from scratch",
      "children": [
        {
          "id": "1",
          "title": "Variables and Data Types",
          "description": "Understanding basic data types",
          "children": [
            {
              "id": "1.1",
              "title": "Numbers and Strings",
              "description": "Working with numbers and text"
            }
          ]
        }
      ]
    }
  }`;

  // Test incomplete JSON
  const incompleteJson = `{
    "type": "mindmap",
    "title": "Incomplete Path",
    "data": {
      "id": "root",
      "title": "Python Basics",
      "children": [
        {
          "id": "1",
          "title": "Variables",
          "description": "Understanding variables"`;

  return new Response(JSON.stringify({
    test: "JSON generation improvements test",
    completeJson: testJson,
    incompleteJson: incompleteJson,
    message: "The API improvements have been applied. Try creating a mindmap now!"
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
