import { MindMapNode } from '@/types/artifacts';
import { useArtifactStore } from './artifact-store';

// AI Editing Tool Functions
// These functions can be called by both manual controls and AI prompts

export interface AIEditingTools {
  // Module editing
  editModuleTitle: (moduleId: string, newTitle: string) => Promise<boolean>;
  editModuleDescription: (moduleId: string, newDescription: string) => Promise<boolean>;
  editModuleDifficulty: (moduleId: string, newDifficulty: 'beginner' | 'intermediate' | 'advanced') => Promise<boolean>;
  editModuleHours: (moduleId: string, newHours: number) => Promise<boolean>;
  
  // Module management
  addModule: (parentId: string | null, moduleData: Partial<MindMapNode>) => Promise<boolean>;
  deleteModule: (moduleId: string) => Promise<boolean>;
  reorderModules: (newOrder: string[]) => Promise<boolean>;
  
  // Skills and prerequisites
  addSkillToModule: (moduleId: string, skill: string) => Promise<boolean>;
  removeSkillFromModule: (moduleId: string, skill: string) => Promise<boolean>;
  addPrerequisiteToModule: (moduleId: string, prerequisite: string) => Promise<boolean>;
  removePrerequisiteFromModule: (moduleId: string, prerequisite: string) => Promise<boolean>;
  
  // Course-level editing
  editCourseInfo: (updates: Partial<MindMapNode>) => Promise<boolean>;
  editCourseTitle: (newTitle: string) => Promise<boolean>;
  editCourseDescription: (newDescription: string) => Promise<boolean>;
  
  // Advanced operations
  duplicateModule: (moduleId: string, newParentId?: string) => Promise<boolean>;
  moveModule: (moduleId: string, newParentId: string) => Promise<boolean>;
  mergeModules: (sourceId: string, targetId: string) => Promise<boolean>;
}

// Implementation of the editing tools
export class AIEditingToolsImpl implements AIEditingTools {
  private artifactStore = useArtifactStore.getState();

  // Helper function to find a module by ID
  private findModuleById(root: MindMapNode, moduleId: string): MindMapNode | null {
    if (root.id === moduleId) return root;
    
    if (root.children) {
      for (const child of root.children) {
        const found = this.findModuleById(child, moduleId);
        if (found) return found;
      }
    }
    
    return null;
  }

  // Helper function to update a module by ID
  private updateModuleById(root: MindMapNode, moduleId: string, updates: Partial<MindMapNode>): MindMapNode {
    if (root.id === moduleId) {
      return { ...root, ...updates };
    }
    
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => this.updateModuleById(child, moduleId, updates))
      };
    }
    
    return root;
  }

  // Helper function to remove a module by ID
  private removeModuleById(root: MindMapNode, moduleId: string): MindMapNode | null {
    if (root.id === moduleId) {
      return null; // Remove this module
    }
    
    if (root.children) {
      const filteredChildren = root.children
        .map(child => this.removeModuleById(child, moduleId))
        .filter((child): child is MindMapNode => child !== null);
      
      return {
        ...root,
        children: filteredChildren
      };
    }
    
    return root;
  }

  // Helper function to add a module to a specific parent
  private addModuleToParent(root: MindMapNode, parentId: string | null, newModule: MindMapNode): MindMapNode {
    if (parentId === null) {
      // Add to root level
      return {
        ...root,
        children: [...(root.children || []), newModule]
      };
    }
    
    if (root.id === parentId) {
      return {
        ...root,
        children: [...(root.children || []), newModule]
      };
    }
    
    if (root.children) {
      return {
        ...root,
        children: root.children.map(child => this.addModuleToParent(child, parentId, newModule))
      };
    }
    
    return root;
  }

  // Helper function to get all module IDs in order
  private getModuleOrder(root: MindMapNode): string[] {
    const order: string[] = [];
    
    const traverse = (node: MindMapNode) => {
      order.push(node.id);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(root);
    return order;
  }

  // Helper function to reorder modules based on new order
  private reorderModulesByOrder(root: MindMapNode, newOrder: string[]): MindMapNode {
    const orderMap = new Map<string, number>();
    newOrder.forEach((id, index) => orderMap.set(id, index));
    
    const sortChildren = (children: MindMapNode[]): MindMapNode[] => {
      return [...children].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    };
    
    const reorderNode = (node: MindMapNode): MindMapNode => {
      if (node.children) {
        return {
          ...node,
          children: sortChildren(node.children).map(reorderNode)
        };
      }
      return node;
    };
    
    return reorderNode(root);
  }

  // Module editing functions
  async editModuleTitle(moduleId: string, newTitle: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, { title: newTitle });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module title updated: ${moduleId} -> "${newTitle}"`);
      return true;
    } catch (error) {
      console.error('❌ Error updating module title:', error);
      return false;
    }
  }

  async editModuleDescription(moduleId: string, newDescription: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, { description: newDescription });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module description updated: ${moduleId}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating module description:', error);
      return false;
    }
  }

  async editModuleDifficulty(moduleId: string, newDifficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, { difficulty: newDifficulty });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module difficulty updated: ${moduleId} -> ${newDifficulty}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating module difficulty:', error);
      return false;
    }
  }

  async editModuleHours(moduleId: string, newHours: number): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, { estimatedHours: newHours });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module hours updated: ${moduleId} -> ${newHours}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating module hours:', error);
      return false;
    }
  }

  // Module management functions
  async addModule(parentId: string | null, moduleData: Partial<MindMapNode>): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const newModule: MindMapNode = {
        id: crypto.randomUUID(),
        title: moduleData.title || 'New Module',
        description: moduleData.description || '',
        level: moduleData.level || 1,
        difficulty: moduleData.difficulty || 'beginner',
        estimatedHours: moduleData.estimatedHours || 1,
        skills: moduleData.skills || [],
        prerequisites: moduleData.prerequisites || [],
        children: moduleData.children || [],
        ...moduleData
      };

      const updatedData = this.addModuleToParent(currentArtifact.data, parentId, newModule);
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module added: ${newModule.title}`);
      return true;
    } catch (error) {
      console.error('❌ Error adding module:', error);
      return false;
    }
  }

  async deleteModule(moduleId: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = this.removeModuleById(currentArtifact.data, moduleId);
      if (!updatedData) {
        throw new Error('Cannot delete root module');
      }
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module deleted: ${moduleId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting module:', error);
      return false;
    }
  }

  async reorderModules(newOrder: string[]): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = this.reorderModulesByOrder(currentArtifact.data, newOrder);
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Modules reordered`);
      return true;
    } catch (error) {
      console.error('❌ Error reordering modules:', error);
      return false;
    }
  }

  // Skills and prerequisites functions
  async addSkillToModule(moduleId: string, skill: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const module = this.findModuleById(currentArtifact.data, moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const currentSkills = module.skills || [];
      if (currentSkills.includes(skill)) {
        console.log(`⚠️ Skill already exists: ${skill}`);
        return true; // Not an error, just already exists
      }

      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, {
        skills: [...currentSkills, skill]
      });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Skill added to module: ${moduleId} -> ${skill}`);
      return true;
    } catch (error) {
      console.error('❌ Error adding skill to module:', error);
      return false;
    }
  }

  async removeSkillFromModule(moduleId: string, skill: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const module = this.findModuleById(currentArtifact.data, moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const currentSkills = module.skills || [];
      const updatedSkills = currentSkills.filter(s => s !== skill);
      
      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, {
        skills: updatedSkills
      });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Skill removed from module: ${moduleId} -> ${skill}`);
      return true;
    } catch (error) {
      console.error('❌ Error removing skill from module:', error);
      return false;
    }
  }

  async addPrerequisiteToModule(moduleId: string, prerequisite: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const module = this.findModuleById(currentArtifact.data, moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const currentPrerequisites = module.prerequisites || [];
      if (currentPrerequisites.includes(prerequisite)) {
        console.log(`⚠️ Prerequisite already exists: ${prerequisite}`);
        return true; // Not an error, just already exists
      }

      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, {
        prerequisites: [...currentPrerequisites, prerequisite]
      });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Prerequisite added to module: ${moduleId} -> ${prerequisite}`);
      return true;
    } catch (error) {
      console.error('❌ Error adding prerequisite to module:', error);
      return false;
    }
  }

  async removePrerequisiteFromModule(moduleId: string, prerequisite: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const module = this.findModuleById(currentArtifact.data, moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      const currentPrerequisites = module.prerequisites || [];
      const updatedPrerequisites = currentPrerequisites.filter(p => p !== prerequisite);
      
      const updatedData = this.updateModuleById(currentArtifact.data, moduleId, {
        prerequisites: updatedPrerequisites
      });
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Prerequisite removed from module: ${moduleId} -> ${prerequisite}`);
      return true;
    } catch (error) {
      console.error('❌ Error removing prerequisite from module:', error);
      return false;
    }
  }

  // Course-level editing functions
  async editCourseInfo(updates: Partial<MindMapNode>): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = { ...currentArtifact.data, ...updates };
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Course info updated`);
      return true;
    } catch (error) {
      console.error('❌ Error updating course info:', error);
      return false;
    }
  }

  async editCourseTitle(newTitle: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = { ...currentArtifact.data, title: newTitle };
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Course title updated: "${newTitle}"`);
      return true;
    } catch (error) {
      console.error('❌ Error updating course title:', error);
      return false;
    }
  }

  async editCourseDescription(newDescription: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const updatedData = { ...currentArtifact.data, description: newDescription };
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Course description updated`);
      return true;
    } catch (error) {
      console.error('❌ Error updating course description:', error);
      return false;
    }
  }

  // Advanced operations
  async duplicateModule(moduleId: string, newParentId?: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const originalModule = this.findModuleById(currentArtifact.data, moduleId);
      if (!originalModule) {
        throw new Error('Module not found');
      }

      const duplicatedModule: MindMapNode = {
        ...originalModule,
        id: crypto.randomUUID(),
        title: `${originalModule.title} (Copy)`,
        children: originalModule.children ? [...originalModule.children] : []
      };

      const targetParentId = newParentId || (originalModule.level === 1 ? null : this.findParentId(currentArtifact.data, moduleId));
      const updatedData = this.addModuleToParent(currentArtifact.data, targetParentId, duplicatedModule);
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module duplicated: ${moduleId} -> ${duplicatedModule.id}`);
      return true;
    } catch (error) {
      console.error('❌ Error duplicating module:', error);
      return false;
    }
  }

  async moveModule(moduleId: string, newParentId: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const moduleToMove = this.findModuleById(currentArtifact.data, moduleId);
      if (!moduleToMove) {
        throw new Error('Module not found');
      }

      // First remove the module from its current location
      let updatedData = this.removeModuleById(currentArtifact.data, moduleId);
      if (!updatedData) {
        throw new Error('Cannot move root module');
      }

      // Then add it to the new parent
      updatedData = this.addModuleToParent(updatedData, newParentId, moduleToMove);
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: updatedData });
      
      console.log(`✅ Module moved: ${moduleId} -> ${newParentId}`);
      return true;
    } catch (error) {
      console.error('❌ Error moving module:', error);
      return false;
    }
  }

  async mergeModules(sourceId: string, targetId: string): Promise<boolean> {
    try {
      const { currentArtifact } = this.artifactStore;
      if (!currentArtifact || currentArtifact.type !== 'mindmap') {
        throw new Error('No mindmap artifact currently active');
      }

      const sourceModule = this.findModuleById(currentArtifact.data, sourceId);
      const targetModule = this.findModuleById(currentArtifact.data, targetId);
      
      if (!sourceModule || !targetModule) {
        throw new Error('One or both modules not found');
      }

      // Merge skills and prerequisites
      const mergedSkills = [...new Set([...(targetModule.skills || []), ...(sourceModule.skills || [])])];
      const mergedPrerequisites = [...new Set([...(targetModule.prerequisites || []), ...(sourceModule.prerequisites || [])])];
      
      // Merge children
      const mergedChildren = [...(targetModule.children || []), ...(sourceModule.children || [])];
      
      // Update target module with merged data
      const updatedData = this.updateModuleById(currentArtifact.data, targetId, {
        skills: mergedSkills,
        prerequisites: mergedPrerequisites,
        children: mergedChildren
      });

      // Remove source module
      const finalData = this.removeModuleById(updatedData, sourceId);
      if (!finalData) {
        throw new Error('Cannot merge root module');
      }
      
      this.artifactStore.updateArtifact(currentArtifact.id, { data: finalData });
      
      console.log(`✅ Modules merged: ${sourceId} -> ${targetId}`);
      return true;
    } catch (error) {
      console.error('❌ Error merging modules:', error);
      return false;
    }
  }

  // Helper function to find parent ID
  private findParentId(root: MindMapNode, childId: string): string | null {
    if (root.children) {
      for (const child of root.children) {
        if (child.id === childId) {
          return root.id;
        }
        const found = this.findParentId(child, childId);
        if (found) return found;
      }
    }
    return null;
  }
}

// Create and export a singleton instance
export const aiEditingTools = new AIEditingToolsImpl();

// Export individual functions for easier use
export const {
  editModuleTitle,
  editModuleDescription,
  editModuleDifficulty,
  editModuleHours,
  addModule,
  deleteModule,
  reorderModules,
  addSkillToModule,
  removeSkillFromModule,
  addPrerequisiteToModule,
  removePrerequisiteFromModule,
  editCourseInfo,
  editCourseTitle,
  editCourseDescription,
  duplicateModule,
  moveModule,
  mergeModules
} = aiEditingTools;
