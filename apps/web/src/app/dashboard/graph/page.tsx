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
import { Clock3, Database, Layers3, Orbit, TerminalSquare } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet } from '@/lib/api';
import type { GraphVisualization } from '@/lib/types';

const colorByType: Record<string, { border: string; text: string; background: string; glow: string }> = {
  organization: { border: '#00F5D4', text: '#E5E2E1', background: '#0D1213', glow: '0 0 0 1px rgba(0,245,212,0.15)' },
  project: { border: '#10B981', text: '#E5E2E1', background: '#0E1613', glow: '0 0 0 1px rgba(16,185,129,0.16)' },
  user: { border: '#60A5FA', text: '#E5E2E1', background: '#101620', glow: '0 0 0 1px rgba(96,165,250,0.16)' },
  context: { border: '#F59E0B', text: '#F8F3E8', background: '#1A1410', glow: '0 0 0 1px rgba(245,158,11,0.18)' },
  episode: { border: '#F43F5E', text: '#FFE7ED', background: '#1D1116', glow: '0 0 0 1px rgba(244,63,94,0.18)' },
};

function mapNodes(nodes: GraphVisualization['nodes']): Node[] {
  return nodes.map((node, index) => {
    const palette = colorByType[node.type] || colorByType.context;
    return {
      id: node.id,
      position: {
        x: 120 + (index % 4) * 250,
        y: 120 + Math.floor(index / 4) * 170,
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
        boxShadow: palette.glow,
        borderRadius: node.type === 'episode' ? '24px' : '18px',
        width: node.type === 'episode' ? 190 : 210,
        padding: 16,
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
    style: { stroke: '#3A3B40', strokeWidth: 1.2 },
    labelStyle: { fill: '#8A8B90', fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3A3B40' },
  }));
}

export default function GraphExplorerPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [graphData, setGraphData] = useState<GraphVisualization | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    apiGet<GraphVisualization>('/graph/visualization')
      .then((data) => {
        setGraphData(data);
        setNodes(mapNodes(data.nodes));
        setEdges(mapEdges(data.edges));
      })
      .catch(() => {
        setGraphData({ nodes: [], edges: [], timeline: [] });
        setNodes([]);
        setEdges([]);
      });
  }, [setEdges, setNodes]);

  const nodeMeta = useMemo(() => selectedNode?.data?.meta as Record<string, any> | undefined, [selectedNode]);
  const episodeCount = graphData?.nodes.filter((node) => node.type === 'episode').length ?? 0;
  const contextCount = graphData?.nodes.filter((node) => node.type === 'context').length ?? 0;

  return (
    <PageShell
      eyebrow="Graphiti visualization"
      title="Live memory canvas"
      description="A normalized Graphiti-oriented view of episodes, contexts, projects, and users. The left canvas shows graph structure; the right rail highlights recent memory events and node-level metadata."
      actions={
        <div className="flex gap-3">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] px-4 py-3 text-xs">
            <div className="text-[var(--color-text-muted)] uppercase tracking-[0.22em]">Contexts</div>
            <div className="mt-1 text-lg">{contextCount}</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] px-4 py-3 text-xs">
            <div className="text-[var(--color-text-muted)] uppercase tracking-[0.22em]">Episodes</div>
            <div className="mt-1 text-lg">{episodeCount}</div>
          </div>
        </div>
      }
    >
      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] overflow-hidden min-h-[760px]">
          <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <Orbit size={16} className="text-[var(--color-accent-brain)]" />
              <span>Graph structure</span>
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Episodes are highlighted in rose; curated context is amber.</div>
          </div>
          <div className="h-[700px] relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => setSelectedNode(node)}
              fitView
              colorMode="dark"
              className="bg-[linear-gradient(180deg,_rgba(8,10,12,0.98),_rgba(10,12,15,0.98))]"
            >
              <Background color="#1F2329" gap={28} size={1} />
              <Controls className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] fill-[var(--color-text-primary)] shadow-lg" showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] p-6">
            <div className="flex items-center gap-2 text-sm mb-4">
              <Clock3 size={16} className="text-[var(--color-accent-brain)]" />
              <span>Recent memory events</span>
            </div>
            <div className="space-y-3">
              {graphData?.timeline?.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    const matchingNode = nodes.find((node) => node.id === item.id);
                    if (matchingNode) setSelectedNode(matchingNode);
                  }}
                  className="w-full text-left rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-background-surface)] p-4 hover:border-[rgba(0,245,212,0.2)] transition-colors"
                >
                  <div className="text-sm font-medium">{item.title}</div>
                  {item.summary && <div className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-3">{item.summary}</div>}
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{item.projectName || 'No project'}</span>
                    <span>{item.sourceType || 'seed'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] p-6">
            <div className="flex items-center gap-2 text-sm mb-4">
              <TerminalSquare size={16} className="text-[var(--color-accent-brain)]" />
              <span>Inspector</span>
            </div>
            {selectedNode ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-background-surface)] p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                    {String(selectedNode.data.type).toUpperCase()}
                  </div>
                  <div className="mt-2 text-xl font-medium">{String(selectedNode.data.label)}</div>
                  <div className="mt-2 text-xs text-[var(--color-text-muted)] break-all">{selectedNode.id}</div>
                </div>

                <div className="space-y-2">
                  {Object.entries(nodeMeta || {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-background-surface)] px-4 py-3 flex items-start justify-between gap-4 text-sm"
                    >
                      <span className="text-[var(--color-text-muted)]">{key}</span>
                      <span className="text-right break-all">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-8 text-center text-[var(--color-text-muted)]">
                <Database size={28} className="mx-auto mb-3 opacity-40" />
                Select a node or timeline event to inspect Graphiti-adjacent metadata.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] p-6">
            <div className="flex items-center gap-2 text-sm mb-4">
              <Layers3 size={16} className="text-[var(--color-accent-brain)]" />
              <span>Legend</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(colorByType).map(([type, palette]) => (
                <div key={type} className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-background-surface)] p-3">
                  <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: palette.border }} />
                  <div className="text-sm font-medium capitalize">{type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
