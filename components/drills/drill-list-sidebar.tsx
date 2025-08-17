'use client';

import { useState, useEffect } from 'react';
import { Plus, Code, Zap, Target, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drill, DrillType, DrillPreview } from '@/types/drills';
import { cn } from '@/lib/utils';
import { useDrillStore } from '@/lib/drill-store';

interface DrillListSidebarProps {
  selectedDrill: Drill | null;
  onSelectDrill: (drill: Drill | null) => void;
  searchQuery: string;
  filterType: DrillType | 'all';
}

export function DrillListSidebar({
  selectedDrill,
  onSelectDrill,
  searchQuery,
  filterType,
}: DrillListSidebarProps) {
  const drills = useDrillStore((state) => state.drills);
  const addDrill = useDrillStore((state) => state.addDrill);

  // Sample drills are now initialized in the store

  const filteredDrills = drills.filter((drill) => {
    const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         drill.skillName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || drill.type === filterType;
    return matchesSearch && matchesType;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: DrillType) => {
    switch (type) {
      case 'html': return <Code className="h-4 w-4" />;
      case 'jsx': return <Zap className="h-4 w-4" />;
      case 'interactive': return <Target className="h-4 w-4" />;
      case 'simulation': return <Star className="h-4 w-4" />;
      case 'quiz': return <Target className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Your Drills</h2>
        <p className="text-sm text-muted-foreground">
          {filteredDrills.length} drill{filteredDrills.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Drill List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredDrills.map((drill) => (
          <div
            key={drill.id}
            className={cn(
              'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
              selectedDrill?.id === drill.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => onSelectDrill(drill)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 p-2 rounded-md bg-muted">
                {getTypeIcon(drill.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{drill.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{drill.skillName}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getDifficultyColor(drill.difficulty)
                  )}>
                    {drill.difficulty}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{drill.estimatedTime}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredDrills.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No drills found</p>
            <p className="text-xs">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Create New Drill Button */}
      <div className="p-4 border-t">
        <Button
          onClick={() => onSelectDrill(null)}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Drill
        </Button>
      </div>
    </div>
  );
}
