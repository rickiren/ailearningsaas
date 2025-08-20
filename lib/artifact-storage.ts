import { supabase, Artifact as SupabaseArtifact, ArtifactInsert, ArtifactUpdate } from './supabase';

export interface ArtifactMetadata {
  id: string;
  userId?: string;
  created_at: string;
  updated_at: string;
  type: string;
  title: string;
  description?: string;
  tags?: string[];
  version?: number;
  parentId?: string;
  dependencies?: string[];
  filePath?: string;
  size?: number;
  language?: string;
  framework?: string;
}

export interface Artifact {
  metadata: ArtifactMetadata;
  content: string;
  rawData?: any;
  id: string;
  type: string;
}

export interface ArtifactFilter {
  type?: string;
  userId?: string;
  tags?: string[];
  search?: string;
  createdAfter?: string;
  createdBefore?: string;
}

class ArtifactStorageService {
  private readonly USER_ID = 'default_user';

  // Convert Supabase artifact to local Artifact format
  private convertSupabaseArtifact(supabaseArtifact: SupabaseArtifact): Artifact {
    return {
      id: supabaseArtifact.id,
      content: supabaseArtifact.content,
      type: supabaseArtifact.type,
      rawData: supabaseArtifact.metadata,
      metadata: {
        id: supabaseArtifact.id,
        userId: supabaseArtifact.user_id || this.USER_ID,
        created_at: supabaseArtifact.created_at,
        updated_at: supabaseArtifact.updated_at,
        type: supabaseArtifact.type,
        title: supabaseArtifact.name,
        description: supabaseArtifact.description || undefined,
        tags: supabaseArtifact.tags || [],
        version: supabaseArtifact.version,
        size: supabaseArtifact.content.length,
        language: this.detectLanguage(supabaseArtifact.type, supabaseArtifact.content),
        framework: this.detectFramework(supabaseArtifact.content)
      }
    };
  }

  // Convert local artifact to Supabase format
  private convertToSupabaseInsert(artifact: Omit<Artifact, 'metadata'> & { title: string; type: string }): ArtifactInsert {
    return {
      name: artifact.title,
      type: artifact.type,
      content: artifact.content,
      description: artifact.description,
      tags: artifact.tags || [],
      user_id: this.USER_ID,
      version: 1,
      is_active: true,
      metadata: artifact.rawData || {}
    };
  }

  // Save a new artifact
  async saveArtifact(artifact: Omit<Artifact, 'metadata'> & { title: string; type: string }): Promise<string> {
    try {
      const insertData = this.convertToSupabaseInsert(artifact);
      
      const { data, error } = await supabase
        .from('artifacts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error saving artifact to Supabase:', error);
        throw new Error(`Failed to save artifact: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      console.error('Error in saveArtifact:', error);
      throw error;
    }
  }

  // Get artifact by ID
  async getArtifact(id: string): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return this.convertSupabaseArtifact(data);
    } catch (error) {
      console.error('Error fetching artifact:', error);
      return null;
    }
  }

  // Get artifact by title
  async getArtifactByTitle(title: string): Promise<Artifact | null> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('name', title)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return this.convertSupabaseArtifact(data);
    } catch (error) {
      console.error('Error fetching artifact by title:', error);
      return null;
    }
  }

  // List all artifacts with optional filtering
  async listArtifacts(filter?: ArtifactFilter): Promise<Artifact[]> {
    try {
      let query = supabase
        .from('artifacts')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filter) {
        if (filter.type) {
          query = query.eq('type', filter.type);
        }
        
        if (filter.userId) {
          query = query.eq('user_id', filter.userId);
        }
        
        if (filter.tags && filter.tags.length > 0) {
          query = query.overlaps('tags', filter.tags);
        }
        
        if (filter.search) {
          query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%,content.ilike.%${filter.search}%`);
        }
        
        if (filter.createdAfter) {
          query = query.gte('created_at', filter.createdAfter);
        }
        
        if (filter.createdBefore) {
          query = query.lte('created_at', filter.createdBefore);
        }
      }

      // Sort by most recent first
      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artifacts:', error);
        throw new Error(`Failed to fetch artifacts: ${error.message}`);
      }

      return (data || []).map(item => this.convertSupabaseArtifact(item));
    } catch (error) {
      console.error('Error in listArtifacts:', error);
      throw error;
    }
  }

  // Update existing artifact
  async updateArtifact(id: string, updates: Partial<Artifact>): Promise<boolean> {
    try {
      const updateData: ArtifactUpdate = {};
      
      if (updates.content !== undefined) {
        updateData.content = updates.content;
      }
      
      if (updates.metadata?.title !== undefined) {
        updateData.name = updates.metadata.title;
      }
      
      if (updates.metadata?.description !== undefined) {
        updateData.description = updates.metadata.description;
      }
      
      if (updates.metadata?.tags !== undefined) {
        updateData.tags = updates.metadata.tags;
      }
      
      if (updates.type !== undefined) {
        updateData.type = updates.type;
      }
      
      if (updates.rawData !== undefined) {
        updateData.metadata = updates.rawData;
      }

      const { error } = await supabase
        .from('artifacts')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating artifact:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateArtifact:', error);
      return false;
    }
  }

  // Delete artifact (soft delete by setting is_active to false)
  async deleteArtifact(id: string): Promise<boolean> {
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
      console.error('Error in deleteArtifact:', error);
      return false;
    }
  }

  // Search artifacts by content
  async searchArtifacts(query: string): Promise<Artifact[]> {
    return this.listArtifacts({ search: query });
  }

  // Get artifacts by type
  async getArtifactsByType(type: string): Promise<Artifact[]> {
    return this.listArtifacts({ type });
  }

  // Get recent artifacts
  async getRecentArtifacts(limit: number = 10): Promise<Artifact[]> {
    const artifacts = await this.listArtifacts();
    return artifacts.slice(0, limit);
  }

  // Get artifact statistics
  async getArtifactStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byLanguage: Record<string, number>;
    totalSize: number;
    averageSize: number;
  }> {
    try {
      const artifacts = await this.listArtifacts();
      const byType: Record<string, number> = {};
      const byLanguage: Record<string, number> = {};
      let totalSize = 0;

      artifacts.forEach(artifact => {
        // Count by type
        byType[artifact.metadata.type] = (byType[artifact.metadata.type] || 0) + 1;
        
        // Count by language
        if (artifact.metadata.language) {
          byLanguage[artifact.metadata.language] = (byLanguage[artifact.metadata.language] || 0) + 1;
        }
        
        // Calculate size
        totalSize += artifact.metadata.size || 0;
      });

      return {
        total: artifacts.length,
        byType,
        byLanguage,
        totalSize,
        averageSize: artifacts.length > 0 ? totalSize / artifacts.length : 0
      };
    } catch (error) {
      console.error('Error getting artifact stats:', error);
      return {
        total: 0,
        byType: {},
        byLanguage: {},
        totalSize: 0,
        averageSize: 0
      };
    }
  }

  // Export all artifacts
  async exportArtifacts(): Promise<string> {
    try {
      const artifacts = await this.listArtifacts();
      return JSON.stringify(artifacts, null, 2);
    } catch (error) {
      console.error('Error exporting artifacts:', error);
      throw new Error('Failed to export artifacts');
    }
  }

  // Import artifacts
  async importArtifacts(jsonData: string): Promise<number> {
    try {
      const artifacts = JSON.parse(jsonData);
      if (!Array.isArray(artifacts)) throw new Error('Invalid artifacts format');
      
      let importedCount = 0;
      for (const artifact of artifacts) {
        try {
          await this.saveArtifact({
            content: artifact.content,
            title: artifact.metadata.title,
            type: artifact.metadata.type,
            description: artifact.metadata.description,
            tags: artifact.metadata.tags,
            rawData: artifact.rawData
          });
          importedCount++;
        } catch (error) {
          console.error('Error importing individual artifact:', error);
        }
      }
      
      return importedCount;
    } catch (error) {
      console.error('Error importing artifacts:', error);
      throw new Error('Failed to import artifacts');
    }
  }

  // Clear all artifacts (soft delete)
  async clearAllArtifacts(): Promise<void> {
    try {
      const { error } = await supabase
        .from('artifacts')
        .update({ is_active: false })
        .eq('user_id', this.USER_ID);
        
      if (error) {
        console.error('Error clearing artifacts:', error);
        throw new Error('Failed to clear artifacts');
      }
    } catch (error) {
      console.error('Error in clearAllArtifacts:', error);
      throw error;
    }
  }

  // Detect programming language from content and type
  private detectLanguage(type: string, content: string): string {
    if (type === 'component' || content.includes('import React') || content.includes('export default')) {
      return 'tsx';
    }
    
    if (type === 'function' || type === 'class' || type === 'interface' || type === 'type') {
      if (content.includes('interface') || content.includes('type ') || content.includes('export ')) {
        return 'typescript';
      }
      return 'javascript';
    }
    
    if (type === 'html' || content.includes('<html') || content.includes('<div')) {
      return 'html';
    }
    
    if (type === 'markdown' || content.includes('# ') || content.includes('## ')) {
      return 'markdown';
    }
    
    if (type === 'json' || content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return 'json';
    }
    
    // Default language detection based on file extensions in content
    if (content.includes('.tsx') || content.includes('.ts')) return 'typescript';
    if (content.includes('.jsx') || content.includes('.js')) return 'javascript';
    if (content.includes('.css') || content.includes('.scss')) return 'css';
    if (content.includes('.py')) return 'python';
    if (content.includes('.java')) return 'java';
    if (content.includes('.cpp') || content.includes('.cc')) return 'cpp';
    
    return 'text';
  }

  // Detect framework from content
  private detectFramework(content: string): string | undefined {
    if (content.includes('import React') || content.includes('useState') || content.includes('useEffect')) {
      return 'react';
    }
    
    if (content.includes('import { createApp }') || content.includes('Vue.createApp')) {
      return 'vue';
    }
    
    if (content.includes('import { Component }') || content.includes('@Component')) {
      return 'angular';
    }
    
    if (content.includes('import express') || content.includes('app.get(')) {
      return 'express';
    }
    
    if (content.includes('import fastapi') || content.includes('@app.get')) {
      return 'fastapi';
    }
    
    if (content.includes('import django') || content.includes('from django')) {
      return 'django';
    }
    
    return undefined;
  }

  // Migration helper (now implemented with Supabase)
  async migrateToSupabase(): Promise<void> {
    console.log('Already using Supabase for artifact storage');
  }
}

// Export singleton instance
export const artifactStorage = new ArtifactStorageService();

// Export types for external use
export type { ArtifactMetadata, Artifact, ArtifactFilter };
