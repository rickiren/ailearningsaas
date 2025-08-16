import { create } from 'zustand';
import { Artifact, ArtifactState } from '@/types/artifacts';
import { MindmapStore } from './mindmap-store';

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  currentArtifact: null,
  artifacts: [],
  streamingData: null,

  addArtifact: async (artifactData) => {
    console.log('🔄 ArtifactStore.addArtifact called with:', {
      type: artifactData.type,
      title: artifactData.title,
      hasData: !!artifactData.data,
      dataKeys: artifactData.data ? Object.keys(artifactData.data) : [],
      isStreaming: artifactData.isStreaming
    });

    // Check for duplicate artifacts to prevent database duplication
    const { artifacts } = get();
    const isDuplicate = artifacts.some(existingArtifact => {
      // Check if this is a duplicate mindmap with the same title and similar data
      if (existingArtifact.type === 'mindmap' && 
          artifactData.type === 'mindmap' &&
          existingArtifact.title === artifactData.title) {
        
        // If the existing artifact is still streaming, consider it a duplicate
        if (existingArtifact.isStreaming && artifactData.isStreaming) {
          console.log('⚠️ Duplicate streaming artifact detected, updating existing one');
          return true;
        }
        
        // If both are complete, check if they have the same data structure
        if (!existingArtifact.isStreaming && !artifactData.isStreaming) {
          const existingKeys = Object.keys(existingArtifact.data || {});
          const newKeys = Object.keys(artifactData.data || {});
          if (existingKeys.length === newKeys.length) {
            console.log('⚠️ Duplicate complete artifact detected, skipping creation');
            return true;
          }
        }
      }
      return false;
    });

    if (isDuplicate) {
      console.log('🔄 Duplicate artifact detected, updating existing one instead');
      
      // Find the existing artifact and update it
      const existingArtifact = artifacts.find(a => 
        a.type === artifactData.type && 
        a.title === artifactData.title
      );
      
      if (existingArtifact) {
        // Update the existing artifact instead of creating a new one
        get().updateArtifact(existingArtifact.id, {
          data: artifactData.data,
          isStreaming: artifactData.isStreaming,
          updatedAt: new Date()
        });
        
        // Set as current artifact
        set({ currentArtifact: existingArtifact });
        
        return existingArtifact.id;
      }
    }

    const artifact: Artifact = {
      ...artifactData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('🆕 Created artifact object:', {
      id: artifact.id,
      type: artifact.type,
      title: artifact.title
    });

    set((state) => {
      const newState = {
        artifacts: [...state.artifacts, artifact],
        currentArtifact: artifact,
      };
      
      console.log('🔄 Artifact store state updated:', {
        totalArtifacts: newState.artifacts.length,
        currentArtifactId: newState.currentArtifact?.id,
        currentArtifactType: newState.currentArtifact?.type,
        currentArtifactTitle: newState.currentArtifact?.title
      });
      
      return newState;
    });

    // If this is a mindmap, save it to the database
    if (artifactData.type === 'mindmap' && artifactData.data) {
      console.log('🔄 Attempting to save mindmap to database:', {
        type: artifactData.type,
        title: artifactData.title,
        hasData: !!artifactData.data,
        dataKeys: Object.keys(artifactData.data || {}),
        dataStructure: {
          hasId: !!artifactData.data.id,
          hasTitle: !!artifactData.data.title,
          hasChildren: !!artifactData.data.children,
          childrenCount: artifactData.data.children?.length || 0
        }
      });
      
      try {
        const result = await MindmapStore.saveMindmap(
          artifactData.data,
          artifactData.title,
          artifactData.data.description
        );
        
        console.log('✅ Mindmap saved to database successfully:', result);
        
        // Store the database ID in the artifact metadata
        get().updateArtifact(artifact.id, {
          metadata: {
            ...artifact.metadata,
            projectId: result.projectId,
            skillAtomIds: result.skillAtomIds
          }
        });

        console.log('✅ Artifact metadata updated with database IDs');
      } catch (error) {
        console.error('❌ Failed to save mindmap to database:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          artifactData: artifactData
        });
        
        // Still create the artifact in the UI even if database save fails
        console.log('⚠️ Continuing with UI artifact creation despite database error');
      }
    } else {
      console.log('⚠️ Not saving to database:', {
        type: artifactData.type,
        hasData: !!artifactData.data,
        reason: artifactData.type !== 'mindmap' ? 'Not a mindmap' : 'No data'
      });
    }

    return artifact.id;
  },

  updateArtifact: (id, updates) => {
    set((state) => ({
      artifacts: state.artifacts.map((artifact) =>
        artifact.id === id
          ? { ...artifact, ...updates, updatedAt: new Date() }
          : artifact
      ),
      currentArtifact:
        state.currentArtifact?.id === id
          ? { ...state.currentArtifact, ...updates, updatedAt: new Date() }
          : state.currentArtifact,
    }));

    // If updating a mindmap and it has a project ID, update the database
    const artifact = get().artifacts.find(a => a.id === id);
    if (artifact?.type === 'mindmap' && artifact.metadata?.projectId && updates.data) {
      MindmapStore.updateMindmap(artifact.metadata.projectId, updates.data)
        .then(() => console.log('✅ Mindmap updated in database'))
        .catch(error => console.error('❌ Failed to update mindmap in database:', error));
    }
  },

  setCurrentArtifact: (id) => {
    const { artifacts } = get();
    const artifact = id ? artifacts.find((a) => a.id === id) || null : null;
    set({ currentArtifact: artifact });
  },

  updateStreamingData: (data) => {
    set({ streamingData: data });
    
    // If there's a current artifact being streamed, update it
    const { currentArtifact } = get();
    if (currentArtifact?.isStreaming) {
      get().updateArtifact(currentArtifact.id, { 
        data: { ...currentArtifact.data, ...data },
        isStreaming: true
      });
    }
  },

  clearStreamingData: () => {
    set({ streamingData: null });
    
    // Mark current artifact as no longer streaming
    const { currentArtifact } = get();
    if (currentArtifact?.isStreaming) {
      get().updateArtifact(currentArtifact.id, { isStreaming: false });
    }
  },

  // New method to load mindmaps from database
  loadMindmapFromDatabase: async (projectId: string) => {
    try {
      const mindmapData = await MindmapStore.loadMindmap(projectId);
      if (mindmapData) {
        const artifact: Artifact = {
          id: crypto.randomUUID(),
          type: 'mindmap',
          title: 'Loaded Mindmap', // You might want to get this from the project
          data: mindmapData,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { projectId }
        };

        set((state) => ({
          artifacts: [...state.artifacts, artifact],
          currentArtifact: artifact,
        }));

        return artifact.id;
      }
    } catch (error) {
      console.error('Failed to load mindmap from database:', error);
    }
    return null;
  },

  // New method to get all saved mindmaps
  getSavedMindmaps: async () => {
    try {
      const projects = await MindmapStore.getUserMindmaps();
      return projects;
    } catch (error) {
      console.error('Failed to get saved mindmaps:', error);
      return [];
    }
  },

  // Clean up duplicate artifacts and database entries
  cleanupDuplicates: async () => {
    try {
      console.log('🧹 Starting duplicate cleanup...');
      
      // Get all artifacts and group by title
      const { artifacts } = get();
      const titleGroups = new Map<string, Artifact[]>();
      
      artifacts.forEach(artifact => {
        if (artifact.type === 'mindmap') {
          const key = artifact.title;
          if (!titleGroups.has(key)) {
            titleGroups.set(key, []);
          }
          titleGroups.get(key)!.push(artifact);
        }
      });
      
      // Find duplicates and keep only the most recent complete one
      let cleanedCount = 0;
      for (const [title, group] of titleGroups) {
        if (group.length > 1) {
          console.log(`🧹 Found ${group.length} artifacts with title: ${title}`);
          
          // Sort by creation date, newest first
          group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Keep the first (newest) complete artifact, remove the rest
          const toRemove = group.slice(1);
          console.log(`🧹 Removing ${toRemove.length} duplicate artifacts`);
          
          for (const duplicate of toRemove) {
            // Remove from local state
            set((state) => ({
              artifacts: state.artifacts.filter(a => a.id !== duplicate.id),
              currentArtifact: state.currentArtifact?.id === duplicate.id ? null : state.currentArtifact
            }));
            
            // If it has a database ID, remove from database too
            if (duplicate.metadata?.projectId) {
              try {
                await MindmapStore.deleteMindmap(duplicate.metadata.projectId);
                console.log(`🗑️ Removed duplicate from database: ${duplicate.metadata.projectId}`);
              } catch (error) {
                console.error(`❌ Failed to remove duplicate from database: ${duplicate.metadata.projectId}`, error);
              }
            }
            
            cleanedCount++;
          }
        }
      }
      
      console.log(`✅ Cleanup complete. Removed ${cleanedCount} duplicate artifacts.`);
      return cleanedCount;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return 0;
    }
  },
}));

// Set up event listeners immediately
const setupEventListeners = () => {
  console.log('🔧 Setting up artifact store event listeners...');
  
  // Listen for mindmap detection
  window.addEventListener('mindmap-detected', ((event: Event) => {
    console.log('🎯 Received mindmap-detected event:', event);
    const customEvent = event as CustomEvent;
    const { type, title, data } = customEvent.detail;
    console.log('📝 Creating new mindmap artifact:', { type, title });
    useArtifactStore.getState().addArtifact({
      type,
      title,
      data,
    });
  }) as EventListener);

  // Listen for mindmap streaming updates
  window.addEventListener('mindmap-streaming', ((event: Event) => {
    console.log('🔄 Received mindmap-streaming event:', event);
    const customEvent = event as CustomEvent;
    const { type, title, data, isStreaming } = customEvent.detail;
    console.log('📝 Updating mindmap artifact:', { type, title, isStreaming });
    const artifactStore = useArtifactStore.getState();
    const currentArtifact = artifactStore.currentArtifact;
    
    if (currentArtifact?.type === 'mindmap') {
      // Update existing mindmap
      console.log('🔄 Updating existing mindmap:', currentArtifact.id);
      artifactStore.updateArtifact(currentArtifact.id, {
        data,
        isStreaming,
      });
    } else {
      // Create new mindmap
      console.log('🆕 Creating new mindmap artifact');
      artifactStore.addArtifact({
        type,
        title,
        data,
        isStreaming,
      });
    }
  }) as EventListener);

  // Listen for mindmap streaming finished
  window.addEventListener('mindmap-streaming-finished', (() => {
    console.log('🏁 Received mindmap-streaming-finished event');
    useArtifactStore.getState().clearStreamingData();
  }) as EventListener);
  
  console.log('✅ Event listeners set up successfully');
};

// Set up listeners when the module is loaded
if (typeof window !== 'undefined') {
  // Use a small delay to ensure the DOM is ready
  setTimeout(setupEventListeners, 100);
}