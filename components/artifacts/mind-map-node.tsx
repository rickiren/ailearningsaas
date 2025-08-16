'use client';

import { memo, useState, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock, Target, BookOpen, ChevronDown, ChevronRight, ArrowRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MindMapNode } from '@/types/artifacts';
import { NodeTooltip } from './node-tooltip';

interface MindMapNodeData extends MindMapNode {
  isRoot: boolean;
  level: number;
  moduleIndex?: number;
  lessonIndex?: number;
  isNew: boolean;
}

const DIFFICULTY_COLORS = {
  beginner: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    progress: 'bg-green-500',
  },
  intermediate: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    progress: 'bg-yellow-500',
  },
  advanced: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    progress: 'bg-red-500',
  },
};

export const MindMapNodeComponent = memo<NodeProps<MindMapNodeData>>(({ data, selected }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.right,
        y: rect.top + rect.height / 2,
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const {
    title,
    description,
    difficulty = 'beginner',
    estimatedHours,
    skills = [],
    isRoot,
    level,
    moduleIndex,
    lessonIndex,
    isNew,
    children
  } = data;

  const colors = DIFFICULTY_COLORS[difficulty];
  const hasChildren = children && children.length > 0;

  // Different sizes based on level
  const getNodeSize = () => {
    if (isRoot) return 'w-80 min-h-32';
    if (level === 1) return 'w-64 min-h-28';
    return 'w-56 min-h-24';
  };

  const getFontSizes = () => {
    if (isRoot) return { title: 'text-lg', meta: 'text-sm' };
    if (level === 1) return { title: 'text-base', meta: 'text-xs' };
    return { title: 'text-sm', meta: 'text-xs' };
  };

  // Get level-specific styling
  const getLevelStyling = () => {
    if (isRoot) {
      return {
        bg: 'bg-primary text-primary-foreground border-primary',
        badge: 'bg-primary-foreground/20 text-primary-foreground',
        skills: 'bg-primary-foreground/20 text-primary-foreground',
      };
    }
    if (level === 1) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        skills: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      };
    }
    if (level === 2) {
      return {
        bg: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        skills: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      };
    }
    return {
      bg: 'bg-background',
      badge: colors.badge,
      skills: 'bg-muted text-muted-foreground',
    };
  };

  const fontSizes = getFontSizes();
  const levelStyling = getLevelStyling();

  // Get progression indicator text
  const getProgressionText = () => {
    if (isRoot) return 'COURSE';
    if (level === 1) return `MODULE ${moduleIndex}`;
    if (level === 2) return `LESSON ${lessonIndex}`;
    return '';
  };

  // Get progression icon
  const getProgressionIcon = () => {
    if (isRoot) return <Target className="h-5 w-5" />;
    if (level === 1) return <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    if (level === 2) return <Play className="h-5 w-5 text-green-600 dark:text-green-400" />;
    return null;
  };

  return (
    <>
      <div
        ref={nodeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative rounded-xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer',
          getNodeSize(),
          levelStyling.bg,
          selected && 'ring-2 ring-primary ring-offset-2',
          isNew && 'animate-in zoom-in-50 fade-in duration-700'
        )}
      >
      {/* Input Handle */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 border-2 bg-background"
        />
      )}

      {/* Node Content */}
      <div className="p-4 h-full flex flex-col">
        {/* Header with Progression Indicator */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Progression Badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-bold tracking-wide',
                levelStyling.badge
              )}>
                {getProgressionText()}
              </div>
              {getProgressionIcon()}
            </div>
            
            <h3 className={cn('font-semibold leading-tight', fontSizes.title)}>
              {title}
            </h3>
            {description && (
              <p className={cn(
                'mt-1 leading-relaxed line-clamp-2',
                isRoot ? 'text-primary-foreground/80' : 'text-muted-foreground',
                fontSizes.meta
              )}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex-1 space-y-2">
          {/* Difficulty Badge */}
          {!isRoot && (
            <div className="flex items-center gap-2">
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                colors.badge
              )}>
                {difficulty}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            {estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{estimatedHours}h</span>
              </div>
            )}
            
            {skills.length > 0 && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{skills.length} skills</span>
              </div>
            )}
          </div>

          {/* Skills Preview */}
          {skills.length > 0 && (level === 0 || level === 1) && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      levelStyling.skills
                    )}
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 3 && (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    levelStyling.skills
                  )}>
                    +{skills.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progression Indicator */}
        {hasChildren && (
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <span>Continue to</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      {hasChildren && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 border-2 bg-background"
        />
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* New Node Pulse Effect */}
      {isNew && (
        <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" />
      )}

      {/* Progression Line Indicator */}
      {!isRoot && (
        <div className="absolute -left-2 top-1/2 w-4 h-0.5 bg-muted-foreground/30 transform -translate-y-1/2" />
      )}
    </div>

    {/* Tooltip */}
    <NodeTooltip
      node={data}
      position={tooltipPosition}
      visible={showTooltip}
    />
  </>
  );
});

MindMapNodeComponent.displayName = 'MindMapNodeComponent';