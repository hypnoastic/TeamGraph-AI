"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Layers, TerminalSquare, X } from 'lucide-react';

import { apiGet } from '@/lib/api';
import type { GraphVisualization } from '@/lib/types';

const colorByType: Record<string, { border: string; text: string; background: string }> = {
  organization: { border: '#00F5D4', text: '#E5E2E1', background: '#0E1113' },
  project: { border: '#10B981', text: '#E5E2E1', background: '#121716' },
  user: { border: '#60A5FA', text: '#E5E2E1', background: '#11161C' },
  context: { border: '#A78BFA', text: '#E5E2E1', background: '#15131A' },
  episode: { border: '#F59E0B', text: '#FDE68A', background: '#17140E' },
};

function mapNodes(nodes: GraphVisualization['nodes']): Node[] {
  return nodes.map((node, index) => {
    const palette = colorByType[node.type] || colorByType.context;
    return {
      id: node.id,
      position: {
        x: 180 + (index % 4) * 220,
        y: 100 + Math.floor(index / 4) * 150,
      },
      data: {
        label: node.label,
        type: node.type,
        meta: node.meta || {},
      },
      style: {
        background: palette.background,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        borderRadius: node.type === 'episode' ? '999px' : '8px',
        width: node.type === 'episode' ? 160 : 180,
        padding: 12,
        fontSize: '12px',
      },
    };
  });
}

function mapEdges(edges: GraphVisualization['edges']): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    style: { stroke: '#46464A' },
    labelStyle: { fill: '#919094', fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#46464A' },
  }));
}

export default function GraphExplorerPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    apiGet<GraphVisualization>('/graph/visualization')
      .then((data) => {
        setNodes(mapNodes(data.nodes));
        setEdges(mapEdges(data.edges));
      })
      .catch(() => {
        setNodes([]);
        setEdges([]);
      });
  }, [setEdges, setNodes]);

  const nodeMeta = useMemo(() => selectedNode?.data?.meta as Record<string, any> | undefined, [selectedNode]);

  return (
    <div className="h-[calc(100vh-64px)] -m-8 flex flex-col bg-[var(--color-background-base)] font-sans relative">
      <div className="h-14 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-6 bg-[var(--color-background-surface)] z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[var(--color-text-primary)] font-medium text-sm">
            <Layers size={16} className="text-[var(--color-accent-brain)]" />
            <span>Knowledge Graph</span>
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">Normalized TeamGraph + Graphiti view</div>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 relative">
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(5,5,5,1)] z-10" />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => {
              setSelectedNode(node);
              setIsInspectorOpen(true);
            }}
            fitView
            colorMode="dark"
            className="bg-[var(--color-background-base)]"
          >
            <Background color="#262629" gap={24} size={1} />
            <Controls className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] fill-[var(--color-text-primary)] shadow-lg" showInteractive={false} />
          </ReactFlow>
        </div>

        {isInspectorOpen && (
          <div className="w-80 border-l border-[var(--color-border-subtle)] bg-[var(--color-background-surface)] flex flex-col shadow-2xl z-20 transition-all duration-300">
            <div className="h-12 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-4">
              <span className="text-xs font-bold tracking-wider uppercase text-[var(--color-text-secondary)] flex items-center">
                <TerminalSquare size={14} className="mr-2" /> Inspector
              </span>
              <button onClick={() => setIsInspectorOpen(false)} className="text-[var(--color-text-secondary)] hover:text-white">
                <X size={16} />
              </button>
            </div>

            {selectedNode ? (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-[var(--color-border-subtle)]">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent-brain)]" />
                    <span className="text-[10px] font-mono uppercase text-[var(--color-accent-brain)]">
                      {String(selectedNode.data.type).toUpperCase()} NODE
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)]">{String(selectedNode.data.label)}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-mono">ID: {selectedNode.id}</p>
                </div>

                <div className="p-4 space-y-4">
                  <div className="bg-[var(--color-card-base)] rounded border border-[var(--color-border-subtle)] p-3">
                    <div className="text-[10px] text-[var(--color-text-muted)] uppercase mb-2">Properties</div>
                    <div className="space-y-2 text-xs text-[var(--color-text-primary)]">
                      {Object.entries(nodeMeta || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-2">
                          <span className="text-[var(--color-text-secondary)]">{key}</span>
                          <span className="text-right break-all">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[var(--color-text-muted)] uppercase mb-2">Connected Edges</div>
                    {edges
                      .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
                      .map((edge) => (
                        <div
                          key={edge.id}
                          className="text-xs bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] p-2 rounded mb-2 flex items-center justify-between"
                        >
                          <span className="font-mono text-[var(--color-text-secondary)]">{edge.label}</span>
                          <span className="truncate w-24 text-right text-[var(--color-text-primary)]">
                            {edge.source === selectedNode.id ? edge.target : edge.source}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] p-6 text-center">
                <Database size={32} className="mb-4 opacity-50" />
                <p className="text-sm">Select a node to inspect its TeamGraph and Graphiti metadata.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
