export type DrillType = 'html' | 'jsx' | 'interactive' | 'simulation' | 'quiz';

export interface Drill {
  id: string;
  title: string;
  description: string;
  type: DrillType;
  skillName: string;
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  code: string;
  metadata: {
    projectId?: string;
    skillAtomIds?: string[];
    tags?: string[];
    version?: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface DrillPreview {
  id: string;
  title: string;
  type: DrillType;
  skillName: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  thumbnail?: string;
}

export interface DrillChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  drillId?: string;
}

export interface DrillCreationRequest {
  skillName: string;
  type: DrillType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  description: string;
}
