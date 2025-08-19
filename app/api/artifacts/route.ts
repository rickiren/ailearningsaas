import { NextRequest, NextResponse } from 'next/server';
import { ArtifactService } from '@/lib/artifact-service';

// GET /api/artifacts - Get artifacts with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');

    let artifacts;

    if (search) {
      artifacts = await ArtifactService.searchArtifacts(search, userId || undefined);
    } else if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      artifacts = await ArtifactService.getArtifactsByTags(tagArray, userId || undefined);
    } else if (conversationId) {
      artifacts = await ArtifactService.getArtifactsByConversation(conversationId);
    } else if (projectId) {
      artifacts = await ArtifactService.getArtifactsByProject(projectId);
    } else if (type) {
      artifacts = await ArtifactService.getArtifactsByType(type, userId || undefined);
    } else {
      artifacts = await ArtifactService.getUserArtifacts(userId || undefined);
    }

    return NextResponse.json({ artifacts });
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artifacts' },
      { status: 500 }
    );
  }
}

// POST /api/artifacts - Create a new artifact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, content, description, preview, conversationId, projectId, userId, tags, metadata } = body;

    if (!name || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, content' },
        { status: 400 }
      );
    }

    const artifact = await ArtifactService.createArtifact({
      name,
      type,
      content,
      description,
      preview,
      conversation_id: conversationId,
      project_id: projectId,
      user_id: userId,
      tags: tags || [],
      metadata: metadata || {}
    });

    if (!artifact) {
      return NextResponse.json(
        { error: 'Failed to create artifact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ artifact }, { status: 201 });
  } catch (error) {
    console.error('Error creating artifact:', error);
    return NextResponse.json(
      { error: 'Failed to create artifact' },
      { status: 500 }
    );
  }
}
