import { create } from 'zustand';
import { Artifact, ArtifactState } from '@/types/artifacts';

export const useArtifactStore = create<ArtifactState>((set, get) => ({
  currentArtifact: null,
  artifacts: [],
  streamingData: null,

  addArtifact: (artifactData) => {
    const artifact: Artifact = {
      ...artifactData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      artifacts: [...state.artifacts, artifact],
      currentArtifact: artifact,
    }));

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