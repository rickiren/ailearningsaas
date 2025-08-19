'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArtifactViewer } from '@/components/artifacts/artifact-viewer';
import { useArtifactStore } from '@/lib/artifact-store';
import { Artifact } from '@/lib/artifact-storage';
import { Plus, Search, Filter, Grid, List, Download, Upload, Trash2, RefreshCw } from 'lucide-react';

export default function TestArtifactsPage() {
  const { 
    artifacts, 
    currentArtifact, 
    isLoading, 
    error,
    searchQuery,
    activeFilters,
    viewMode,
    sortBy,
    sortOrder,
    selectedArtifacts,
    loadArtifacts,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    duplicateArtifact,
    setSearchQuery,
    setActiveFilters,
    clearFilters,
    setViewMode,
    setSortBy,
    setSortOrder,
    selectArtifact,
    selectAllArtifacts,
    clearSelection,
    deleteSelectedArtifacts,
    exportSelectedArtifacts,
    getStats
  } = useArtifactStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'component' as const,
    content: '',
    description: '',
    tags: ''
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadArtifacts();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const artifactStats = await getStats();
      setStats(artifactStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim()) return;

    try {
      const tags = createForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      await createArtifact({
        title: createForm.title,
        type: createForm.type,
        content: createForm.content,
        description: createForm.description || undefined,
        tags: tags.length > 0 ? tags : undefined
      });

      // Reset form
      setCreateForm({
        title: '',
        type: 'component',
        content: '',
        description: '',
        tags: ''
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create artifact:', error);
    }
  };

  const handleImportArtifacts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // This would need to be implemented in the artifact storage service
      console.log('Import functionality to be implemented');
    } catch (error) {
      console.error('Failed to import artifacts:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      const exportData = JSON.stringify(artifacts, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'artifacts-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export artifacts:', error);
    }
  };

  const filteredArtifacts = artifacts.filter(artifact => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        artifact.metadata.title.toLowerCase().includes(query) ||
        artifact.metadata.description?.toLowerCase().includes(query) ||
        artifact.content.toLowerCase().includes(query) ||
        artifact.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Artifact Management System</h1>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Artifact
              </Button>
              <Button variant="outline" onClick={handleExportAll}>
                <Download className="h-4 w-4" />
                Export All
              </Button>
              <Button variant="outline" onClick={loadArtifacts}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                <div className="text-sm text-blue-700">Total Artifacts</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{stats.byType.component || 0}</div>
                <div className="text-sm text-green-700">Components</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{stats.byType.function || 0}</div>
                <div className="text-sm text-purple-700">Functions</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">{formatFileSize(stats.totalSize)}</div>
                <div className="text-sm text-orange-700">Total Size</div>
              </div>
            </div>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Artifact</h3>
              <form onSubmit={handleCreateArtifact} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      value={createForm.title}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Artifact title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="component">Component</option>
                      <option value="function">Function</option>
                      <option value="class">Class</option>
                      <option value="interface">Interface</option>
                      <option value="type">Type</option>
                      <option value="html">HTML</option>
                      <option value="markdown">Markdown</option>
                      <option value="json">JSON</option>
                      <option value="mindmap">Mindmap</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Input
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Artifact description (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <Input
                    value={createForm.tags}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Comma-separated tags (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Artifact content/code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    Create Artifact
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search artifacts..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="created_at">Created</option>
                <option value="updated_at">Updated</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
                <option value="size">Size</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Selection Controls */}
          {selectedArtifacts.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedArtifacts.length} artifact(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSelectedArtifacts()}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Artifacts Grid/List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading artifacts...</p>
            </div>
          ) : filteredArtifacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No artifacts found.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredArtifacts.map((artifact) => (
                <div key={artifact.metadata.id} className="relative">
                  <input
                    type="checkbox"
                    checked={selectedArtifacts.includes(artifact.metadata.id)}
                    onChange={(e) => selectArtifact(artifact.metadata.id, e.target.checked)}
                    className="absolute top-2 left-2 z-10"
                  />
                  <ArtifactViewer
                    artifact={artifact}
                    showMetadata={true}
                    collapsible={true}
                    className="hover:shadow-lg transition-shadow"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateArtifact(artifact.metadata.id)}
                      className="text-xs"
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteArtifact(artifact.metadata.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
