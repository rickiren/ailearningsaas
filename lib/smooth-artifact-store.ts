import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ArtifactService } from './artifact-service';
import { supabase, Artifact as SupabaseArtifact } from './supabase';

export interface ArtifactMetadata {
  id: string;
  userId?: string;
  created_at: string;
  updated_at: string;
  type: string;
  title: string;
  description?: string;
  tags?: string[];
  version?: number;
  parentId?: string;
  dependencies?: string[];
  filePath?: string;
  size?: number;
  language?: string;
  framework?: string;
}

export interface Artifact {
  metadata: ArtifactMetadata;
  content: string;
  rawData?: any;
  id: string;
  type: string;
  // New properties for smooth updates
  isStreaming?: boolean;
  pendingUpdate?: boolean;
  updateProgress?: number;
  lastModified?: number;
}

export interface ArtifactFilter {
  type?: string;
  userId?: string;
  tags?: string[];
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
}

interface SmoothArtifactState {
  // State
  artifacts: Artifact[];
  currentArtifact: Artifact | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeFilters: ArtifactFilter;
  selectedArtifacts: string[];
  viewMode: 'grid' | 'list' | 'detail';
  sortBy: 'created_at' | 'updated_at' | 'title' | 'type' | 'size';
  sortOrder: 'asc' | 'desc';
  
  // New state for smooth updates
  streamingArtifacts: Set<string>;
  updateQueue: Map<string, Partial<Artifact>>;
  
  // Actions
  loadArtifacts: () => Promise<void>;
  loadArtifact: (id: string) => Promise<void>;
  refreshArtifacts: () => Promise<void>;
  
  // Enhanced CRUD operations
  createArtifact: (artifact: { title: string; type: string; content: string; description?: string; tags?: string[]; rawData?: any }) => Promise<string>;
  updateArtifact: (id: string, updates: Partial<Artifact>) => Promise<boolean>;
  deleteArtifact: (id: string) => Promise<boolean>;
  
  // New smooth update methods
  startArtifactStreaming: (id: string) => void;
  stopArtifactStreaming: (id: string) => void;
  queueArtifactUpdate: (id: string, updates: Partial<Artifact>) => void;
  applyQueuedUpdates: (id: string) => void;
  updateArtifactContent: (id: string, content: string, isStreaming?: boolean) => void;
  
  // Selection and navigation
  setCurrentArtifact: (artifact: Artifact | null) => void;
  selectArtifact: (id: string, selected?: boolean) => void;
  selectAllArtifacts: (selected: boolean) => void;
  clearSelection: () => void;
  
  // Search and filtering
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Partial<ArtifactFilter>) => void;
  clearFilters: () => void;
  
  // View and sorting
  setViewMode: (mode: 'grid' | 'list' | 'detail') => void;
  setSortBy: (sortBy: 'created_at' | 'updated_at' | 'title' | 'type' | 'size') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  
  // Utility methods
  getArtifactById: (id: string) => Artifact | null;
  getArtifactsByType: (type: ArtifactMetadata['type']) => Artifact[];
  getFilteredArtifacts: () => Artifact[];
  hasArtifact: (title: string, id?: string) => boolean;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Convert Supabase artifact to local Artifact format
const convertSupabaseArtifact = (supabaseArtifact: SupabaseArtifact): Artifact => {
  return {
    id: supabaseArtifact.id,
    content: supabaseArtifact.content,
    type: supabaseArtifact.type,
    rawData: supabaseArtifact.metadata,
    lastModified: Date.now(),
    metadata: {
      id: supabaseArtifact.id,
      userId: supabaseArtifact.user_id || undefined,
      created_at: supabaseArtifact.created_at,
      updated_at: supabaseArtifact.updated_at,
      type: supabaseArtifact.type,
      title: supabaseArtifact.name,
      description: supabaseArtifact.description || undefined,
      tags: supabaseArtifact.tags || [],
      version: supabaseArtifact.version,
      size: supabaseArtifact.content.length
    }
  };
};

export const useSmoothArtifactStore = create<SmoothArtifactState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    artifacts: [],
    currentArtifact: null,
    isLoading: false,
    error: null,
    searchQuery: '',
    activeFilters: {},
    selectedArtifacts: [],
    viewMode: 'grid',
    sortBy: 'created_at',
    sortOrder: 'desc',
    streamingArtifacts: new Set(),
    updateQueue: new Map(),

    // Loading and initialization
    loadArtifacts: async () => {
      try {
        set({ isLoading: true, error: null });
        const supabaseArtifacts = await ArtifactService.getUserArtifacts();
        const artifacts = supabaseArtifacts.map(convertSupabaseArtifact);
        set({ artifacts, isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load artifacts', 
          isLoading: false 
        });
      }
    },

    loadArtifact: async (id: string) => {
      try {
        set({ isLoading: true, error: null });
        const supabaseArtifact = await ArtifactService.getArtifact(id);
        if (supabaseArtifact) {
          const artifact = convertSupabaseArtifact(supabaseArtifact);
          set({ currentArtifact: artifact, isLoading: false });
        } else {
          set({ error: 'Artifact not found', isLoading: false });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load artifact', 
          isLoading: false 
        });
      }
    },

    refreshArtifacts: async () => {
      await get().loadArtifacts();
    },

    // Enhanced CRUD operations
    createArtifact: async (artifact) => {
      try {
        set({ isLoading: true, error: null });
        const supabaseArtifact = await ArtifactService.createArtifact({
          name: artifact.title,
          type: artifact.type,
          content: artifact.content,
          description: artifact.description,
          tags: artifact.tags || [],
          metadata: artifact.rawData || {}
        });
        
        if (!supabaseArtifact) {
          throw new Error('Failed to create artifact');
        }
        
        // Add the new artifact to the store immediately for better UX
        const newArtifact = convertSupabaseArtifact(supabaseArtifact);
        set(state => ({
          artifacts: [newArtifact, ...state.artifacts],
          isLoading: false
        }));
        
        return supabaseArtifact.id;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create artifact', 
          isLoading: false 
        });
        throw error;
      }
    },

    updateArtifact: async (id, updates) => {
      try {
        // Apply optimistic update immediately
        set(state => ({
          artifacts: state.artifacts.map(artifact => 
            artifact.id === id 
              ? { 
                  ...artifact, 
                  ...updates,
                  lastModified: Date.now(),
                  pendingUpdate: true 
                }
              : artifact
          ),
          currentArtifact: state.currentArtifact?.id === id 
            ? { ...state.currentArtifact, ...updates, lastModified: Date.now(), pendingUpdate: true }
            : state.currentArtifact
        }));

        const updateData: any = {};
        
        if (updates.content !== undefined) {
          updateData.content = updates.content;
        }
        if (updates.metadata?.title !== undefined) {
          updateData.name = updates.metadata.title;
        }
        if (updates.metadata?.description !== undefined) {
          updateData.description = updates.metadata.description;
        }
        if (updates.metadata?.tags !== undefined) {
          updateData.tags = updates.metadata.tags;
        }
        if (updates.type !== undefined) {
          updateData.type = updates.type;
        }
        if (updates.rawData !== undefined) {
          updateData.metadata = updates.rawData;
        }
        
        const updatedArtifact = await ArtifactService.updateArtifact(id, updateData);
        const success = !!updatedArtifact;
        
        if (success && updatedArtifact) {
          // Update with the server response
          const serverArtifact = convertSupabaseArtifact(updatedArtifact);
          set(state => ({
            artifacts: state.artifacts.map(artifact => 
              artifact.id === id 
                ? { ...serverArtifact, pendingUpdate: false }
                : artifact
            ),
            currentArtifact: state.currentArtifact?.id === id 
              ? { ...serverArtifact, pendingUpdate: false }
              : state.currentArtifact
          }));
        } else {
          // Revert optimistic update on failure
          await get().loadArtifacts();
        }
        
        return success;
      } catch (error) {
        // Revert optimistic update on error
        await get().loadArtifacts();
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update artifact'
        });
        return false;
      }
    },

    deleteArtifact: async (id) => {
      try {
        set({ isLoading: true, error: null });
        const success = await ArtifactService.deleteArtifact(id);
        if (success) {
          set(state => ({
            artifacts: state.artifacts.filter(artifact => artifact.id !== id),
            currentArtifact: state.currentArtifact?.id === id ? null : state.currentArtifact,
            selectedArtifacts: state.selectedArtifacts.filter(selectedId => selectedId !== id),
            isLoading: false
          }));
        }
        set({ isLoading: false });
        return success;
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete artifact', 
          isLoading: false 
        });
        return false;
      }
    },

    // New smooth update methods
    startArtifactStreaming: (id) => {
      set(state => ({
        streamingArtifacts: new Set([...state.streamingArtifacts, id]),
        artifacts: state.artifacts.map(artifact => 
          artifact.id === id 
            ? { ...artifact, isStreaming: true }
            : artifact
        ),
        currentArtifact: state.currentArtifact?.id === id 
          ? { ...state.currentArtifact, isStreaming: true }
          : state.currentArtifact
      }));
    },

    stopArtifactStreaming: (id) => {
      set(state => {
        const newStreamingArtifacts = new Set(state.streamingArtifacts);
        newStreamingArtifacts.delete(id);
        
        return {
          streamingArtifacts: newStreamingArtifacts,
          artifacts: state.artifacts.map(artifact => 
            artifact.id === id 
              ? { ...artifact, isStreaming: false }
              : artifact
          ),
          currentArtifact: state.currentArtifact?.id === id 
            ? { ...state.currentArtifact, isStreaming: false }
            : state.currentArtifact
        };
      });
      
      // Apply any queued updates
      get().applyQueuedUpdates(id);
    },

    queueArtifactUpdate: (id, updates) => {
      set(state => {
        const newUpdateQueue = new Map(state.updateQueue);
        const existingUpdate = newUpdateQueue.get(id) || {};
        newUpdateQueue.set(id, { ...existingUpdate, ...updates });
        return { updateQueue: newUpdateQueue };
      });
    },

    applyQueuedUpdates: (id) => {
      const state = get();
      const queuedUpdates = state.updateQueue.get(id);
      
      if (queuedUpdates) {
        set(currentState => {
          const newUpdateQueue = new Map(currentState.updateQueue);
          newUpdateQueue.delete(id);
          
          return {
            updateQueue: newUpdateQueue,
            artifacts: currentState.artifacts.map(artifact => 
              artifact.id === id 
                ? { ...artifact, ...queuedUpdates, lastModified: Date.now() }
                : artifact
            ),
            currentArtifact: currentState.currentArtifact?.id === id 
              ? { ...currentState.currentArtifact, ...queuedUpdates, lastModified: Date.now() }
              : currentState.currentArtifact
          };
        });
      }
    },

    updateArtifactContent: (id, content, isStreaming = false) => {
      const state = get();
      
      if (isStreaming && state.streamingArtifacts.has(id)) {
        // Queue the update while streaming
        get().queueArtifactUpdate(id, { content });
      } else {
        // Apply immediately
        set(currentState => ({
          artifacts: currentState.artifacts.map(artifact => 
            artifact.id === id 
              ? { ...artifact, content, lastModified: Date.now() }
              : artifact
          ),
          currentArtifact: currentState.currentArtifact?.id === id 
            ? { ...currentState.currentArtifact, content, lastModified: Date.now() }
            : currentState.currentArtifact
        }));
      }
    },

    // Selection and navigation
    setCurrentArtifact: (artifact) => {
      set({ currentArtifact: artifact });
    },

    selectArtifact: (id, selected = true) => {
      set(state => ({
        selectedArtifacts: selected
          ? [...state.selectedArtifacts, id]
          : state.selectedArtifacts.filter(selectedId => selectedId !== id)
      }));
    },

    selectAllArtifacts: (selected) => {
      if (selected) {
        const allIds = get().artifacts.map(a => a.metadata.id);
        set({ selectedArtifacts: allIds });
      } else {
        set({ selectedArtifacts: [] });
      }
    },

    clearSelection: () => {
      set({ selectedArtifacts: [] });
    },

    // Search and filtering
    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    setActiveFilters: (filters) => {
      set(state => ({
        activeFilters: { ...state.activeFilters, ...filters }
      }));
    },

    clearFilters: () => {
      set({ activeFilters: {}, searchQuery: '' });
    },

    // View and sorting
    setViewMode: (mode) => {
      set({ viewMode: mode });
    },

    setSortBy: (sortBy) => {
      set({ sortBy });
    },

    setSortOrder: (order) => {
      set({ sortOrder: order });
    },

    // Utility methods
    getArtifactById: (id) => {
      return get().artifacts.find(a => a.metadata.id === id) || null;
    },

    getArtifactsByType: (type) => {
      return get().artifacts.filter(a => a.metadata.type === type);
    },

    getFilteredArtifacts: () => {
      let artifacts = get().artifacts;
      const { searchQuery, activeFilters, sortBy, sortOrder } = get();

      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        artifacts = artifacts.filter(artifact => 
          artifact.metadata.title.toLowerCase().includes(query) ||
          artifact.metadata.description?.toLowerCase().includes(query) ||
          artifact.content.toLowerCase().includes(query) ||
          artifact.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Apply filters
      if (activeFilters.type) {
        artifacts = artifacts.filter(artifact => artifact.metadata.type === activeFilters.type);
      }
      if (activeFilters.tags && activeFilters.tags.length > 0) {
        artifacts = artifacts.filter(artifact => 
          activeFilters.tags!.some(tag => artifact.metadata.tags?.includes(tag))
        );
      }
      if (activeFilters.createdAfter) {
        artifacts = artifacts.filter(artifact => 
          artifact.metadata.created_at >= activeFilters.createdAfter!
        );
      }
      if (activeFilters.createdBefore) {
        artifacts = artifacts.filter(artifact => 
          artifact.metadata.created_at <= activeFilters.createdBefore!
        );
      }

      // Apply sorting
      artifacts.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case 'created_at':
            aValue = new Date(a.metadata.created_at).getTime();
            bValue = new Date(b.metadata.created_at).getTime();
            break;
          case 'updated_at':
            aValue = new Date(a.metadata.updated_at).getTime();
            bValue = new Date(b.metadata.updated_at).getTime();
            break;
          case 'title':
            aValue = a.metadata.title.toLowerCase();
            bValue = b.metadata.title.toLowerCase();
            break;
          case 'type':
            aValue = a.metadata.type;
            bValue = b.metadata.type;
            break;
          case 'size':
            aValue = a.metadata.size || 0;
            bValue = b.metadata.size || 0;
            break;
          default:
            aValue = a.metadata.created_at;
            bValue = b.metadata.created_at;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return artifacts;
    },

    hasArtifact: (title, id) => {
      const artifacts = get().artifacts;
      if (id) {
        return artifacts.some(a => a.metadata.id === id);
      }
      return artifacts.some(a => a.metadata.title === title);
    },

    // Error handling
    setError: (error) => {
      set({ error });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);