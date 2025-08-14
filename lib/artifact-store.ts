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