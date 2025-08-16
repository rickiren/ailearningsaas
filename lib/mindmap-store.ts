import { supabase, ProjectInsert, SkillAtomInsert, Project, SkillAtom } from './supabase';
import { MindMapNode } from '@/types/artifacts';

export class MindmapStore {
  /**
   * Save a complete mindmap to the database
   * Creates a project and all skill atoms with proper relationships
   */
  static async saveMindmap(
    mindmapData: MindMapNode,
    title: string,
    description?: string
  ): Promise<{ projectId: string; skillAtomIds: string[] }> {
    try {
      console.log('🔄 MindmapStore.saveMindmap called with:', {
        title,
        description,
        mindmapDataKeys: Object.keys(mindmapData),
        hasChildren: !!mindmapData.children,
        childrenCount: mindmapData.children?.length || 0,
        mindmapData: mindmapData
      });
      
      // Validate the mindmap data structure
      if (!mindmapData.id || !mindmapData.title) {
        throw new Error('Invalid mindmap data: missing id or title');
      }
      
      if (!mindmapData.children || !Array.isArray(mindmapData.children)) {
        console.log('⚠️ Mindmap has no children, creating single node structure');
        // Create a single node structure if no children
        mindmapData.children = [];
      }
      
      // Check if a project with this title already exists
      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id, title, created_at')
        .eq('title', title)
        .eq('metadata->>type', 'mindmap')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking for existing project:', checkError);
        throw checkError;
      }

      if (existingProject) {
        console.log('⚠️ Project with this title already exists:', existingProject.id);
        
        // Check if the existing project is recent (within last 5 minutes)
        const existingTime = new Date(existingProject.created_at).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - existingTime < fiveMinutes) {
          console.log('⚠️ Recent duplicate detected, updating existing project instead');
          
          // Delete existing skill atoms and recreate
          const { error: deleteError } = await supabase
            .from('skill_atoms')
            .delete()
            .eq('project_id', existingProject.id);

          if (deleteError) {
            console.error('❌ Error deleting existing skill atoms:', deleteError);
            throw deleteError;
          }

          // Save new skill atoms to existing project
          const skillAtomIds: string[] = [];
          await this.saveSkillAtomRecursive(mindmapData, existingProject.id, null, 0, 0, skillAtomIds);

          // Update project metadata
          await supabase
            .from('projects')
            .update({
              description,
              metadata: {
                type: 'mindmap',
                totalNodes: this.countNodes(mindmapData),
                estimatedTotalHours: this.calculateTotalHours(mindmapData),
                lastUpdated: new Date().toISOString()
              }
            })
            .eq('id', existingProject.id);

          console.log('✅ Updated existing project:', existingProject.id);
          return {
            projectId: existingProject.id,
            skillAtomIds
          };
        }
      }
      
      // 1. Create the project
      const projectData: ProjectInsert = {
        title,
        description,
        metadata: {
          type: 'mindmap',
          totalNodes: this.countNodes(mindmapData),
          estimatedTotalHours: this.calculateTotalHours(mindmapData),
        }
      };

      console.log('🔄 Creating project in database:', projectData);
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) {
        console.error('❌ Project creation error:', projectError);
        throw projectError;
      }
      if (!project) {
        console.error('❌ No project returned from database');
        throw new Error('Failed to create project');
      }
      
      console.log('✅ Project created successfully:', project.id);

      // 2. Save all skill atoms recursively
      const skillAtomIds: string[] = [];
      await this.saveSkillAtomRecursive(mindmapData, project.id, null, 0, 0, skillAtomIds);

      console.log('✅ All skill atoms saved successfully:', {
        projectId: project.id,
        skillAtomCount: skillAtomIds.length,
        skillAtomIds: skillAtomIds
      });

      return {
        projectId: project.id,
        skillAtomIds
      };
    } catch (error) {
      console.error('❌ Error saving mindmap:', error);
      throw error;
    }
  }

  /**
   * Recursively save skill atoms with proper parent-child relationships
   */
  private static async saveSkillAtomRecursive(
    node: MindMapNode,
    projectId: string,
    parentId: string | null,
    level: number,
    orderIndex: number,
    skillAtomIds: string[]
  ): Promise<void> {
    try {
      console.log('🔄 Saving skill atom:', {
        nodeId: node.id,
        title: node.title,
        level,
        orderIndex,
        parentId,
        hasChildren: !!node.children,
        childrenCount: node.children?.length || 0
      });
      
      // Extract position data if available
      const positionX = node.position?.x || 0;
      const positionY = node.position?.y || 0;

      // Prepare skill atom data
      const skillAtomData: SkillAtomInsert = {
        project_id: projectId,
        parent_id: parentId || undefined,
        title: node.title,
        description: node.description,
        level,
        order_index: orderIndex,
        difficulty: node.difficulty,
        estimated_hours: node.estimatedHours,
        prerequisites: node.prerequisites || [],
        skills: node.skills || [],
        position_x: positionX,
        position_y: positionY,
        node_data: {
          // Store any additional node properties that might not fit in the main columns
          id: node.id,
          // Add any other custom properties here
        }
      };

      console.log('🔄 Inserting skill atom:', skillAtomData);

      // Insert the skill atom
      const { data: skillAtom, error: skillAtomError } = await supabase
        .from('skill_atoms')
        .insert(skillAtomData)
        .select()
        .single();

      if (skillAtomError) {
        console.error('❌ Skill atom insertion error:', skillAtomError);
        throw skillAtomError;
      }
      if (!skillAtom) {
        console.error('❌ No skill atom returned from database');
        throw new Error('Failed to create skill atom');
      }

      console.log('✅ Skill atom created successfully:', skillAtom.id);
      skillAtomIds.push(skillAtom.id);

      // Recursively save children
      if (node.children && node.children.length > 0) {
        console.log('🔄 Processing children for node:', node.id);
        for (let i = 0; i < node.children.length; i++) {
          await this.saveSkillAtomRecursive(
            node.children[i],
            projectId,
            skillAtom.id,
            level + 1,
            i,
            skillAtomIds
          );
        }
      } else {
        console.log('✅ No children for node:', node.id);
      }
    } catch (error) {
      console.error('❌ Error saving skill atom:', error);
      throw error;
    }
  }

  /**
   * Load a complete mindmap from the database
   */
  static async loadMindmap(projectId: string): Promise<MindMapNode | null> {
    try {
      // 1. Get the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      if (!project) return null;

      // 2. Get all skill atoms for this project
      const { data: skillAtoms, error: skillAtomsError } = await supabase
        .from('skill_atoms')
        .select('*')
        .eq('project_id', projectId)
        .order('level', { ascending: true })
        .order('order_index', { ascending: true });

      if (skillAtomsError) throw skillAtomsError;
      if (!skillAtoms) return null;

      // 3. Reconstruct the mindmap tree
      return this.reconstructMindmapTree(skillAtoms);
    } catch (error) {
      console.error('Error loading mindmap:', error);
      throw error;
    }
  }

  /**
   * Reconstruct the mindmap tree from flat skill atoms
   */
  private static reconstructMindmapTree(skillAtoms: SkillAtom[]): MindMapNode | null {
    if (skillAtoms.length === 0) return null;

    // Create a map of all nodes
    const nodeMap = new Map<string, MindMapNode>();
    
    // First pass: create all nodes
    skillAtoms.forEach(atom => {
      nodeMap.set(atom.id, {
        id: atom.id,
        title: atom.title,
        description: atom.description,
        level: atom.level,
        difficulty: atom.difficulty,
        estimatedHours: atom.estimated_hours,
        prerequisites: atom.prerequisites || [],
        skills: atom.skills || [],
        position: {
          x: atom.position_x || 0,
          y: atom.position_y || 0
        },
        children: []
      });
    });

    // Second pass: establish parent-child relationships
    let rootNode: MindMapNode | null = null;
    
    skillAtoms.forEach(atom => {
      const node = nodeMap.get(atom.id);
      if (!node) return;

      if (atom.parent_id) {
        // This is a child node
        const parent = nodeMap.get(atom.parent_id);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        }
      } else {
        // This is a root node
        rootNode = node;
      }
    });

    return rootNode;
  }

  /**
   * Update an existing mindmap
   */
  static async updateMindmap(
    projectId: string,
    mindmapData: MindMapNode
  ): Promise<void> {
    try {
      // For now, we'll delete and recreate the entire mindmap
      // In a production app, you might want to implement more sophisticated diffing
      
      // Delete existing skill atoms
      const { error: deleteError } = await supabase
        .from('skill_atoms')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Get project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('title, description')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Recreate the mindmap
      const skillAtomIds: string[] = [];
      await this.saveSkillAtomRecursive(mindmapData, projectId, null, 0, 0, skillAtomIds);

      // Update project metadata
      await supabase
        .from('projects')
        .update({
          metadata: {
            type: 'mindmap',
            totalNodes: this.countNodes(mindmapData),
            estimatedTotalHours: this.calculateTotalHours(mindmapData),
            lastUpdated: new Date().toISOString()
          }
        })
        .eq('id', projectId);

    } catch (error) {
      console.error('Error updating mindmap:', error);
      throw error;
    }
  }

  /**
   * Get all mindmaps for a user
   */
  static async getUserMindmaps(): Promise<Project[]> {
    try {
      const query = supabase
        .from('projects')
        .select('*')
        .eq('metadata->>type', 'mindmap')
        .order('updated_at', { ascending: false });

      const { data: projects, error } = await query;
      if (error) throw error;

      return projects || [];
    } catch (error) {
      console.error('Error getting user mindmaps:', error);
      throw error;
    }
  }

  /**
   * Delete a mindmap and all its skill atoms
   */
  static async deleteMindmap(projectId: string): Promise<void> {
    try {
      // Delete skill atoms first (cascade should handle this, but being explicit)
      const { error: skillAtomsError } = await supabase
        .from('skill_atoms')
        .delete()
        .eq('project_id', projectId);

      if (skillAtomsError) throw skillAtomsError;

      // Delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (projectError) throw projectError;
    } catch (error) {
      console.error('Error deleting mindmap:', error);
      throw error;
    }
  }

  /**
   * Helper: Count total nodes in a mindmap
   */
  private static countNodes(node: MindMapNode): number {
    let count = 1; // Count current node
    if (node.children) {
      node.children.forEach(child => {
        count += this.countNodes(child);
      });
    }
    return count;
  }

  /**
   * Helper: Calculate total estimated hours
   */
  private static calculateTotalHours(node: MindMapNode): number {
    let total = node.estimatedHours || 0;
    if (node.children) {
      node.children.forEach(child => {
        total += this.calculateTotalHours(child);
      });
    }
    return total;
  }
}
