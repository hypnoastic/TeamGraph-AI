"use client";

import { Background, Controls, Edge, MarkerType, MiniMap, Node, NodeChange, EdgeChange, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiGet } from "@/lib/api";
import type { GraphVisualization, JsonObject } from "@/lib/types";
import { useEdgesState, useNodesState } from "@xyflow/react";

const palettes: Record<string, string> = {
  organization: "#9B5DE5",
  project: "#45D7E8",
  user: "#FFD84D",
  context: "#B9F227",
  episode: "#FF6B5F",
  entity: "#7B68EE",
};

function graphNodes(input: GraphVisualization["nodes"]): Node[] {
  const count = Math.max(input.length, 1);
  const cols = Math.ceil(Math.sqrt(count));
  const spacingX = 240;
  const spacingY = 150;

  return input.map((node, index) => ({
    id: node.id,
    position: { x: 40 + (index % cols) * spacingX, y: 40 + Math.floor(index / cols) * spacingY },
    data: { label: node.label, type: node.type, meta: node.meta || {} },
    style: {
      background: palettes[node.type] || "#FFFDF8",
      border: "2px solid #111",
      borderRadius: 2,
      boxShadow: "5px 5px 0 #111",
      color: "#111",
      fontWeight: 800,
      width: 190,
      padding: 14,
    },
  }));
}

function graphEdges(input: GraphVisualization["edges"]): Edge[] {
  return input.map((edge) => ({
    ...edge,
    style: { stroke: "#111", strokeWidth: 2 },
    labelStyle: { fill: "#111", fontWeight: 700, fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#111" },
  }));
}

function GraphCanvas({
  nodes,
  edges,
  loading,
  onNodeClick,
  onNodesChange,
  onEdgesChange,
}: {
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
  onNodeClick: (node: Node) => void;
  onNodesChange: (changes: NodeChange<Node>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
}) {
  const { fitView } = useReactFlow();

  const fitGraph = useCallback(() => {
    fitView({ padding: 0.18, minZoom: 0.04, maxZoom: 1.2, duration: 350 });
  }, [fitView]);

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      const timer = window.setTimeout(fitGraph, 80);
      return () => window.clearTimeout(timer);
    }
  }, [loading, nodes, fitGraph]);

  return (
    <>
      {loading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--surface)]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-[var(--cyan)]" />
          <p className="mt-4 font-bold text-black">Loading Graphiti graph...</p>
        </div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onNodeClick(node)}
        minZoom={0.04}
        maxZoom={2}
        fitView
        style={{ width: "100%", height: "100%" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#111" gap={28} size={1.3} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          nodeColor={(node) => palettes[String(node.data?.type)] || "#FFFDF8"}
          maskColor="rgba(17, 17, 17, 0.12)"
          pannable
          zoomable
          style={{ border: "2px solid #111", borderRadius: 2 }}
        />
      </ReactFlow>
      {!loading && nodes.length > 0 && (
        <button
          type="button"
          onClick={fitGraph}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 border-2 border-black bg-[var(--lime)] px-3 py-2 text-xs font-bold shadow-[3px_3px_0_#111]"
        >
          <Maximize2 size={14} /> Fit graph
        </button>
      )}
    </>
  );
}

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selected, setSelected] = useState<Node | null>(null);
  const [timeline, setTimeline] = useState<GraphVisualization["timeline"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<GraphVisualization>("/graph/visualization", true, true)
      .then((data) => {
        setNodes(graphNodes(data.nodes));
        setEdges(graphEdges(data.edges));
        setTimeline(data.timeline);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setEdges, setNodes]);

  const meta = (selected?.data.meta || {}) as JsonObject;

  return (
    <PageShell title="Graph explorer" actions={<span className="badge badge-live">{nodes.length} Graphiti nodes</span>}>
      <div className="grid gap-6 xl:grid-cols-[1fr_310px]">
        <div className="panel relative h-[680px] overflow-hidden bg-[var(--surface)]">
          <ReactFlowProvider>
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              loading={loading}
              onNodeClick={setSelected}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
            />
          </ReactFlowProvider>
        </div>
        <aside className="space-y-5">
          <section className="panel p-4">
            <h2 className="border-b-2 border-black pb-3 font-black">Inspector</h2>
            {selected ? (
              <div className="pt-4">
                <span className="badge" style={{ background: palettes[String(selected.data.type)] }}>
                  {String(selected.data.type)}
                </span>
                <h3 className="mt-3 text-xl font-black">{String(selected.data.label)}</h3>
                {Object.entries(meta)
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <div key={key} className="mt-3 border-t border-black/30 pt-2 text-xs">
                      <b>{key}</b>
                      <div className="mono mt-1 break-all text-[10px]">{String(value)}</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty-state mt-4">Select a node.</div>
            )}
          </section>
          <section className="panel max-h-80 overflow-y-auto p-4">
            <h2 className="mb-3 font-black">Timeline</h2>
            {timeline.slice(0, 8).map((item) => (
              <button key={item.id} className="block w-full border-t border-black/30 py-3 text-left">
                <b className="text-sm">{item.title}</b>
                <div className="mono text-[10px]">{item.projectName || "Organization"}</div>
              </button>
            ))}
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
