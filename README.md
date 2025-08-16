# AI Learning Path SaaS

A Next.js application for managing AI-generated learning paths with a normalized Supabase backend and comprehensive tool endpoints.

## Features

- **Normalized Database Schema**: Efficient storage of projects and skill atoms with proper relationships
- **Tool Endpoints**: Cursor-style function calls for managing the mind map structure
- **Minimal UI**: Clean tree interface for managing learning paths
- **Zod Validation**: Type-safe API inputs and outputs
- **JSON Patch Support**: Efficient updates using RFC6902 patches

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL) + Next.js API Routes
- **Validation**: Zod schemas
- **JSON Operations**: fast-json-patch
- **Drag & Drop**: @dnd-kit (ready for future implementation)

## Quick Start

### 1. Environment Setup

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Setup

Run the schema migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase/sql/01_schema.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Seed Sample Data

```bash
npx tsx scripts/seed-ingest.ts
```

## API Endpoints

### Mind Map Ingest

**POST** `/api/mindmap/ingest`

Ingest a complete mind map JSON into normalized database tables.

```bash
curl -X POST http://localhost:3000/api/mindmap/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "projectTitle": "JavaScript Fundamentals",
    "graph": {
      "nodes": [
        {
          "id": "js-basics",
          "title": "JavaScript Basics",
          "type": "module",
          "parentId": null,
          "order": 0
        }
      ]
    }
  }'
```

### Tool Endpoints

All tool endpoints return responses in the format:
```json
{
  "ok": boolean,
  "data": any,
  "error": string
}
```

#### Get Graph

**GET** `/api/tools/get_graph?project_id={uuid}`

Retrieve all nodes for a project in hierarchical order.

```bash
curl "http://localhost:3000/api/tools/get_graph?project_id=123e4567-e89b-12d3-a456-426614174000"
```

#### Create Node

**POST** `/api/tools/create_node`

Create a new module or lesson.

```bash
curl -X POST http://localhost:3000/api/tools/create_node \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "parent_id": null,
    "type": "module",
    "atom_json": {
      "title": "New Module",
      "outcomes": ["Learn something new"],
      "notes": "Additional information",
      "tags": ["tag1", "tag2"]
    }
  }'
```

#### Apply Patch

**POST** `/api/tools/apply_patch`

Update node data using JSON Patch (RFC6902).

```bash
curl -X POST http://localhost:3000/api/tools/apply_patch \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "patch": [
      {"op": "replace", "path": "/title", "value": "Updated Title"}
    ]
  }'
```

#### Reorder Node

**POST** `/api/tools/reorder`

Change the order of a node within its parent.

```bash
curl -X POST http://localhost:3000/api/tools/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "new_index": 2
  }'
```

#### Move Node

**POST** `/api/tools/move_node`

Move a node to a different parent with specific ordering.

```bash
curl -X POST http://localhost:3000/api/tools/move_node \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "new_parent_id": "987fcdeb-51a2-43d1-b567-987654321000",
    "new_index": 0
  }'
```

#### Delete Node

**POST** `/api/tools/delete_node`

Delete a node with optional cascade deletion.

```bash
# Delete single node
curl -X POST http://localhost:3000/api/tools/delete_node \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }'

# Delete with cascade (removes entire subtree)
curl -X POST http://localhost:3000/api/tools/delete_node \
  -H "Content-Type: application/json" \
  -d '{
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "cascade": true
  }'
```

## Database Schema

### Projects Table
- `id`: UUID primary key
- `title`: Project name
- `created_at`, `updated_at`: Timestamps

### Skill Atoms Table
- `id`: UUID primary key
- `project_id`: Foreign key to projects
- `parent_id`: Self-referencing foreign key for hierarchy
- `type`: 'module' or 'lesson'
- `order_index`: Sibling ordering
- `atom_json`: JSONB content (title, outcomes, notes, tags)
- `created_at`, `updated_at`: Timestamps

### Constraints & Triggers
- Lessons cannot have children
- Automatic `updated_at` maintenance
- Cascade deletion for projects
- Order index management via RPC functions

## UI Components

### Tree View
- Hierarchical display of modules and lessons
- Inline editing of titles
- Add new modules/lessons
- Delete with cascade confirmation
- Expand/collapse tree sections

### Add Node Modal
- Type selection (module/lesson)
- Rich metadata input (outcomes, notes, tags)
- Validation and error handling

## Development

### Adding New Features
1. Update Zod schemas in `lib/schemas.ts`
2. Implement API endpoints in `app/api/tools/`
3. Add UI components in `components/`
4. Update types as needed

### Testing
- Use the seed script to populate test data
- Test all CRUD operations via the UI
- Verify database constraints and triggers
- Check API validation and error handling

## Future Enhancements

- **Drag & Drop**: Implement reordering with @dnd-kit
- **Authentication**: Add RLS policies and user management
- **Real-time Updates**: Supabase subscriptions for collaborative editing
- **Advanced Editing**: Rich text editor for notes and outcomes
- **Export/Import**: Support for various learning path formats

## Troubleshooting

### Common Issues

1. **Database Connection**: Verify Supabase environment variables
2. **Schema Errors**: Ensure all SQL migrations are applied
3. **Validation Errors**: Check Zod schema compliance
4. **CORS Issues**: Verify API route configuration

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## License

MIT License - see LICENSE file for details.
