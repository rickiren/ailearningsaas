'use client';

import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Download, Copy, Tag } from 'lucide-react';
import { useArtifacts } from '@/lib/use-artifacts';
import { type ArtifactInsert, type ArtifactUpdate } from '@/lib/supabase';
import { Zero280ArtifactRenderer } from './zero280-artifact-renderer';

interface ArtifactManagerProps {
  userId?: string;
  conversationId?: string;
  projectId?: string;
  type?: string;
  onArtifactSelect?: (artifact: any) => void;
}

export function ArtifactManager({ 
  userId, 
  conversationId, 
  projectId, 
  type, 
  onArtifactSelect 
}: ArtifactManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const {
    artifacts,
    loading,
    error,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    searchArtifacts,
    refreshArtifacts,
  } = useArtifacts({
    userId,
    conversationId,
    projectId,
    type,
    autoFetch: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchArtifacts(searchTerm);
  };

  const handleCreateArtifact = async (artifactData: ArtifactInsert) => {
    const newArtifact = await createArtifact(artifactData);
    if (newArtifact) {
      setIsCreating(false);
      setSelectedArtifact(newArtifact);
      if (onArtifactSelect) {
        onArtifactSelect(newArtifact);
      }
    }
  };

  const handleUpdateArtifact = async (id: string, updates: ArtifactUpdate) => {
    const updatedArtifact = await updateArtifact(id, updates);
    if (updatedArtifact) {
      setEditingArtifact(null);
      setSelectedArtifact(updatedArtifact);
      if (onArtifactSelect) {
        onArtifactSelect(updatedArtifact);
      }
    }
  };

  const handleDeleteArtifact = async (id: string) => {
    if (confirm('Are you sure you want to delete this artifact?')) {
      const success = await deleteArtifact(id);
      if (success && selectedArtifact?.id === id) {
        setSelectedArtifact(null);
      }
    }
  };

  const handleArtifactSelect = (artifact: any) => {
    setSelectedArtifact(artifact);
    if (onArtifactSelect) {
      onArtifactSelect(artifact);
    }
  };

  const renderArtifactForm = (artifact?: any, isEdit = false) => {
    const [formData, setFormData] = useState({
      name: artifact?.name || '',
      type: artifact?.type || 'html',
      content: artifact?.content || '',
      description: artifact?.description || '',
      preview: artifact?.preview || '',
      tags: artifact?.tags?.join(', ') || '',
      metadata: artifact?.metadata ? JSON.stringify(artifact.metadata, null, 2) : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const artifactData: ArtifactInsert = {
        name: formData.name,
        type: formData.type,
        content: formData.content,
        description: formData.description || undefined,
        preview: formData.preview || undefined,
        conversation_id: conversationId,
        project_id: projectId,
        user_id: userId,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        metadata: formData.metadata ? JSON.parse(formData.metadata) : {},
      };

      if (isEdit && artifact) {
        handleUpdateArtifact(artifact.id, artifactData);
      } else {
        handleCreateArtifact(artifactData);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          {isEdit ? 'Edit Artifact' : 'Create New Artifact'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="html">HTML</option>
              <option value="component">Component</option>
              <option value="react">React</option>
              <option value="jsx">JSX</option>
              <option value="interactive">Interactive</option>
              <option value="simulation">Simulation</option>
              <option value="quiz">Quiz</option>
              <option value="mindmap">Mind Map</option>
              <option value="skill-atom">Skill Atom</option>
              <option value="drill">Drill</option>
              <option value="progress">Progress</option>
              <option value="welcome">Welcome</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preview
            </label>
            <textarea
              value={formData.preview}
              onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., ui, react, component"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metadata (JSON)
            </label>
            <textarea
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder='{"category": "ui", "framework": "react"}'
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isEdit ? 'Update' : 'Create'} Artifact
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingArtifact(null);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={refreshArtifacts}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Artifacts</h2>
          <span className="text-sm text-gray-500">{artifacts.length} artifacts</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4" />
          New Artifact
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search artifacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Search
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              refreshArtifacts();
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
        )}
      </form>

      {/* Create/Edit Form */}
      {(isCreating || editingArtifact) && (
        renderArtifactForm(editingArtifact, !!editingArtifact)
      )}

      {/* Artifacts List */}
      <div className="grid gap-4">
        {artifacts.map((artifact) => (
          <div
            key={artifact.id}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer transition-colors ${
              selectedArtifact?.id === artifact.id
                ? 'border-blue-500 bg-blue-50'
                : 'hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleArtifactSelect(artifact)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-gray-900">{artifact.name}</h3>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {artifact.type}
                  </span>
                  {artifact.version > 1 && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      v{artifact.version}
                    </span>
                  )}
                </div>
                
                {artifact.description && (
                  <p className="text-sm text-gray-600 mb-2">{artifact.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Created: {new Date(artifact.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(artifact.updated_at).toLocaleDateString()}</span>
                  {artifact.tags && artifact.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {artifact.tags.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPreview(!showPreview);
                  }}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingArtifact(artifact);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteArtifact(artifact.id);
                  }}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && selectedArtifact?.id === artifact.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Zero280ArtifactRenderer
                  artifact={{
                    name: artifact.name,
                    type: artifact.type,
                    content: artifact.content,
                    description: artifact.description || '',
                    preview: artifact.preview || '',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {artifacts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>No artifacts found.</p>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Create your first artifact
            </button>
          )}
        </div>
      )}
    </div>
  );
}
