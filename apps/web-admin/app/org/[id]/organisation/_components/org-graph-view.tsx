'use client';
import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  Node,
  Position,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

type OrgUnit = {
  id: string;
  name: string;
  type: string;
  children?: OrgUnit[];
};

const nodeWidth = 180;
const nodeHeight = 80;
const horizontalSpacing = 60;
const verticalSpacing = 50;

function getCrayonBgByType(type: string) {
  switch (type.toUpperCase()) {
    case 'ROOT':
      return 'bg-sky-200 shadow-[inset_0_0_3px_rgba(0,0,0,0.2)] ring-2 ring-offset-2 ring-offset-white ring-sky-400';
    case 'DEPARTMENT':
      return 'bg-green-200 shadow-[inset_0_0_3px_rgba(0,0,0,0.2)] ring-2 ring-offset-2 ring-offset-white ring-green-400';
    case 'CLASS':
      return 'bg-amber-200 shadow-[inset_0_0_3px_rgba(0,0,0,0.2)] ring-2 ring-offset-2 ring-offset-white ring-amber-400';
    case 'TEAM':
      return 'bg-purple-200 shadow-[inset_0_0_3px_rgba(0,0,0,0.2)] ring-2 ring-offset-2 ring-offset-white ring-purple-400';
    case 'SUBTEAM':
      return 'bg-pink-200 shadow-[inset_0_0_3px_rgba(0,0,0,0.2)] ring-2 ring-offset-2 ring-offset-white ring-pink-400';
    default:
      return 'bg-gray-200 shadow-[inset_0_0_3px_rgba(0,0,0,0.2)] ring-2 ring-offset-2 ring-offset-white ring-gray-400';
  }
}

function getTextOutlineByType(type: string) {
  switch (type.toUpperCase()) {
    case 'ROOT':
      return 'text-sky-900';
    case 'DEPARTMENT':
      return 'text-green-900';
    case 'CLASS':
      return 'text-amber-900';
    case 'TEAM':
      return 'text-purple-900';
    case 'SUBTEAM':
      return 'text-pink-900';
    default:
      return 'text-gray-900';
  }
}

function buildNodesAndEdges(
  tree: OrgUnit[],
  xStart = 0,
  yStart = 0,
  level = 0,
  positions: Record<string, { x: number; y: number }> = {},
  nodes: Node[] = [],
  edges: Edge[] = []
): { nodes: Node[]; edges: Edge[]; width: number } {
  let currentX = xStart;
  let maxWidth = 0;

  for (const unit of tree) {
    // Calculate children layout recursively
    let childrenWidth = 0;
    if (unit.children && unit.children.length > 0) {
      const childResult = buildNodesAndEdges(
        unit.children,
        currentX,
        yStart + nodeHeight + verticalSpacing,
        level + 1,
        positions,
        nodes,
        edges
      );
      childrenWidth = childResult.width;
    } else {
      childrenWidth = nodeWidth;
    }

    // Position this node in the middle of its children or at currentX if no children
    const nodeX = currentX + childrenWidth / 2 - nodeWidth / 2;
    const nodeY = yStart;

    positions[unit.id] = { x: nodeX, y: nodeY };
    nodes.push({
      id: unit.id,
      type: 'default',
      data: {
        label: (
          <div
            className={`p-3 rounded-lg border-2 border-dashed ${getCrayonBgByType(
              unit.type
            )} cursor-default select-none`}
            style={{
              width: nodeWidth  ,
              height: nodeHeight,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              borderRadius: 12,
              borderColor: 'transparent',
              boxShadow: 'none',
              filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.1))',
            }}
          >
            <div
              className={`font-bold text-lg truncate ${getTextOutlineByType(
                unit.type
              )}`}
            >
              {unit.name}
            </div>
            <div
              className={`text-xs uppercase tracking-wide ${getTextOutlineByType(
                unit.type
              )}`}
            >
              {unit.type}
            </div>
          </div>
        ),
      },
      position: { x: nodeX, y: nodeY },
      style: {
        width: nodeWidth,
        height: nodeHeight,
        borderRadius: 12,
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    // create edges from this node to children
    if (unit.children && unit.children.length > 0) {
      for (const child of unit.children) {
        edges.push({
          id: `e-${unit.id}-${child.id}`,
          source: unit.id,
          target: child.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '6 4',
          },
          animated: false,
        });
      }
    }

    currentX += childrenWidth + horizontalSpacing;
    maxWidth = Math.max(maxWidth, currentX - xStart);
  }

  return { nodes, edges, width: maxWidth };
}

const OrgGraphView = () => {
  const tree = useSelector((state: RootState) => state.orgUnit.tree);

  // Always call hooks — even if tree is empty
  const { nodes, edges } = useMemo(() => {
    return buildNodesAndEdges(tree ?? []);
  }, [tree]);

  if (!tree || tree.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
        No organization units to display.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        zoomOnScroll
        zoomOnPinch
        panOnScroll
        panOnDrag
        nodesDraggable={false}
        nodesConnectable={false}
        connectionLineType={ConnectionLineType.SmoothStep}
        style={{ background: '#f9fafb', borderRadius: 8 }}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default OrgGraphView;
