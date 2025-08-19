import { create } from 'zustand';
import { artifactStorage, Artifact, ArtifactMetadata, ArtifactFilter } from './artifact-storage';

interface ArtifactState {
  // State
  artifacts: Artifact[];
  currentArtifact: Artifact | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeFilters: ArtifactFilter;
  selectedArtifacts: string[]; // IDs of selected artifacts
  viewMode: 'grid' | 'list' | 'detail';
  sortBy: 'created_at' | 'updated_at' | 'title' | 'type' | 'size';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  // Loading and initialization
  loadArtifacts: () => Promise<void>;
  loadArtifact: (id: string) => Promise<void>;
  refreshArtifacts: () => Promise<void>;
  
  // CRUD operations
  createArtifact: (artifact: Omit<Artifact, 'metadata'> & { title: string; type: ArtifactMetadata['type'] }) => Promise<string>;
  updateArtifact: (id: string, updates: Partial<Artifact>) => Promise<boolean>;
  deleteArtifact: (id: string) => Promise<boolean>;
  duplicateArtifact: (id: string, newTitle?: string) => Promise<string>;
  
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
  
  // Bulk operations
  deleteSelectedArtifacts: () => Promise<void>;
  exportSelectedArtifacts: () => Promise<string>;
  bulkUpdateTags: (tag: string, add: boolean) => Promise<void>;
  
  // Statistics and analytics
  getStats: () => Promise<{
    total: number;
    byType: Record<string, number>;
    byLanguage: Record<string, number>;
    totalSize: number;
    averageSize: number;
  }>;
  
  // Utility methods
  getArtifactById: (id: string) => Artifact | null;
  getArtifactsByType: (type: ArtifactMetadata['type']) => Artifact[];
  getFilteredArtifacts: () => Artifact[];
  hasArtifact: (title: string, id?: string) => boolean;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useArtifactStore = create<ArtifactState>((set, get) => ({
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

  // Loading and initialization
  loadArtifacts: async () => {
    try {
      set({ isLoading: true, error: null });
      const artifacts = await artifactStorage.listArtifacts();
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
      const artifact = await artifactStorage.getArtifact(id);
      if (artifact) {
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

  // CRUD operations
  createArtifact: async (artifact) => {
    try {
      set({ isLoading: true, error: null });
      const id = await artifactStorage.saveArtifact(artifact);
      await get().loadArtifacts(); // Refresh the list
      set({ isLoading: false });
      return id;
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
      set({ isLoading: true, error: null });
      const success = await artifactStorage.updateArtifact(id, updates);
      if (success) {
        await get().loadArtifacts(); // Refresh the list
        // Update current artifact if it's the one being updated
        const current = get().currentArtifact;
        if (current && current.metadata.id === id) {
          const updated = await artifactStorage.getArtifact(id);
          if (updated) {
            set({ currentArtifact: updated });
          }
        }
      }
      set({ isLoading: false });
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update artifact', 
        isLoading: false 
      });
      return false;
    }
  },

  deleteArtifact: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const success = await artifactStorage.deleteArtifact(id);
      if (success) {
        await get().loadArtifacts(); // Refresh the list
        // Clear current artifact if it's the one being deleted
        const current = get().currentArtifact;
        if (current && current.metadata.id === id) {
          set({ currentArtifact: null });
        }
        // Remove from selection
        set(state => ({
          selectedArtifacts: state.selectedArtifacts.filter(selectedId => selectedId !== id)
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

  duplicateArtifact: async (id, newTitle) => {
    try {
      set({ isLoading: true, error: null });
      const original = get().artifacts.find(a => a.metadata.id === id);
      if (!original) {
        throw new Error('Original artifact not found');
      }

      const duplicatedArtifact: Omit<Artifact, 'metadata'> & { title: string; type: ArtifactMetadata['type'] } = {
        content: original.content,
        rawData: original.rawData,
        title: newTitle || `${original.metadata.title} (Copy)`,
        type: original.metadata.type
      };

      const newId = await artifactStorage.saveArtifact(duplicatedArtifact);
      await get().loadArtifacts(); // Refresh the list
      set({ isLoading: false });
      return newId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to duplicate artifact', 
        isLoading: false 
      });
      throw error;
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

  // Bulk operations
  deleteSelectedArtifacts: async () => {
    const selectedIds = get().selectedArtifacts;
    if (selectedIds.length === 0) return;

    try {
      set({ isLoading: true, error: null });
      for (const id of selectedIds) {
        await artifactStorage.deleteArtifact(id);
      }
      await get().loadArtifacts(); // Refresh the list
      set({ selectedArtifacts: [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete selected artifacts', 
        isLoading: false 
      });
    }
  },

  exportSelectedArtifacts: async () => {
    const selectedIds = get().selectedArtifacts;
    if (selectedIds.length === 0) return '';

    try {
      const selectedArtifacts = get().artifacts.filter(a => selectedIds.includes(a.metadata.id));
      return JSON.stringify(selectedArtifacts, null, 2);
    } catch (error) {
      throw new Error('Failed to export selected artifacts');
    }
  },

  bulkUpdateTags: async (tag, add) => {
    const selectedIds = get().selectedArtifacts;
    if (selectedIds.length === 0) return;

    try {
      set({ isLoading: true, error: null });
      for (const id of selectedIds) {
        const artifact = get().artifacts.find(a => a.metadata.id === id);
        if (artifact) {
          const currentTags = artifact.metadata.tags || [];
          const newTags = add
            ? [...currentTags, tag].filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
            : currentTags.filter(t => t !== tag);
          
          await artifactStorage.updateArtifact(id, {
            metadata: { 
              ...artifact.metadata,
              tags: newTags 
            }
          });
        }
      }
      await get().loadArtifacts(); // Refresh the list
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update tags', 
        isLoading: false 
      });
    }
  },

  // Statistics and analytics
  getStats: async () => {
    return await artifactStorage.getArtifactStats();
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
}));