# Duplicate Project Cleanup Guide

## Problem
The application was creating duplicate projects in the database when users clicked on saved learning paths. This happened because:

1. The system was creating new artifacts every time a saved mindmap was loaded
2. The duplicate detection logic was only checking for projects created within 5 minutes
3. Multiple components were calling `addArtifact` without checking for existing artifacts

## Solution Implemented

### 1. Enhanced Duplicate Detection
- Added `hasArtifact()` method to check for existing artifacts by title or project ID
- Updated all components to check for existing artifacts before creating new ones
- Improved mindmap store duplicate detection logic

### 2. Fixed Components
- `artifact-viewer.tsx` - Now checks for existing artifacts before loading
- `welcome-screen.tsx` - Prevents duplicate artifact creation
- `chat-interface.tsx` - Uses artifact store helper methods
- `artifact-store.ts` - Enhanced with duplicate prevention logic

### 3. Database Cleanup API
- Added cleanup endpoint at `/api/test-db` (DELETE method)
- Automatically removes duplicate projects, keeping the most recent one
- Safely deletes associated skill atoms before removing projects

## How to Clean Up Existing Duplicates

### Option 1: Use the API Endpoint
```bash
# View current duplicates
curl http://localhost:3000/api/test-db

# Clean up duplicates (DELETE request)
curl -X DELETE http://localhost:3000/api/test-db
```

### Option 2: Use the UI
1. Go to the Artifact Viewer
2. Click the "Cleanup Duplicates" button
3. This will remove duplicate artifacts from the local state

## Prevention Measures

### 1. Artifact Loading
- All components now check for existing artifacts before creating new ones
- Uses both title and project ID matching for robust duplicate detection

### 2. Database Level
- Mindmap store now appends timestamps to titles when conflicts are detected
- Prevents accidental overwrites of existing projects

### 3. Local State Management
- Artifact store maintains a single source of truth
- `hasArtifact()` method provides consistent duplicate checking

## Testing the Fix

1. **Load a saved learning path** - Should not create duplicates
2. **Switch between different saved paths** - Should reuse existing artifacts
3. **Check console logs** - Look for "🔍 Found existing artifact" messages
4. **Verify database** - Use `/api/test-db` to check for remaining duplicates

## Future Improvements

1. **Content Comparison**: Implement deep content comparison to detect when updates are actually needed
2. **User Preferences**: Allow users to choose between updating existing or creating new projects
3. **Versioning**: Implement proper versioning system for learning paths
4. **Audit Trail**: Track when and why duplicates were created

## Troubleshooting

### If duplicates still appear:
1. Check console logs for "🔍" messages
2. Verify that `hasArtifact()` is being called
3. Ensure all components are using the updated artifact store methods
4. Check if there are multiple artifact store instances

### If cleanup fails:
1. Check database permissions
2. Verify foreign key constraints
3. Look for console errors during cleanup process
4. Ensure the API endpoint is accessible
