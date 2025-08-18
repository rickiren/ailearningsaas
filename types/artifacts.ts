export interface MindMapNode {
  id: string;
  title: string;
  description?: string;
  level: number;
  prerequisites?: string[];
  skills?: string[];
  estimatedHours?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  position?: { x: number; y: number };
  children?: MindMapNode[];
}

export interface SkillAtom {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  prerequisites: string[];
  objectives: string[];
  estimatedHours: number;
  resources: Resource[];
  exercises: Exercise[];
  assessments: Assessment[];
}

export interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'book' | 'course' | 'documentation' | 'tool';
  url?: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'coding' | 'quiz' | 'project' | 'reflection' | 'discussion';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  instructions: string[];
  hints?: string[];
  solution?: string;
}

export interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'project' | 'peer-review' | 'self-assessment';
  questions: Question[];
  passingScore: number;
  estimatedTime: number;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
}

export interface DrillPreview {
  id: string;
  title: string;
  description: string;
  type: 'flashcards' | 'practice-problems' | 'interactive-demo' | 'simulation';
  content: any; // Flexible content based on drill type
  estimatedTime: number;
}

export type ArtifactType = 'mindmap' | 'skill-atom' | 'drill' | 'progress' | 'welcome';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  data: MindMapNode | SkillAtom | DrillPreview | any;
  createdAt: Date;
  updatedAt: Date;
  isStreaming?: boolean;
  metadata?: {
    projectId?: string;
    skillAtomIds?: string[];
    [key: string]: any;
  };
}

export interface ArtifactState {
  currentArtifact: Artifact | null;
  artifacts: Artifact[];
  streamingData: any;
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateArtifact: (id: string, data: Partial<Artifact>) => void;
  setCurrentArtifact: (id: string | null) => void;
  updateStreamingData: (data: any) => void;
  clearStreamingData: () => void;
  loadMindmapFromDatabase: (projectId: string) => Promise<string | null>;
  getSavedMindmaps: () => Promise<any[]>;
  hasArtifact: (title: string, projectId?: string) => Artifact | undefined;
  cleanupDuplicates: () => Promise<number>;
  addModuleToMindmap: (parentId: string | null, newModule: any) => Promise<boolean>;
}