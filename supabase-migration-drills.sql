-- Drills Table Migration for AI Learning Path SaaS
-- This migration adds the drills table to store interactive learning exercises

-- Create drills table
CREATE TABLE IF NOT EXISTS drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('html', 'jsx', 'interactive', 'simulation', 'quiz')),
  skill_name TEXT NOT NULL,
  learning_objectives TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time INTEGER NOT NULL DEFAULT 15,
  code TEXT NOT NULL,
  
  -- Relationships (optional - drills can exist independently or be tied to specific projects/skills)
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  skill_atom_ids UUID[] DEFAULT '{}',
  
  -- Metadata and versioning
  tags TEXT[] DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User ownership
  user_id UUID,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drills_project_id ON drills(project_id);
CREATE INDEX IF NOT EXISTS idx_drills_skill_name ON drills(skill_name);
CREATE INDEX IF NOT EXISTS idx_drills_type ON drills(type);
CREATE INDEX IF NOT EXISTS idx_drills_difficulty ON drills(difficulty);
CREATE INDEX IF NOT EXISTS idx_drills_user_id ON drills(user_id);
CREATE INDEX IF NOT EXISTS idx_drills_created_at ON drills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drills_updated_at ON drills(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_drills_is_active ON drills(is_active);

-- Create GIN index for array fields for better search performance
CREATE INDEX IF NOT EXISTS idx_drills_learning_objectives_gin ON drills USING GIN(learning_objectives);
CREATE INDEX IF NOT EXISTS idx_drills_tags_gin ON drills USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_drills_skill_atom_ids_gin ON drills USING GIN(skill_atom_ids);

-- Enable Row Level Security
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drills
CREATE POLICY "Users can view their own drills" ON drills
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own drills" ON drills
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update their own drills" ON drills
  FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can delete their own drills" ON drills
  FOR DELETE USING (user_id IS NULL OR user_id = auth.uid());

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_drills_updated_at 
  BEFORE UPDATE ON drills 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON drills TO anon, authenticated;

-- Insert some sample drills for testing (optional)
-- INSERT INTO drills (title, description, type, skill_name, learning_objectives, difficulty, estimated_time, code, user_id) VALUES 
--   ('HTML Form Validation', 'Practice creating and validating HTML forms with JavaScript', 'html', 'HTML Forms', ARRAY['Create HTML forms', 'Implement client-side validation', 'Handle form submission'], 'beginner', 15, '<!DOCTYPE html>...', NULL),
--   ('React Counter Component', 'Build a simple counter component with state management', 'jsx', 'React State', ARRAY['Use React useState hook', 'Handle events', 'Manage component state'], 'beginner', 20, 'import React, { useState } from "react";...', NULL);
