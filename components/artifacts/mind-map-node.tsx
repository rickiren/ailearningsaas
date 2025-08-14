'use client';

import { memo, useState, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Clock, Target, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MindMapNode } from '@/types/artifacts';
import { NodeTooltip } from './node-tooltip';

interface MindMapNodeData extends MindMapNode {
  isRoot: boolean;
  level: number;
  isNew: boolean;
}

const DIFFICULTY_COLORS = {
  beginner: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  intermediate: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  advanced: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
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

  const fontSizes = getFontSizes();

  return (
    <>
      <div
        ref={nodeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative rounded-xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer',
          getNodeSize(),
          isRoot 
            ? 'bg-primary text-primary-foreground border-primary' 
            : cn('bg-background', colors.border),
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
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
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
          
          {/* Level Indicator */}
          <div className="ml-2 shrink-0">
            {isRoot ? (
              <Target className="h-5 w-5" />
            ) : (
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                isRoot ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {level}
              </div>
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
                      isRoot 
                        ? 'bg-primary-foreground/20 text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 3 && (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    isRoot 
                      ? 'bg-primary-foreground/20 text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    +{skills.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expand Indicator */}
        {hasChildren && (
          <div className="flex justify-center mt-2">
            <ChevronDown className={cn(
              'h-4 w-4',
              isRoot ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )} />
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