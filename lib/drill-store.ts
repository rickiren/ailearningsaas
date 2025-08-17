import { create } from 'zustand';
import { Drill, DrillType } from '@/types/drills';
import { DrillService } from './drill-service';
import { DrillInsert } from './supabase';

interface DrillStore {
  drills: Drill[];
  currentDrill: Drill | null;
  isLoading: boolean;
  lastUpdated: number; // Add this for triggering re-renders
  
  // Actions
  setCurrentDrill: (drill: Drill | null) => void;
  loadDrills: () => Promise<void>;
  addDrill: (drill: Omit<Drill, 'id' | 'metadata'>) => Promise<string>;
  updateDrill: (id: string, updates: Partial<Drill>) => Promise<void>;
  deleteDrill: (id: string) => Promise<void>;
  duplicateDrill: (id: string) => Promise<string>;
  
  // NEW: Direct content updates for AI
  updateDrillContent: (drillId: string, content: string) => Promise<void>;
  handleArtifactCommand: (drillId: string, command: 'create' | 'update' | 'rewrite', content: string) => Promise<void>;
  
  // Queries
  getDrillById: (id: string) => Drill | undefined;
  getDrillsByType: (type: DrillType) => Drill[];
  getDrillsBySkill: (skillName: string) => Drill[];
  searchDrills: (query: string) => Drill[];
}

export const useDrillStore = create<DrillStore>((set, get) => ({
  drills: [
    {
      id: '1',
      title: 'HTML Form Validation',
      description: 'Practice creating and validating HTML forms with JavaScript',
      type: 'html',
      skillName: 'HTML Forms',
      learningObjectives: ['Create HTML forms', 'Implement client-side validation', 'Handle form submission'],
      difficulty: 'beginner',
      estimatedTime: 15,
      code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Form Validation</title>\n</head>\n<body>\n  <form id="myForm">\n    <input type="text" id="name" placeholder="Name" required>\n    <input type="email" id="email" placeholder="Email" required>\n    <button type="submit">Submit</button>\n  </form>\n  <script>\n    // Form validation logic here\n  </script>\n</body>\n</html>',
      metadata: {
        version: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    },
    {
      id: '2',
      title: 'React Counter Component',
      description: 'Build a simple counter component with state management',
      type: 'jsx',
      skillName: 'React State',
      learningObjectives: ['Use React useState hook', 'Handle events', 'Manage component state'],
      difficulty: 'beginner',
      estimatedTime: 20,
      code: 'import React, { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <h2>Count: {count}</h2>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n      <button onClick={() => setCount(count - 1)}>Decrement</button>\n    </div>\n  );\n}\n\nexport default Counter;',
      metadata: {
        version: 1,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    },
    {
      id: '3',
      title: 'CSS Grid Layout',
      description: 'Learn CSS Grid with interactive examples',
      type: 'html',
      skillName: 'CSS Grid',
      learningObjectives: ['Understand CSS Grid concepts', 'Create responsive layouts', 'Use grid areas'],
      difficulty: 'intermediate',
      estimatedTime: 25,
      code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>CSS Grid Layout</title>\n  <style>\n    .grid-container {\n      display: grid;\n      grid-template-columns: repeat(3, 1fr);\n      grid-gap: 20px;\n    }\n    .grid-item {\n      padding: 20px;\n      background: #f0f0f0;\n      border: 1px solid #ccc;\n    }\n  </style>\n</head>\n<body>\n    <div class="grid-container">\n      <div class="grid-item">Item 1</div>\n      <div class="grid-item">Item 2</div>\n      <div class="grid-item">Item 3</div>\n    </div>\n</body>\n</html>',
      metadata: {
        version: 1,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    }
  ],
  currentDrill: null,
  isLoading: false,
  lastUpdated: 0, // Initialize lastUpdated

  setCurrentDrill: (drill) => set({ currentDrill: drill }),

  loadDrills: async () => {
    try {
      set({ isLoading: true });
      const drills = await DrillService.getUserDrills();
      
      // Convert Supabase drills to local Drill type
      const localDrills: Drill[] = drills.map((drill) => ({
        id: drill.id,
        title: drill.title,
        description: drill.description || '',
        type: drill.type,
        skillName: drill.skill_name,
        learningObjectives: drill.learning_objectives,
        difficulty: drill.difficulty,
        estimatedTime: drill.estimated_time,
        code: drill.code,
        metadata: {
          projectId: drill.project_id,
          skillAtomIds: drill.skill_atom_ids,
          tags: drill.tags,
          version: drill.version,
          createdAt: new Date(drill.created_at),
          updatedAt: new Date(drill.updated_at),
        },
      }));

      set({ drills: localDrills, isLoading: false });
    } catch (error) {
      console.error('Failed to load drills:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  addDrill: async (drillData) => {
    try {
      // Convert the drill data to match Supabase schema
      const supabaseDrillData: DrillInsert = {
        title: drillData.title,
        description: drillData.description,
        type: drillData.type,
        skill_name: drillData.skillName,
        learning_objectives: drillData.learningObjectives,
        difficulty: drillData.difficulty,
        estimated_time: drillData.estimatedTime,
        code: drillData.code,
        project_id: undefined,
        skill_atom_ids: [],
        tags: [],
        version: 1,
        is_active: true,
        user_id: undefined, // Will be set by RLS policies
        metadata: {
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      const newDrill = await DrillService.createDrill(supabaseDrillData);
      
      // Convert back to local Drill type for state
      const localDrill: Drill = {
        id: newDrill.id,
        title: newDrill.title,
        description: newDrill.description || '',
        type: newDrill.type,
        skillName: newDrill.skill_name,
        learningObjectives: newDrill.learning_objectives,
        difficulty: newDrill.difficulty,
        estimatedTime: newDrill.estimated_time,
        code: newDrill.code,
        metadata: {
          projectId: newDrill.project_id,
          skillAtomIds: newDrill.skill_atom_ids,
          tags: newDrill.tags,
          version: newDrill.version,
          createdAt: new Date(newDrill.created_at),
          updatedAt: new Date(newDrill.updated_at),
        },
      };

      set((state) => ({
        drills: [...state.drills, localDrill],
        currentDrill: localDrill,
        lastUpdated: Date.now(), // Trigger re-renders
      }));

      return localDrill.id;
    } catch (error) {
      console.error('Failed to create drill:', error);
      throw error;
    }
  },

  updateDrill: async (id, updates) => {
    try {
      // Convert updates to match Supabase schema
      const supabaseUpdates: any = {};
      
      if (updates.title !== undefined) supabaseUpdates.title = updates.title;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.type !== undefined) supabaseUpdates.type = updates.type;
      if (updates.skillName !== undefined) supabaseUpdates.skill_name = updates.skillName;
      if (updates.learningObjectives !== undefined) supabaseUpdates.learning_objectives = updates.learningObjectives;
      if (updates.difficulty !== undefined) supabaseUpdates.difficulty = updates.difficulty;
      if (updates.estimatedTime !== undefined) supabaseUpdates.estimated_time = updates.estimatedTime;
      if (updates.code !== undefined) supabaseUpdates.code = updates.code;
      if (updates.metadata?.projectId !== undefined) supabaseUpdates.project_id = updates.metadata.projectId;
      if (updates.metadata?.skillAtomIds !== undefined) supabaseUpdates.skill_atom_ids = updates.metadata.skillAtomIds;
      if (updates.metadata?.tags !== undefined) supabaseUpdates.tags = updates.metadata.tags;

      await DrillService.updateDrill(id, supabaseUpdates);

      // Update local state
      set((state) => ({
        drills: state.drills.map((drill) =>
          drill.id === id
            ? {
                ...drill,
                ...updates,
                metadata: {
                  ...drill.metadata,
                  updatedAt: new Date(),
                  version: (drill.metadata.version || 1) + 1,
                },
              }
            : drill
        ),
        currentDrill: state.currentDrill?.id === id ? { ...state.currentDrill, ...updates } : state.currentDrill,
        lastUpdated: Date.now(), // Trigger re-renders
      }));
    } catch (error) {
      console.error('Failed to update drill:', error);
      throw error;
    }
  },

  deleteDrill: async (id) => {
    try {
      await DrillService.deleteDrill(id);
      
      set((state) => ({
        drills: state.drills.filter((drill) => drill.id !== id),
        currentDrill: state.currentDrill?.id === id ? null : state.currentDrill,
      }));
    } catch (error) {
      console.error('Failed to delete drill:', error);
      throw error;
    }
  },

  duplicateDrill: async (id) => {
    try {
      const originalDrill = get().getDrillById(id);
      if (!originalDrill) throw new Error('Drill not found');

      const duplicatedDrill = await DrillService.duplicateDrill(id);
      
      // Convert back to local Drill type for state
      const localDrill: Drill = {
        id: duplicatedDrill.id,
        title: duplicatedDrill.title,
        description: duplicatedDrill.description || '',
        type: duplicatedDrill.type,
        skillName: duplicatedDrill.skill_name,
        learningObjectives: duplicatedDrill.learning_objectives,
        difficulty: duplicatedDrill.difficulty,
        estimatedTime: duplicatedDrill.estimated_time,
        code: duplicatedDrill.code,
        metadata: {
          projectId: duplicatedDrill.project_id,
          skillAtomIds: duplicatedDrill.skill_atom_ids,
          tags: duplicatedDrill.tags,
          version: duplicatedDrill.version,
          createdAt: new Date(duplicatedDrill.created_at),
          updatedAt: new Date(duplicatedDrill.updated_at),
        },
      };

      set((state) => ({
        drills: [...state.drills, localDrill],
        currentDrill: localDrill,
      }));

      return localDrill.id;
    } catch (error) {
      console.error('Failed to duplicate drill:', error);
      throw error;
    }
  },

  updateDrillContent: async (drillId: string, content: string) => {
    try {
      // Update in database first using existing updateDrill method
      await get().updateDrill(drillId, { 
        code: content,
      });
      
      // The updateDrill method already handles local state updates and lastUpdated
    } catch (error) {
      console.error('Failed to update drill content:', error);
      throw error;
    }
  },

  handleArtifactCommand: async (drillId: string, command: 'create' | 'update' | 'rewrite', content: string) => {
    try {
      // Use the existing updateDrill method for consistency
      await get().updateDrill(drillId, { 
        code: content,
      });
      
      // Log the AI action
      console.log(`AI ${command}ed drill content for drill:`, drillId);
      
      // The updateDrill method already triggers re-renders via lastUpdated
    } catch (error) {
      console.error(`Failed to handle AI artifact command (${command}):`, error);
      throw error;
    }
  },

  getDrillById: (id) => {
    return get().drills.find((drill) => drill.id === id);
  },

  getDrillsByType: (type) => {
    return get().drills.filter((drill) => drill.type === type);
  },

  getDrillsBySkill: (skillName) => {
    return get().drills.filter((drill) => 
      drill.skillName.toLowerCase().includes(skillName.toLowerCase())
    );
  },

  searchDrills: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().drills.filter((drill) =>
      drill.title.toLowerCase().includes(lowerQuery) ||
      drill.description.toLowerCase().includes(lowerQuery) ||
      drill.skillName.toLowerCase().includes(lowerQuery)
    );
  },
}));
