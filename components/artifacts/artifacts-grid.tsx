'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useArtifactStore } from '@/lib/artifact-store';
import { Artifact } from '@/lib/artifact-storage';
import { Eye, Code, MessageSquare, Calendar, ArrowUpRight, GraduationCap } from 'lucide-react';

interface ArtifactsGridProps {
  className?: string;
}

export function ArtifactsGrid({ className = '' }: ArtifactsGridProps) {
  const router = useRouter();
  const { 
    artifacts, 
    isLoading, 
    error, 
    loadArtifacts,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    getFilteredArtifacts
  } = useArtifactStore();

  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  useEffect(() => {
    // Use the store's built-in filtering and sorting
    const filtered = getFilteredArtifacts();
    setFilteredArtifacts(filtered);
  }, [artifacts, searchQuery, sortBy, sortOrder, getFilteredArtifacts]);

  const handleArtifactClick = (artifact: Artifact) => {
    // Navigate to the build page with the artifact ID
    // The build page will need to load the associated conversation
    const artifactId = artifact.metadata?.id || artifact.id;
    router.push(`/zero280/build?artifactId=${artifactId}`);
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'mindmap':
        return <Eye className="w-5 h-5" />;
      case 'skill-atom':
        return <GraduationCap className="w-5 h-5" />;
      case 'drill':
        return <Code className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 text-red-600 ${className}`}>
        <p>Error loading artifacts: {error}</p>
        <button 
          onClick={loadArtifacts}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (filteredArtifacts.length === 0) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No artifacts yet</p>
        <p className="text-sm">Create your first artifact by chatting with AI above</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header with search and filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Workspace</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at">Created</option>
              <option value="updated_at">Updated</option>
              <option value="title">Title</option>
              <option value="type">Type</option>
            </select>
            
            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Artifacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredArtifacts.map((artifact) => (
          <div
            key={artifact.id}
            onClick={() => handleArtifactClick(artifact)}
            className="group bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 hover:-translate-y-1"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {getArtifactIcon(artifact.type)}
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {artifact.metadata?.type || artifact.type}
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {artifact.metadata?.title || 'Untitled'}
            </h3>
            
            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(new Date(artifact.metadata?.updated_at || artifact.metadata?.created_at || Date.now()))}</span>
              </div>
            </div>
            
            {/* Preview content if available */}
            {artifact.metadata?.description && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {artifact.metadata.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
