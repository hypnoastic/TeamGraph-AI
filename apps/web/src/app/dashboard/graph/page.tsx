"use client";

import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Panel,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Activity, Clock, Filter, Layers, Database, Search, TerminalSquare, Info, X } from 'lucide-react';

// Zep AI / Obsidian Neural Style Nodes
const initialNodes: Node[] = [
  { id: 'org_acme', position: { x: 400, y: 100 }, data: { label: 'Acme Corp', type: 'Entity' }, style: { background: '#161618', color: '#E5E2E1', border: '1px solid #262629', borderRadius: '4px', width: 140, padding: 10, fontSize: '12px', fontFamily: 'var(--font-geist-sans)' } },
  { id: 'usr_alice', position: { x: 200, y: 250 }, data: { label: 'Alice (Engineer)', type: 'Entity' }, style: { background: '#161618', color: '#E5E2E1', border: '1px solid #262629', borderRadius: '4px', width: 140, padding: 10, fontSize: '12px' } },
  { id: 'ep_1', position: { x: 300, y: 400 }, data: { label: 'Auth Discussion', type: 'Episodic' }, style: { background: '#0A0A0B', color: '#00F5D4', border: '1px solid rgba(0, 245, 212, 0.3)', borderRadius: '100px', width: 130, padding: 8, fontSize: '11px', textAlign: 'center', boxShadow: '0 0 10px rgba(0,245,212,0.1)' } },
  { id: 'ep_2', position: { x: 500, y: 250 }, data: { label: 'Q3 Planning', type: 'Episodic' }, style: { background: '#0A0A0B', color: '#00F5D4', border: '1px solid rgba(0, 245, 212, 0.3)', borderRadius: '100px', width: 120, padding: 8, fontSize: '11px', textAlign: 'center' } },
  { id: 'concept_jwt', position: { x: 200, y: 550 }, data: { label: 'JWT Tokens', type: 'Concept' }, style: { background: '#161618', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', width: 110, padding: 8, fontSize: '11px' } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'org_acme', target: 'usr_alice', label: 'EMPLOYES', style: { stroke: '#46464A' }, labelStyle: { fill: '#919094', fontSize: 10 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#46464A' } },
  { id: 'e2', source: 'org_acme', target: 'ep_2', label: 'HOSTS', style: { stroke: '#46464A' }, labelStyle: { fill: '#919094', fontSize: 10 } },
  { id: 'e3', source: 'usr_alice', target: 'ep_1', label: 'PARTICIPATED_IN', animated: true, style: { stroke: '#00F5D4', strokeWidth: 1.5 } },
  { id: 'e4', source: 'ep_1', target: 'concept_jwt', label: 'MENTIONS', animated: true, style: { stroke: '#10B981', strokeWidth: 1.5 } },
];

export default function GraphExplorerPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsInspectorOpen(true);
  };

  return (
    <div className="h-[calc(100vh-64px)] -m-8 flex flex-col bg-[var(--color-background-base)] font-sans relative">
      
      {/* Top Bar Filters (Graph Evolution) */}
      <div className="h-14 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-6 bg-[var(--color-background-surface)] z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[var(--color-text-primary)] font-medium text-sm">
            <Layers size={16} className="text-[var(--color-accent-brain)]" />
            <span>Knowledge Graph</span>
          </div>
          <div className="h-4 w-px bg-[var(--color-border-subtle)] mx-2"></div>
          
          <button className="flex items-center space-x-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-1 rounded bg-[var(--color-card-base)] border border-[var(--color-border-subtle)]">
            <Filter size={14} />
            <span>Episodic + Entity</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Time Series Slider Fake */}
          <div className="flex items-center space-x-3 bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] px-3 py-1.5 rounded-md">
            <Clock size={14} className="text-[var(--color-text-secondary)]" />
            <span className="text-xs text-[var(--color-text-secondary)] font-mono">T-Minus: 30 Days</span>
            <input type="range" className="w-32 accent-[var(--color-accent-brain)] h-1 bg-[var(--color-border-subtle)] rounded-lg appearance-none cursor-pointer" />
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input type="text" placeholder="Search nodes..." className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] rounded-md pl-8 pr-3 py-1.5 text-xs text-[var(--color-text-primary)] w-48 focus:border-[var(--color-accent-brain)] outline-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Main Canvas */}
        <div className="flex-1 relative">
          {/* Edge Fade / Vignette */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(5,5,5,1)] z-10"></div>
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
            colorMode="dark"
            className="bg-[var(--color-background-base)]"
          >
            <Background color="#262629" gap={24} size={1} />
            <Controls className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] fill-[var(--color-text-primary)] shadow-lg" showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Right Drawer (Inspector) */}
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
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent-brain)]"></span>
                    <span className="text-[10px] font-mono uppercase text-[var(--color-accent-brain)]">{selectedNode.data.type as string} NODE</span>
                  </div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)]">{selectedNode.data.label as string}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-mono">ID: {selectedNode.id}</p>
                </div>

                <div className="p-4">
                  <div className="flex border-b border-[var(--color-border-subtle)] mb-4">
                    <button className="text-xs font-medium text-[var(--color-accent-brain)] border-b-2 border-[var(--color-accent-brain)] pb-2 px-2">Details</button>
                    <button className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] pb-2 px-4">Live Logs</button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[var(--color-card-base)] rounded border border-[var(--color-border-subtle)] p-3">
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase mb-1">Properties</div>
                      <div className="font-mono text-xs text-[var(--color-text-primary)]">
                        <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                          <span className="text-[var(--color-text-secondary)]">created_at</span>
                          <span>2026-06-12</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                          <span className="text-[var(--color-text-secondary)]">confidence</span>
                          <span className="text-[var(--color-accent-safe)]">0.98</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[var(--color-text-secondary)]">source</span>
                          <span>Slack_Channel_X</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase mb-2">Connected Edges</div>
                      {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => (
                        <div key={e.id} className="text-xs bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] p-2 rounded mb-2 flex items-center justify-between">
                          <span className="font-mono text-[var(--color-text-secondary)]">{e.label}</span>
                          <span className="truncate w-24 text-right text-[var(--color-text-primary)]">{e.source === selectedNode.id ? e.target : e.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] p-6 text-center">
                <Database size={32} className="mb-4 opacity-50" />
                <p className="text-sm">Select a node on the canvas to view details and live logs.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
