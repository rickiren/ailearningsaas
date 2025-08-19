import { useState, useEffect, useCallback } from 'react';
import { type Artifact, type ArtifactInsert, type ArtifactUpdate } from './supabase';

interface UseArtifactsOptions {
  userId?: string;
  conversationId?: string;
  projectId?: string;
  type?: string;
  autoFetch?: boolean;
}

interface UseArtifactsReturn {
  artifacts: Artifact[];
  loading: boolean;
  error: string | null;
  createArtifact: (artifact: ArtifactInsert) => Promise<Artifact | null>;
  updateArtifact: (id: string, updates: ArtifactUpdate) => Promise<Artifact | null>;
  deleteArtifact: (id: string) => Promise<boolean>;
  refreshArtifacts: () => Promise<void>;
  searchArtifacts: (searchTerm: string) => Promise<void>;
  getArtifactsByTags: (tags: string[]) => Promise<void>;
  createArtifactVersion: (originalId: string, newData: ArtifactInsert) => Promise<Artifact | null>;
}

export function useArtifacts(options: UseArtifactsOptions = {}): UseArtifactsReturn {
  const { userId, conversationId, projectId, type, autoFetch = true } = options;
  
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (conversationId) params.append('conversationId', conversationId);
      if (projectId) params.append('projectId', projectId);
      if (type) params.append('type', type);

      const response = await fetch(`/api/artifacts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artifacts');
      }

      const data = await response.json();
      setArtifacts(data.artifacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artifacts');
    } finally {
      setLoading(false);
    }
  }, [userId, conversationId, projectId, type]);

  const createArtifact = useCallback(async (artifact: ArtifactInsert): Promise<Artifact | null> => {
    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artifact),
      });

      if (!response.ok) {
        throw new Error('Failed to create artifact');
      }

      const data = await response.json();
      const newArtifact = data.artifact;
      
      // Add to local state
      setArtifacts(prev => [newArtifact, ...prev]);
      
      return newArtifact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create artifact');
      return null;
    }
  }, []);

  const updateArtifact = useCallback(async (id: string, updates: ArtifactUpdate): Promise<Artifact | null> => {
    try {
      const response = await fetch(`/api/artifacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update artifact');
      }

      const data = await response.json();
      const updatedArtifact = data.artifact;
      
      // Update local state
      setArtifacts(prev => prev.map(artifact => 
        artifact.id === id ? updatedArtifact : artifact
      ));
      
      return updatedArtifact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update artifact');
      return null;
    }
  }, []);

  const deleteArtifact = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/artifacts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete artifact');
      }

      // Remove from local state
      setArtifacts(prev => prev.filter(artifact => artifact.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete artifact');
      return false;
    }
  }, []);

  const refreshArtifacts = useCallback(async () => {
    await fetchArtifacts();
  }, [fetchArtifacts]);

  const searchArtifacts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      await fetchArtifacts();
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ search: searchTerm });
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/artifacts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to search artifacts');
      }

      const data = await response.json();
      setArtifacts(data.artifacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search artifacts');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchArtifacts]);

  const getArtifactsByTags = useCallback(async (tags: string[]) => {
    if (tags.length === 0) {
      await fetchArtifacts();
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ tags: tags.join(',') });
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/artifacts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch artifacts by tags');
      }

      const data = await response.json();
      setArtifacts(data.artifacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch artifacts by tags');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchArtifacts]);

  const createArtifactVersion = useCallback(async (originalId: string, newData: ArtifactInsert): Promise<Artifact | null> => {
    try {
      const response = await fetch(`/api/artifacts/${originalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'createVersion',
          ...newData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create artifact version');
      }

      const data = await response.json();
      const newArtifact = data.artifact;
      
      // Add to local state
      setArtifacts(prev => [newArtifact, ...prev]);
      
      return newArtifact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create artifact version');
      return null;
    }
  }, []);

  // Auto-fetch artifacts when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchArtifacts();
    }
  }, [fetchArtifacts, autoFetch]);

  return {
    artifacts,
    loading,
    error,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    refreshArtifacts,
    searchArtifacts,
    getArtifactsByTags,
    createArtifactVersion,
  };
}
