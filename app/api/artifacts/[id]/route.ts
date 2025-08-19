import { NextRequest, NextResponse } from 'next/server';
import { ArtifactService } from '@/lib/artifact-service';

// GET /api/artifacts/[id] - Get a specific artifact
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const artifact = await ArtifactService.getArtifact(params.id);

    if (!artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error('Error fetching artifact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artifact' },
      { status: 500 }
    );
  }
}

// PUT /api/artifacts/[id] - Update an artifact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, type, content, description, preview, tags, metadata } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (content !== undefined) updates.content = content;
    if (description !== undefined) updates.description = description;
    if (preview !== undefined) updates.preview = preview;
    if (tags !== undefined) updates.tags = tags;
    if (metadata !== undefined) updates.metadata = metadata;

    const artifact = await ArtifactService.updateArtifact(params.id, updates);

    if (!artifact) {
      return NextResponse.json(
        { error: 'Failed to update artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ artifact });
  } catch (error) {
    console.error('Error updating artifact:', error);
    return NextResponse.json(
      { error: 'Failed to update artifact' },
      { status: 500 }
    );
  }
}

// DELETE /api/artifacts/[id] - Delete an artifact (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await ArtifactService.deleteArtifact(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Artifact deleted successfully' });
  } catch (error) {
    console.error('Error deleting artifact:', error);
    return NextResponse.json(
      { error: 'Failed to delete artifact' },
      { status: 500 }
    );
  }
}

// PATCH /api/artifacts/[id] - Partial update or special operations
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { operation, ...data } = body;

    switch (operation) {
      case 'createVersion':
        // Create a new version of the artifact
        const newArtifact = await ArtifactService.createArtifactVersion(params.id, data);
        if (!newArtifact) {
          return NextResponse.json(
            { error: 'Failed to create artifact version' },
            { status: 500 }
          );
        }
        return NextResponse.json({ artifact: newArtifact });

      case 'restore':
        // Restore a soft-deleted artifact
        const restored = await ArtifactService.updateArtifact(params.id, { is_active: true });
        if (!restored) {
          return NextResponse.json(
            { error: 'Failed to restore artifact' },
            { status: 500 }
          );
        }
        return NextResponse.json({ artifact: restored });

      case 'hardDelete':
        // Permanently delete an artifact
        const success = await ArtifactService.hardDeleteArtifact(params.id);
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to hard delete artifact' },
            { status: 500 }
          );
        }
        return NextResponse.json({ message: 'Artifact permanently deleted' });

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error with PATCH operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform operation' },
      { status: 500 }
    );
  }
}
