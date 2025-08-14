'use client';

import { MindMapNode } from '@/types/artifacts';
import { Clock, Target, BookOpen, Users, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeTooltipProps {
  node: MindMapNode;
  position: { x: number; y: number };
  visible: boolean;
}

export function NodeTooltip({ node, position, visible }: NodeTooltipProps) {
  if (!visible) return null;

  const {
    title,
    description,
    difficulty = 'beginner',
    estimatedHours,
    skills = [],
    prerequisites = [],
    children = []
  } = node;

  const difficultyColors = {
    beginner: 'text-green-600 bg-green-50 border-green-200',
    intermediate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    advanced: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div
      className="fixed z-50 bg-background border shadow-xl rounded-lg p-4 max-w-sm pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translate(0, -50%)',
      }}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-base mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Difficulty Badge */}
      <div className="mb-3">
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium border',
          difficultyColors[difficulty]
        )}>
          {difficulty} level
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        {estimatedHours && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{estimatedHours}h</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span>{skills.length} skills</span>
        </div>

        {prerequisites.length > 0 && (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span>{prerequisites.length} prereqs</span>
          </div>
        )}

        {children.length > 0 && (
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>{children.length} modules</span>
          </div>
        )}
      </div>

      {/* Skills List */}
      {skills.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Skills covered:</h4>
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 6).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
              >
                {skill}
              </span>
            ))}
            {skills.length > 6 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                +{skills.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Prerequisites:</h4>
          <div className="space-y-1">
            {prerequisites.slice(0, 3).map((prereq, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{prereq}</span>
              </div>
            ))}
            {prerequisites.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{prerequisites.length - 3} more prerequisites
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arrow pointing to node */}
      <div 
        className="absolute w-0 h-0 border-4 border-transparent border-r-background"
        style={{
          left: -8,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
}