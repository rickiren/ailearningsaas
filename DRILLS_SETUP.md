# Drills System Setup Guide

This guide explains how to set up and use the new drills system in the AI Learning Path SaaS application.

## Overview

The drills system allows users to create, store, and manage interactive learning exercises that can be tied to specific projects and skill nodes. Drills are the core learning mechanism where users actually practice and learn skills.

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create the drills table:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f supabase-migration-drills.sql
```

Or copy and paste the contents of `supabase-migration-drills.sql` into your Supabase SQL editor.

### 2. Table Structure

The `drills` table includes:

- **Basic Info**: `id`, `title`, `description`, `type`, `skill_name`
- **Learning Details**: `learning_objectives`, `difficulty`, `estimated_time`, `code`
- **Relationships**: `project_id`, `skill_atom_ids` (optional)
- **Metadata**: `tags`, `version`, `is_active`, `metadata`
- **Timestamps**: `created_at`, `updated_at`
- **Ownership**: `user_id`

### 3. Row Level Security (RLS)

The table is protected with RLS policies that ensure users can only access their own drills or public drills.

## Code Structure

### 1. Types (`types/drills.ts`)

Defines the TypeScript interfaces for drills, including:
- `Drill` - Complete drill object
- `DrillPreview` - Lightweight drill preview
- `DrillType` - Supported drill types (html, jsx, interactive, simulation, quiz)

### 2. Database Service (`lib/drill-service.ts`)

Handles all Supabase database operations:
- CRUD operations (Create, Read, Update, Delete)
- Querying by various criteria (project, skill, type, difficulty)
- Search functionality
- Pagination support

### 3. State Management (`lib/drill-store.ts`)

Zustand store for managing drill state:
- Local state management
- Integration with Supabase service
- Type conversion between local and database schemas

### 4. API Routes

- `app/api/drills/route.ts` - List and create drills
- `app/api/drills/[id]/route.ts` - Get, update, and delete individual drills

## Usage Examples

### Creating a Drill

```typescript
import { useDrillStore } from '@/lib/drill-store';

const drillStore = useDrillStore();

const newDrill = await drillStore.addDrill({
  title: 'React Hooks Practice',
  description: 'Learn to use React hooks effectively',
  type: 'jsx',
  skillName: 'React Hooks',
  learningObjectives: ['useState', 'useEffect', 'useContext'],
  difficulty: 'intermediate',
  estimatedTime: 30,
  code: '// Your code here...',
  metadata: {
    projectId: 'project-uuid',
    skillAtomIds: ['skill-uuid-1', 'skill-uuid-2'],
    tags: ['react', 'hooks', 'frontend']
  }
});
```

### Loading Drills

```typescript
// Load all user drills
await drillStore.loadDrills();

// Get drills by type
const htmlDrills = drillStore.getDrillsByType('html');

// Get drills by skill
const reactDrills = drillStore.getDrillsBySkill('React');
```

### Updating a Drill

```typescript
await drillStore.updateDrill(drillId, {
  title: 'Updated Title',
  difficulty: 'advanced',
  estimatedTime: 45
});
```

## Integration with Learning Path

### 1. Project Association

Drills can be associated with specific projects:
- Set `project_id` when creating drills
- Use `DrillService.getDrillsByProject(projectId)` to fetch project-specific drills

### 2. Skill Node Association

Drills can be linked to skill atoms:
- Set `skill_atom_ids` array when creating drills
- Use `DrillService.getDrillsBySkillAtom(skillAtomId)` to fetch skill-specific drills

### 3. Display in Learning Path

Drills can be displayed alongside skill nodes in the mindmap:
- Show drill count for each skill
- Allow users to access drills directly from skill nodes
- Filter drills by current learning path context

## Drill Types

### 1. HTML
- Static HTML exercises
- Form validation, layout practice
- Good for beginners

### 2. JSX
- React component exercises
- State management, props, hooks
- Intermediate to advanced

### 3. Interactive
- Dynamic exercises with user interaction
- JavaScript logic, DOM manipulation
- Various difficulty levels

### 4. Simulation
- Real-world scenario exercises
- Problem-solving, debugging
- Advanced level

### 5. Quiz
- Knowledge assessment exercises
- Multiple choice, true/false, coding questions
- All difficulty levels

## Best Practices

### 1. Drill Creation
- Use descriptive titles and clear learning objectives
- Set appropriate difficulty levels
- Include comprehensive code examples
- Add relevant tags for better discoverability

### 2. Organization
- Group related drills by skill or project
- Use consistent naming conventions
- Maintain version history for updates

### 3. Performance
- Use pagination for large drill collections
- Implement proper indexing on frequently queried fields
- Cache drill data when appropriate

## Testing

### 1. Database Operations
- Test CRUD operations with various data types
- Verify RLS policies work correctly
- Test array field operations (learning_objectives, skill_atom_ids)

### 2. API Endpoints
- Test all HTTP methods (GET, POST, PUT, DELETE)
- Verify error handling and validation
- Test query parameters and filtering

### 3. State Management
- Test drill store operations
- Verify type conversions work correctly
- Test error handling in async operations

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure user authentication is working
2. **Type Mismatches**: Check field names between local and database schemas
3. **Array Field Issues**: Verify array syntax in Supabase queries
4. **Permission Errors**: Check user roles and table permissions

### Debug Tips

- Enable Supabase query logging
- Check browser console for error messages
- Verify environment variables are set correctly
- Test database connections directly

## Future Enhancements

### Potential Features
- Drill templates and wizards
- Automated difficulty assessment
- Progress tracking and analytics
- Collaborative drill creation
- Drill marketplace/sharing
- Integration with external learning platforms

### Performance Optimizations
- Implement drill caching
- Add full-text search capabilities
- Optimize database queries
- Add drill recommendation algorithms
