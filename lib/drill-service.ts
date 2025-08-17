import { supabase } from './supabase';
import { DrillInsert, DrillUpdate, Drill } from './supabase';

export class DrillService {
  /**
   * Create a new drill
   */
  static async createDrill(drillData: DrillInsert): Promise<Drill> {
    const { data, error } = await supabase
      .from('drills')
      .insert(drillData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create drill: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a drill by ID
   */
  static async getDrillById(id: string): Promise<Drill | null> {
    const { data, error } = await supabase
      .from('drills')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get drill: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all drills for a user
   */
  static async getUserDrills(userId?: string): Promise<Drill[]> {
    let query = supabase
      .from('drills')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get drills: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get drills by project ID
   */
  static async getDrillsByProject(projectId: string): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get project drills: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get drills by skill atom ID
   */
  static async getDrillsBySkillAtom(skillAtomId: string): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select('*')
      .contains('skill_atom_ids', [skillAtomId])
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get skill atom drills: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get drills by type
   */
  static async getDrillsByType(type: string): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get drills by type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get drills by difficulty
   */
  static async getDrillsByDifficulty(difficulty: string): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get drills by difficulty: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search drills by text query
   */
  static async searchDrills(query: string): Promise<Drill[]> {
    const { data, error } = await supabase
      .from('drills')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,skill_name.ilike.%${query}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search drills: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update a drill
   */
  static async updateDrill(id: string, updates: DrillUpdate): Promise<Drill> {
    const { data, error } = await supabase
      .from('drills')
      .update({
        ...updates,
        version: (updates.version || 1) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update drill: ${error.message}`);
    }

    return data;
  }

  /**
   * Soft delete a drill (set is_active to false)
   */
  static async deleteDrill(id: string): Promise<void> {
    const { error } = await supabase
      .from('drills')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete drill: ${error.message}`);
    }
  }

  /**
   * Hard delete a drill (permanently remove)
   */
  static async hardDeleteDrill(id: string): Promise<void> {
    const { error } = await supabase
      .from('drills')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to hard delete drill: ${error.message}`);
    }
  }

  /**
   * Duplicate a drill
   */
  static async duplicateDrill(id: string, userId?: string): Promise<Drill> {
    const originalDrill = await this.getDrillById(id);
    if (!originalDrill) {
      throw new Error('Drill not found');
    }

    const duplicatedDrill: DrillInsert = {
      title: `${originalDrill.title} (Copy)`,
      description: originalDrill.description,
      type: originalDrill.type,
      skill_name: originalDrill.skill_name,
      learning_objectives: originalDrill.learning_objectives,
      difficulty: originalDrill.difficulty,
      estimated_time: originalDrill.estimated_time,
      code: originalDrill.code,
      project_id: originalDrill.project_id,
      skill_atom_ids: originalDrill.skill_atom_ids,
      tags: originalDrill.tags,
      version: 1,
      is_active: true,
      user_id: userId || originalDrill.user_id,
      metadata: originalDrill.metadata
    };

    return await this.createDrill(duplicatedDrill);
  }

  /**
   * Get drills with pagination
   */
  static async getDrillsPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: string;
      difficulty?: string;
      skillName?: string;
      projectId?: string;
    }
  ): Promise<{ drills: Drill[]; total: number; page: number; totalPages: number }> {
    let query = supabase
      .from('drills')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters?.skillName) {
      query = query.ilike('skill_name', `%${filters.skillName}%`);
    }
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to get drills: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      drills: data || [],
      total,
      page,
      totalPages
    };
  }
}
