export interface ArtifactMetadata {
  id: string;
  userId: string;
  created_at: string;
  updated_at: string;
  type: 'code' | 'html' | 'markdown' | 'json' | 'mindmap' | 'component' | 'function' | 'class' | 'interface' | 'type' | 'file';
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
  rawData?: any; // For structured data like mindmaps
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
  private readonly STORAGE_KEY = 'ai_artifacts';
  private readonly USER_ID = 'default_user'; // Will be replaced with actual user ID later

  // Initialize storage
  private initializeStorage(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  // Get all artifacts from storage
  private getStorageData(): Artifact[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  // Save artifacts to storage
  private saveStorageData(artifacts: Artifact[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(artifacts));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save a new artifact
  async saveArtifact(artifact: Omit<Artifact, 'metadata'> & { title: string; type: ArtifactMetadata['type'] }): Promise<string> {
    this.initializeStorage();
    
    const now = new Date().toISOString();
    const newArtifact: Artifact = {
      ...artifact,
      metadata: {
        id: this.generateId(),
        userId: this.USER_ID,
        created_at: now,
        updated_at: now,
        type: artifact.type,
        title: artifact.title,
        description: artifact.description,
        tags: artifact.tags || [],
        version: 1,
        size: artifact.content.length,
        language: this.detectLanguage(artifact.type, artifact.content),
        framework: this.detectFramework(artifact.content),
        ...artifact.metadata
      }
    };

    const artifacts = this.getStorageData();
    artifacts.push(newArtifact);
    this.saveStorageData(artifacts);

    return newArtifact.metadata.id;
  }

  // Get artifact by ID
  async getArtifact(id: string): Promise<Artifact | null> {
    this.initializeStorage();
    
    const artifacts = this.getStorageData();
    return artifacts.find(artifact => artifact.metadata.id === id) || null;
  }

  // Get artifact by title
  async getArtifactByTitle(title: string): Promise<Artifact | null> {
    this.initializeStorage();
    
    const artifacts = this.getStorageData();
    return artifacts.find(artifact => artifact.metadata.title === title) || null;
  }

  // List all artifacts with optional filtering
  async listArtifacts(filter?: ArtifactFilter): Promise<Artifact[]> {
    this.initializeStorage();
    
    let artifacts = this.getStorageData();

    // Apply filters
    if (filter) {
      if (filter.type) {
        artifacts = artifacts.filter(artifact => artifact.metadata.type === filter.type);
      }
      
      if (filter.userId) {
        artifacts = artifacts.filter(artifact => artifact.metadata.userId === filter.userId);
      }
      
      if (filter.tags && filter.tags.length > 0) {
        artifacts = artifacts.filter(artifact => 
          filter.tags!.some(tag => artifact.metadata.tags?.includes(tag))
        );
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        artifacts = artifacts.filter(artifact => 
          artifact.metadata.title.toLowerCase().includes(searchLower) ||
          artifact.metadata.description?.toLowerCase().includes(searchLower) ||
          artifact.content.toLowerCase().includes(searchLower)
        );
      }
      
      if (filter.createdAfter) {
        artifacts = artifacts.filter(artifact => 
          artifact.metadata.created_at >= filter.createdAfter!
        );
      }
      
      if (filter.createdBefore) {
        artifacts = artifacts.filter(artifact => 
          artifact.metadata.created_at <= filter.createdBefore!
        );
      }
    }

    // Sort by most recent first
    return artifacts.sort((a, b) => 
      new Date(b.metadata.updated_at).getTime() - new Date(a.metadata.created_at).getTime()
    );
  }

  // Update existing artifact
  async updateArtifact(id: string, updates: Partial<Artifact>): Promise<boolean> {
    this.initializeStorage();
    
    const artifacts = this.getStorageData();
    const index = artifacts.findIndex(artifact => artifact.metadata.id === id);
    
    if (index === -1) return false;

    const updatedArtifact: Artifact = {
      ...artifacts[index],
      ...updates,
      metadata: {
        ...artifacts[index].metadata,
        ...updates.metadata,
        updated_at: new Date().toISOString(),
        version: (artifacts[index].metadata.version || 1) + 1,
        size: updates.content ? updates.content.length : artifacts[index].metadata.size
      }
    };

    artifacts[index] = updatedArtifact;
    this.saveStorageData(artifacts);
    
    return true;
  }

  // Delete artifact
  async deleteArtifact(id: string): Promise<boolean> {
    this.initializeStorage();
    
    const artifacts = this.getStorageData();
    const filteredArtifacts = artifacts.filter(artifact => artifact.metadata.id !== id);
    
    if (filteredArtifacts.length === artifacts.length) return false;
    
    this.saveStorageData(filteredArtifacts);
    return true;
  }

  // Search artifacts by content
  async searchArtifacts(query: string): Promise<Artifact[]> {
    this.initializeStorage();
    
    const artifacts = this.getStorageData();
    const queryLower = query.toLowerCase();
    
    return artifacts.filter(artifact => 
      artifact.metadata.title.toLowerCase().includes(queryLower) ||
      artifact.metadata.description?.toLowerCase().includes(queryLower) ||
      artifact.content.toLowerCase().includes(queryLower) ||
      artifact.metadata.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  // Get artifacts by type
  async getArtifactsByType(type: ArtifactMetadata['type']): Promise<Artifact[]> {
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
    this.initializeStorage();
    
    const artifacts = this.getStorageData();
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
  }

  // Export all artifacts
  async exportArtifacts(): Promise<string> {
    this.initializeStorage();
    
    const artifacts = this.getStorageData();
    return JSON.stringify(artifacts, null, 2);
  }

  // Import artifacts
  async importArtifacts(jsonData: string): Promise<number> {
    try {
      const artifacts = JSON.parse(jsonData);
      if (!Array.isArray(artifacts)) throw new Error('Invalid artifacts format');
      
      const existingArtifacts = this.getStorageData();
      const mergedArtifacts = [...existingArtifacts, ...artifacts];
      
      this.saveStorageData(mergedArtifacts);
      return artifacts.length;
    } catch (error) {
      console.error('Error importing artifacts:', error);
      throw new Error('Failed to import artifacts');
    }
  }

  // Clear all artifacts
  async clearAllArtifacts(): Promise<void> {
    this.saveStorageData([]);
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

  // Migration helper for future Supabase upgrade
  async migrateToSupabase(): Promise<void> {
    // This will be implemented when upgrading to Supabase
    console.log('Migration to Supabase not yet implemented');
  }
}

// Export singleton instance
export const artifactStorage = new ArtifactStorageService();

// Export types for external use
export type { ArtifactMetadata, Artifact, ArtifactFilter };
