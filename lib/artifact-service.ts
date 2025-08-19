import { supabase, type Artifact, type ArtifactInsert, type ArtifactUpdate } from './supabase';

export class ArtifactService {
  /**
   * Create a new artifact
   */
  static async createArtifact(artifact: ArtifactInsert): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .insert(artifact)
        .select()
        .single();

      if (error) {
        console.error('Error creating artifact:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating artifact:', error);
      return null;
    }
  }

  /**
   * Get an artifact by ID
   */
  static async getArtifact(id: string): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching artifact:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching artifact:', error);
      return null;
    }
  }

  /**
   * Get all artifacts for a user
   */
  static async getUserArtifacts(userId?: string): Promise<Artifact[]> {
    try {
      let query = supabase
        .from('artifacts')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user artifacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user artifacts:', error);
      return [];
    }
  }

  /**
   * Get artifacts by conversation ID
   */
  static async getArtifactsByConversation(conversationId: string): Promise<Artifact[]> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversation artifacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversation artifacts:', error);
      return [];
    }
  }

  /**
   * Get artifacts by project ID
   */
  static async getArtifactsByProject(projectId: string): Promise<Artifact[]> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project artifacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching project artifacts:', error);
      return [];
    }
  }

  /**
   * Get artifacts by type
   */
  static async getArtifactsByType(type: string, userId?: string): Promise<Artifact[]> {
    try {
      let query = supabase
        .from('artifacts')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artifacts by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching artifacts by type:', error);
      return [];
    }
  }

  /**
   * Update an artifact
   */
  static async updateArtifact(id: string, updates: ArtifactUpdate): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating artifact:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating artifact:', error);
      return null;
    }
  }

  /**
   * Soft delete an artifact (set is_active to false)
   */
  static async deleteArtifact(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('artifacts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting artifact:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting artifact:', error);
      return false;
    }
  }

  /**
   * Hard delete an artifact (permanently remove)
   */
  static async hardDeleteArtifact(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('artifacts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error hard deleting artifact:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error hard deleting artifact:', error);
      return false;
    }
  }

  /**
   * Search artifacts by name or description
   */
  static async searchArtifacts(searchTerm: string, userId?: string): Promise<Artifact[]> {
    try {
      let query = supabase
        .from('artifacts')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching artifacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching artifacts:', error);
      return [];
    }
  }

  /**
   * Get artifacts by tags
   */
  static async getArtifactsByTags(tags: string[], userId?: string): Promise<Artifact[]> {
    try {
      let query = supabase
        .from('artifacts')
        .select('*')
        .overlaps('tags', tags)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artifacts by tags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching artifacts by tags:', error);
      return [];
    }
  }

  /**
   * Create a new version of an artifact
   */
  static async createArtifactVersion(originalId: string, newData: ArtifactInsert): Promise<Artifact | null> {
    try {
      // Get the original artifact to increment version
      const original = await this.getArtifact(originalId);
      if (!original) return null;

      // Create new artifact with incremented version
      const newArtifact: ArtifactInsert = {
        ...newData,
        version: (original.version || 1) + 1,
        metadata: {
          ...newData.metadata,
          originalArtifactId: originalId,
          version: (original.version || 1) + 1
        }
      };

      return await this.createArtifact(newArtifact);
    } catch (error) {
      console.error('Error creating artifact version:', error);
      return null;
    }
  }
}
