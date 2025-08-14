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
import { Target } from 'lucide-react';
import { MindMapNodeComponent } from './mind-map-node';

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

  // Convert hierarchical data to React Flow nodes and edges
  const convertToFlowData = useCallback((rootNode: MindMapNode) => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    
    const addNode = (node: MindMapNode, level: number = 0, parentPos?: { x: number; y: number }, siblingIndex: number = 0, totalSiblings: number = 1) => {
      // Calculate position using radial layout for better mind map appearance
      let x = 0, y = 0;
      
      if (level === 0) {
        // Root node at center
        x = 0;
        y = 0;
      } else if (level === 1) {
        // First level in circle around root
        const angle = (siblingIndex / totalSiblings) * 2 * Math.PI;
        const radius = 300;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      } else {
        // Subsequent levels branch out
        const baseAngle = parentPos ? Math.atan2(parentPos.y, parentPos.x) : 0;
        const spreadAngle = Math.PI / 4; // 45 degree spread
        const angle = baseAngle + (siblingIndex - (totalSiblings - 1) / 2) * (spreadAngle / Math.max(1, totalSiblings - 1));
        const radius = 200 + level * 100;
        x = (parentPos?.x || 0) + Math.cos(angle) * radius;
        y = (parentPos?.y || 0) + Math.sin(angle) * radius;
      }

      const flowNode: Node = {
        id: node.id,
        type: 'mindMapNode',
        position: { x, y },
        data: {
          ...node,
          isRoot: level === 0,
          level,
          isNew: false, // Will be set later for animation
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
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
              width: 15,
              height: 15,
            },
            style: {
              strokeWidth: 2,
              stroke: level === 0 ? '#6366f1' : '#94a3b8',
            },
          };
          flowEdges.push(edge);

          // Recursively add child nodes
          addNode(child, level + 1, { x, y }, index, node.children!.length);
        });
      }
    };

    addNode(rootNode);
    return { nodes: flowNodes, edges: flowEdges };
  }, [isStreaming]);

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
    <div className="h-full bg-gradient-to-br from-background to-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-transparent"
      >
        <Background 
          color="#94a3b8" 
          gap={20} 
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
    </div>
  );
}