'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, BookOpen, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MindMapNode } from '@/types/artifacts';

interface ModuleEditorProps {
  module: MindMapNode;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedModule: MindMapNode) => void;
  onDelete: (moduleId: string) => void;
  onAddChild?: (parentId: string) => void;
  isRoot?: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-700' },
];

export function ModuleEditor({ 
  module, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  onAddChild,
  isRoot = false 
}: ModuleEditorProps) {
  const [formData, setFormData] = useState<MindMapNode>({ ...module });
  const [newSkill, setNewSkill] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData({ ...module });
    setIsDirty(false);
  }, [module]);

  const handleInputChange = (field: keyof MindMapNode, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSkillAdd = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      const updatedSkills = [...(formData.skills || []), newSkill.trim()];
      handleInputChange('skills', updatedSkills);
      setNewSkill('');
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    const updatedSkills = formData.skills?.filter(skill => skill !== skillToRemove) || [];
    handleInputChange('skills', updatedSkills);
  };

  const handlePrerequisiteAdd = () => {
    if (newPrerequisite.trim() && !formData.prerequisites?.includes(newPrerequisite.trim())) {
      const updatedPrerequisites = [...(formData.prerequisites || []), newPrerequisite.trim()];
      handleInputChange('prerequisites', updatedPrerequisites);
      setNewPrerequisite('');
    }
  };

  const handlePrerequisiteRemove = (prereqToRemove: string) => {
    const updatedPrerequisites = formData.prerequisites?.filter(prereq => prereq !== prereqToRemove) || [];
    handleInputChange('prerequisites', updatedPrerequisites);
  };

  const handleSave = () => {
    onSave(formData);
    setIsDirty(false);
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {isRoot ? 'Edit Course' : 'Edit Module'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter module title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter module description"
                  className="w-full px-3 py-2 border border-input rounded-md resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!isRoot && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                    <div className="flex gap-1">
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleInputChange('difficulty', option.value)}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex-1 ${
                            formData.difficulty === option.value
                              ? option.color
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimatedHours || ''}
                      onChange={(e) => handleInputChange('estimatedHours', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-16"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Prerequisites - Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Skills */}
            <div className="space-y-2">
              <h3 className="text-base font-medium">Skills</h3>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill"
                    onKeyPress={(e) => e.key === 'Enter' && handleSkillAdd()}
                  />
                  <Button onClick={handleSkillAdd} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                                  {formData.skills && formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded text-sm"
                        >
                          <Target className="h-3 w-3" />
                          {skill}
                          <button
                            onClick={() => handleSkillRemove(skill)}
                            className="ml-1 hover:bg-primary/20 rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-2">
              <h3 className="text-base font-medium">Prerequisites</h3>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    placeholder="Add prerequisite"
                    onKeyPress={(e) => e.key === 'Enter' && handlePrerequisiteAdd()}
                  />
                  <Button onClick={handlePrerequisiteAdd} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                                  {formData.prerequisites && formData.prerequisites.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.prerequisites.map((prereq, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-muted px-3 py-1 rounded text-sm"
                        >
                          <BookOpen className="h-3 w-3" />
                          {prereq}
                          <button
                            onClick={() => handlePrerequisiteRemove(prereq)}
                            className="ml-1 hover:bg-muted/80 rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t space-y-4">
            {/* Primary Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isDirty}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              {onAddChild && !isRoot && (
                <Button variant="outline" onClick={() => onAddChild(module.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              )}
              
              {!isRoot && (
                <Button 
                  variant="destructive" 
                  onClick={() => onDelete(module.id)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Module
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
