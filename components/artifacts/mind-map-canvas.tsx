'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import { MindMapNode } from '@/types/artifacts';
import { Target, ArrowRight, Plus } from 'lucide-react';
import { MindMapNodeComponent } from './mind-map-node';
import { cn } from '@/lib/utils';
import { useArtifactStore } from '@/lib/artifact-store';

// Custom background component for learning path structure
const LearningPathBackground = ({ totalModules }: { totalModules: number }) => {
  if (totalModules === 0) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Learning path structure lines */}
      <svg className="w-full h-full">
        {/* Module level horizontal line */}
        <line
          x1="100"
          y1="300"
          x2={100 + totalModules * 400}
          y2="300"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        
        {/* Lesson level horizontal line */}
        <line
          x1="100"
          y1="500"
          x2={100 + Math.min(totalModules * 3, 10) * 300}
          y2="500"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
        
        {/* Vertical connection lines */}
        {Array.from({ length: totalModules }, (_, i) => (
          <line
            key={i}
            x1={100 + i * 400}
            y1="300"
            x2={100 + i * 400}
            y2="500"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}
      </svg>
    </div>
  );
};

interface MindMapCanvasProps {
  data: MindMapNode;
  isStreaming?: boolean;
}

const nodeTypes = {
  mindMapNode: MindMapNodeComponent,
};

export function MindMapCanvas({ data, isStreaming }: MindMapCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayoutCalculated, setIsLayoutCalculated] = useState(false);
  const { currentArtifact, updateArtifact, addModuleToMindmap } = useArtifactStore();

  // Calculate total modules and lessons for layout planning
  const getTotalModules = useCallback((node: MindMapNode): number => {
    if (!node.children) return 0;
    return node.children.length;
  }, []);

  const getTotalLessons = useCallback((node: MindMapNode): number => {
    if (!node.children) return 0;
    return node.children.reduce((total, child) => {
      return total + (child.children ? child.children.length : 0);
    }, 0);
  }, []);

  const totalModules = data ? getTotalModules(data) : 0;
  const totalLessons = data ? getTotalLessons(data) : 0;

  // Convert hierarchical data to React Flow nodes and edges with linear progression layout
  const convertToFlowData = useCallback((rootNode: MindMapNode) => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    
    // Layout configuration
    const MODULE_SPACING = 400; // Horizontal spacing between modules
    const LESSON_SPACING = 300; // Horizontal spacing between lessons
    const VERTICAL_SPACING = 200; // Vertical spacing between levels
    const START_X = 100; // Starting X position
    const START_Y = 100; // Starting Y position

    const addNode = (
      node: MindMapNode, 
      level: number = 0, 
      moduleIndex: number = 0, 
      lessonIndex: number = 0,
      parentId?: string
    ) => {
      let x = START_X, y = START_Y;
      
      if (level === 0) {
        // Root node (course title) at top center
        x = START_X + (totalModules * MODULE_SPACING) / 2;
        y = START_Y;
      } else if (level === 1) {
        // Module level - horizontal row below root
        x = START_X + moduleIndex * MODULE_SPACING;
        y = START_Y + VERTICAL_SPACING;
      } else if (level === 2) {
        // Lesson level - horizontal row below modules
        x = START_X + lessonIndex * LESSON_SPACING;
        y = START_Y + VERTICAL_SPACING * 2;
      }

      const flowNode: Node = {
        id: node.id,
        type: 'mindMapNode',
        position: { x, y },
        data: {
          ...node,
          isRoot: level === 0,
          level,
          moduleIndex: level === 1 ? moduleIndex + 1 : undefined,
          lessonIndex: level === 2 ? lessonIndex + 1 : undefined,
          isNew: false,
        },
        sourcePosition: level === 0 ? Position.Bottom : Position.Right,
        targetPosition: level === 0 ? Position.Top : Position.Left,
      };

      flowNodes.push(flowNode);

      // Add edges and process children
      if (node.children) {
        node.children.forEach((child, index) => {
          // Create edge from parent to child
          const edge: Edge = {
            id: `${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: 'smoothstep',
            animated: isStreaming,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            style: {
              strokeWidth: level === 0 ? 4 : 3,
              stroke: level === 0 ? '#6366f1' : '#94a3b8',
              strokeDasharray: level === 0 ? '0' : '5,5',
            },
            label: level === 0 ? '→' : '',
            labelStyle: {
              fill: level === 0 ? '#6366f1' : '#94a3b8',
              fontSize: 16,
              fontWeight: 'bold',
            },
            labelBgStyle: {
              fill: '#ffffff',
              fillOpacity: 0.8,
            },
            labelBgPadding: [4, 4],
            labelBgBorderRadius: 4,
          };
          flowEdges.push(edge);

          // Recursively add child nodes
          if (level === 0) {
            // Adding modules
            addNode(child, level + 1, index, 0, node.id);
          } else if (level === 1) {
            // Adding lessons under modules
            if (child.children) {
              child.children.forEach((lesson, lessonIdx) => {
                addNode(lesson, level + 1, moduleIndex, lessonIdx, child.id);
              });
            }
          }
        });
      }
    };

    addNode(rootNode);
    return { nodes: flowNodes, edges: flowEdges };
  }, [isStreaming, totalModules]);

  // Update flow data when mind map data changes
  useEffect(() => {
    if (!data) {
      setNodes([]);
      setEdges([]);
      setIsLayoutCalculated(false);
      return;
    }

    const { nodes: newNodes, edges: newEdges } = convertToFlowData(data);
    
    // Mark new nodes for animation
    const updatedNodes = newNodes.map(node => {
      const existingNode = nodes.find(n => n.id === node.id);
      return {
        ...node,
        data: {
          ...node.data,
          isNew: !existingNode,
        }
      };
    });

    setNodes(updatedNodes);
    setEdges(newEdges);
    setIsLayoutCalculated(true);

    // Remove isNew flag after animation
    setTimeout(() => {
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          data: { ...node.data, isNew: false }
        }))
      );
    }, 1000);
  }, [data, convertToFlowData]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle module editing events
  const handleModuleUpdated = useCallback((event: CustomEvent) => {
    const { moduleId, updatedModule } = event.detail;
    
    // Update the mindmap data
    const updateNodeInTree = (node: MindMapNode): MindMapNode => {
      if (node.id === moduleId) {
        return { ...node, ...updatedModule };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeInTree)
        };
      }
      return node;
    };

    const updatedData = updateNodeInTree(data);
    
    // Update the artifact store
    if (currentArtifact) {
      updateArtifact(currentArtifact.id, { data: updatedData });
    }
  }, [data, currentArtifact, updateArtifact]);

  const handleModuleDeleted = useCallback((event: CustomEvent) => {
    const { moduleId } = event.detail;
    
    // Remove the module from the mindmap data
    const removeNodeFromTree = (node: MindMapNode): MindMapNode | null => {
      if (node.children) {
        const filteredChildren = node.children
          .map(removeNodeFromTree)
          .filter((child): child is MindMapNode => child !== null);
        
        if (filteredChildren.length !== node.children.length) {
          return { ...node, children: filteredChildren };
        }
      }
      
      if (node.id === moduleId) {
        return null; // Remove this node
      }
      
      return node;
    };

    const updatedData = removeNodeFromTree(data);
    if (updatedData) {
      // Update the artifact store
      if (currentArtifact) {
        updateArtifact(currentArtifact.id, { data: updatedData });
      }
    }
  }, [data, currentArtifact, updateArtifact]);

  const handleModuleAddChild = useCallback(async (event: CustomEvent) => {
    const { parentId } = event.detail;
    
    const newChild: MindMapNode = {
      id: crypto.randomUUID(),
      title: 'New Lesson',
      description: 'Add a description for this lesson',
      level: 2, // Lessons are level 2
      difficulty: 'beginner',
      estimatedHours: 1,
      skills: [],
      prerequisites: [],
      children: []
    };
    
    // Use the new method to add the child module
    await addModuleToMindmap(parentId, newChild);
  }, [addModuleToMindmap]);

  // Fit view when layout is calculated
  useEffect(() => {
    if (isLayoutCalculated && nodes.length > 0) {
      // Automatically fit the view to show all nodes
      setTimeout(() => {
        const event = new CustomEvent('react-flow-fit-view');
        window.dispatchEvent(event);
      }, 100);
    }
  }, [isLayoutCalculated, nodes.length]);

  // Set up event listeners for module editing
  useEffect(() => {
    const handleModuleUpdatedEvent = (event: Event) => handleModuleUpdated(event as CustomEvent);
    const handleModuleDeletedEvent = (event: Event) => handleModuleDeleted(event as CustomEvent);
    const handleModuleAddChildEvent = (event: Event) => handleModuleAddChild(event as CustomEvent);

    window.addEventListener('module-updated', handleModuleUpdatedEvent);
    window.addEventListener('module-deleted', handleModuleDeletedEvent);
    window.addEventListener('module-add-child', handleModuleAddChildEvent);

    return () => {
      window.removeEventListener('module-updated', handleModuleUpdatedEvent);
      window.removeEventListener('module-deleted', handleModuleDeletedEvent);
      window.removeEventListener('module-add-child', handleModuleAddChildEvent);
    };
  }, [handleModuleUpdated, handleModuleDeleted, handleModuleAddChild]);

  const miniMapNodeColor = (node: Node) => {
    const difficulty = node.data.difficulty;
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#eab308';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Mind Map Yet</h3>
          <p className="text-muted-foreground max-w-md">
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
    <div className="h-full bg-gradient-to-br from-background to-muted/20 relative">
      {/* Learning Path Progress Indicator */}
      <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Learning Path</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Course</span>
            <ArrowRight className="h-3 w-3" />
            <span>Modules</span>
            <ArrowRight className="h-3 w-3" />
            <span>Lessons</span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Progress Indicator */}
      <div className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Progress:</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalModules, 5) }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full',
                  i === 0 ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
            {totalModules > 5 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{totalModules - 5}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Learning Path Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span>Course Start</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Module</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Lesson</span>
          </div>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.3,
          maxZoom: 1.2,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        className="bg-transparent"
      >
        <Background 
          color="#94a3b8" 
          gap={30} 
          size={1}
        />
        <Controls 
          className="bg-background border shadow-lg"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap 
          nodeColor={miniMapNodeColor}
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="bg-background border shadow-lg"
        />
        <LearningPathBackground totalModules={totalModules} />
      </ReactFlow>
      
      {/* Streaming Indicator */}
      {isStreaming && (
        <div className="absolute bottom-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
            <span className="text-sm font-medium">Building mind map...</span>
          </div>
        </div>
      )}

      {/* Add Module Button */}
      {!isStreaming && data && (
        <button
          onClick={async () => {
            const newModule: MindMapNode = {
              id: crypto.randomUUID(),
              title: 'New Module',
              description: 'Add a description for this module',
              level: 1,
              difficulty: 'beginner',
              estimatedHours: 2,
              skills: [],
              prerequisites: [],
              children: []
            };
            
            // Use the new method to add the module
            await addModuleToMindmap(null, newModule);
          }}
          className="absolute bottom-6 left-6 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Add New Module"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}