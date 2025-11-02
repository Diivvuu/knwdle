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
import { selectOrgTree } from '@workspace/state';
import { useTheme } from 'next-themes';

type OrgUnit = {
  id: string;
  name: string;
  type: string;
  children?: OrgUnit[];
};

const nodeWidth = 130;
const nodeHeight = 80;
const horizontalSpacing = 60;
const verticalSpacing = 50;

function getColors(type: string, isDark: boolean): string {
  const tone = isDark
    ? {
        ROOT: 'bg-sky-900 ring-sky-500 text-sky-100',
        DEPARTMENT: 'bg-green-900 ring-green-500 text-green-100',
        CLASS: 'bg-amber-900 ring-amber-500 text-amber-100',
        TEAM: 'bg-purple-900 ring-purple-500 text-purple-100',
        SUBTEAM: 'bg-pink-900 ring-pink-500 text-pink-100',
        DEFAULT: 'bg-gray-800 ring-gray-500 text-gray-100',
      }
    : {
        ROOT: 'bg-sky-200 ring-sky-400 text-sky-900',
        DEPARTMENT: 'bg-green-200 ring-green-400 text-green-900',
        CLASS: 'bg-amber-200 ring-amber-400 text-amber-900',
        TEAM: 'bg-purple-200 ring-purple-400 text-purple-900',
        SUBTEAM: 'bg-pink-200 ring-pink-400 text-pink-900',
        DEFAULT: 'bg-gray-200 ring-gray-400 text-gray-900',
      };

  type ToneKey = keyof typeof tone; 
  const key = type.toUpperCase() as ToneKey;

  // ✅ type-safe lookup with fallback
  return tone[key] ?? tone.DEFAULT;
}

function buildNodesAndEdges(
  tree: OrgUnit[],
  isDark: boolean,
  onNodeClick?: (id: string) => void,
  xStart = 0,
  yStart = 0,
  nodes: Node[] = [],
  edges: Edge[] = []
): { nodes: Node[]; edges: Edge[]; width: number } {
  let currentX = xStart;
  let maxWidth = 0;

  for (const unit of tree) {
    let childrenWidth = 0;
    if (unit.children?.length) {
      const res = buildNodesAndEdges(unit.children, isDark, onNodeClick, currentX, yStart + nodeHeight + verticalSpacing, nodes, edges);
      childrenWidth = res.width;
    } else {
      childrenWidth = nodeWidth;
    }

    const nodeX = currentX + childrenWidth / 2 - nodeWidth / 2;
    const nodeY = yStart;
    const colors = getColors(unit.type, isDark);

    nodes.push({
      id: unit.id,
      type: 'default',
      data: {
        label: (
          <div
            onClick={() => onNodeClick?.(unit.id)}
            className={`p-3 rounded-lg border-2 border-dashed ring-2 ring-offset-2 ${colors} cursor-pointer select-none hover:scale-[1.03] transition-transform`}
            style={{ width: nodeWidth, height: nodeHeight, textAlign: 'center' }}
          >
            <div className="font-bold text-lg truncate">{unit.name}</div>
            <div className="text-xs uppercase tracking-wide">{unit.type}</div>
          </div>
        ),
      },
      position: { x: nodeX, y: nodeY },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    if (unit.children?.length) {
      for (const child of unit.children) {
        edges.push({
          id: `e-${unit.id}-${child.id}`,
          source: unit.id,
          target: child.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: isDark ? '#9ca3af' : '#94a3b8' },
          style: {
            stroke: isDark ? '#9ca3af' : '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '6 4',
          },
        });
      }
    }

    currentX += childrenWidth + horizontalSpacing;
    maxWidth = Math.max(maxWidth, currentX - xStart);
  }

  return { nodes, edges, width: maxWidth };
}

export default function OrgGraphView({ onNodeClick }: { onNodeClick?: (id: string) => void }) {
  const tree = useSelector(selectOrgTree);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { nodes, edges } = useMemo(() => buildNodesAndEdges(tree ?? [], isDark, onNodeClick), [tree, isDark, onNodeClick]);

  if (!tree?.length)
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
        No organisation units to display.
      </div>
    );

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        connectionLineType={ConnectionLineType.SmoothStep}
        style={{ background: isDark ? '#0f172a' : '#f9fafb', borderRadius: 8 }}
      >
        <Background color={isDark ? '#475569' : '#cbd5e1'} gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}