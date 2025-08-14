'use client';

import { useEffect, useState, useRef } from 'react';
import { MindMapNode } from '@/types/artifacts';
import { cn } from '@/lib/utils';
import { Clock, Target, BookOpen, CheckCircle, Circle } from 'lucide-react';

interface MindMapCanvasProps {
  data: MindMapNode;
  isStreaming?: boolean;
}

interface NodePosition {
  x: number;
  y: number;
}

interface VisualNode extends MindMapNode {
  position: NodePosition;
  isNew?: boolean;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
};

export function MindMapCanvas({ data, isStreaming }: MindMapCanvasProps) {
  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [connections, setConnections] = useState<Array<{from: string, to: string}>>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Layout algorithm - simple hierarchical layout
  const calculateNodePositions = (node: MindMapNode, level: number = 0, index: number = 0): VisualNode[] => {
    const positions: VisualNode[] = [];
    const baseX = 50 + (level * 300);
    const baseY = 100 + (index * 150);
    
    const visualNode: VisualNode = {
      ...node,
      position: { x: baseX, y: baseY }
    };
    
    positions.push(visualNode);
    
    if (node.children) {
      node.children.forEach((child, childIndex) => {
        const childNodes = calculateNodePositions(child, level + 1, index + childIndex);
        positions.push(...childNodes);
      });
    }
    
    return positions;
  };

  // Update nodes when data changes
  useEffect(() => {
    if (!data) return;
    
    const newNodes = calculateNodePositions(data);
    setNodes(prev => {
      // Mark new nodes for animation
      return newNodes.map(node => ({
        ...node,
        isNew: !prev.find(p => p.id === node.id)
      }));
    });

    // Calculate connections
    const newConnections: Array<{from: string, to: string}> = [];
    const traverse = (node: MindMapNode) => {
      if (node.children) {
        node.children.forEach(child => {
          newConnections.push({ from: node.id, to: child.id });
          traverse(child);
        });
      }
    };
    traverse(data);
    setConnections(newConnections);

    // Remove isNew flag after animation
    setTimeout(() => {
      setNodes(prev => prev.map(node => ({ ...node, isNew: false })));
    }, 1000);
  }, [data]);

  const getNodePosition = (nodeId: string): NodePosition => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.position : { x: 0, y: 0 };
  };

  if (!data || nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Mind Map Yet</h3>
          <p className="text-muted-foreground">
            Start a conversation to generate your learning path visualization
          </p>
          {isStreaming && (
            <div className="mt-4 flex items-center justify-center gap-2 text-primary">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="text-sm font-medium ml-2">Generating mind map...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background to-muted/20">
      <div 
        ref={canvasRef}
        className="relative min-w-max min-h-max p-8"
        style={{ 
          width: Math.max(800, Math.max(...nodes.map(n => n.position.x)) + 300),
          height: Math.max(600, Math.max(...nodes.map(n => n.position.y)) + 200)
        }}
      >
        {/* Connection Lines */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          width="100%" 
          height="100%"
        >
          {connections.map((conn, index) => {
            const fromPos = getNodePosition(conn.from);
            const toPos = getNodePosition(conn.to);
            
            return (
              <line
                key={`${conn.from}-${conn.to}`}
                x1={fromPos.x + 120} // Adjust for node width
                y1={fromPos.y + 50}  // Adjust for node height
                x2={toPos.x}
                y2={toPos.y + 50}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2"
                strokeOpacity="0.3"
                className="animate-in draw-0 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              />
            );
          })}
        </svg>

        {/* Mind Map Nodes */}
        {nodes.map((node, index) => (
          <div
            key={node.id}
            className={cn(
              'absolute bg-background border-2 rounded-lg p-4 shadow-lg transition-all duration-500 hover:shadow-xl cursor-pointer group',
              node.isNew && 'animate-in zoom-in-50 fade-in duration-700',
              node.difficulty && DIFFICULTY_COLORS[node.difficulty],
              isStreaming && index === nodes.length - 1 && 'ring-2 ring-primary ring-opacity-50'
            )}
            style={{
              left: node.position.x,
              top: node.position.y,
              width: '240px',
              animationDelay: `${index * 150}ms`
            }}
          >
            {/* Node Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-sm leading-tight pr-2">{node.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                {node.level === 0 ? (
                  <Target className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Node Description */}
            {node.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {node.description}
              </p>
            )}

            {/* Node Metadata */}
            <div className="space-y-2">
              {node.estimatedHours && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{node.estimatedHours}h</span>
                </div>
              )}
              
              {node.skills && node.skills.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{node.skills.slice(0, 2).join(', ')}</span>
                  {node.skills.length > 2 && <span>+{node.skills.length - 2}</span>}
                </div>
              )}

              {node.difficulty && (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    DIFFICULTY_COLORS[node.difficulty]
                  )}>
                    {node.difficulty}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>0/{node.children?.length || 1}</span>
                </div>
              </div>
              <div className="mt-1 w-full bg-muted rounded-full h-1">
                <div className="bg-green-500 h-1 rounded-full w-0 transition-all duration-1000" />
              </div>
            </div>

            {/* Hover Effects */}
            <div className="absolute inset-0 bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <span className="text-sm font-medium">Building mind map...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}