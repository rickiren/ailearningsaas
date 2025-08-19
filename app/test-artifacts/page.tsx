'use client';

import { useState } from 'react';
import { ArtifactManager } from '@/components/artifacts/artifact-manager';
import { Zero280ArtifactRenderer } from '@/components/artifacts/zero280-artifact-renderer';
import { type Artifact } from '@/lib/supabase';

export default function TestArtifactsPage() {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const handleArtifactSelect = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artifacts Test Page</h1>
          <p className="text-gray-600">
            Test the artifacts database functionality. Create, edit, and manage artifacts from the zero280 chat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Artifacts Manager */}
          <div>
            <ArtifactManager
              onArtifactSelect={handleArtifactSelect}
            />
          </div>

          {/* Selected Artifact Preview */}
          <div className="sticky top-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Selected Artifact Preview
              </h2>
              
              {selectedArtifact ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Artifact Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div><strong>Name:</strong> {selectedArtifact.name}</div>
                      <div><strong>Type:</strong> {selectedArtifact.type}</div>
                      <div><strong>Version:</strong> {selectedArtifact.version}</div>
                      <div><strong>Created:</strong> {new Date(selectedArtifact.created_at).toLocaleString()}</div>
                      <div><strong>Updated:</strong> {new Date(selectedArtifact.updated_at).toLocaleString()}</div>
                      {selectedArtifact.description && (
                        <div><strong>Description:</strong> {selectedArtifact.description}</div>
                      )}
                      {selectedArtifact.tags && selectedArtifact.tags.length > 0 && (
                        <div><strong>Tags:</strong> {selectedArtifact.tags.join(', ')}</div>
                      )}
                    </div>
                  </div>

                  <Zero280ArtifactRenderer
                    artifact={{
                      name: selectedArtifact.name,
                      type: selectedArtifact.type,
                      content: selectedArtifact.content,
                      description: selectedArtifact.description || '',
                      preview: selectedArtifact.preview || '',
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Select an artifact from the list to preview it here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Artifacts Table Structure</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono">
                <div>id: UUID (Primary Key)</div>
                <div>name: TEXT (Required)</div>
                <div>type: TEXT (Required)</div>
                <div>content: TEXT (Required)</div>
                <div>description: TEXT</div>
                <div>preview: TEXT</div>
                <div>conversation_id: UUID</div>
                <div>project_id: UUID</div>
                <div>user_id: UUID</div>
                <div>version: INTEGER</div>
                <div>is_active: BOOLEAN</div>
                <div>tags: TEXT[]</div>
                <div>metadata: JSONB</div>
                <div>created_at: TIMESTAMP</div>
                <div>updated_at: TIMESTAMP</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Create, read, update, delete artifacts</li>
                <li>• Search artifacts by name/description</li>
                <li>• Filter by type, tags, conversation, or project</li>
                <li>• Version control for artifacts</li>
                <li>• Soft delete with restore capability</li>
                <li>• Row-level security (RLS)</li>
                <li>• Automatic timestamps</li>
                <li>• Tag-based organization</li>
                <li>• Flexible metadata storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
