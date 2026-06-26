"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowRight, 
  Brain, 
  Network, 
  ShieldCheck, 
  Plug, 
  Settings, 
  Sparkles, 
  Lock, 
  Layers, 
  GitPullRequest, 
  Mail, 
  FileText,
  ChevronDown,
  ChevronRight,
  Database
} from "lucide-react";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const pipelineSteps = [
    {
      title: "1. Connect Adapters",
      description: "Connect GitHub, Slack, Gmail, or Google Drive via secure OAuth in one click.",
      color: "bg-[var(--cyan)]",
      icon: Plug,
      preview: (
        <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0_black] flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <span className="font-black text-sm">OAuth Integrations</span>
            <span className="badge badge-live">Live</span>
          </div>
          <div className="flex items-center gap-2 p-2 border border-black bg-[var(--lime)] font-bold text-xs text-black">
            <Mail size={14} /> Gmail Connected
          </div>
          <div className="flex items-center gap-2 p-2 border border-black bg-[var(--yellow)] font-bold text-xs text-black">
            <GitPullRequest size={14} /> GitHub Connected
          </div>
        </div>
      )
    },
    {
      title: "2. Automatic Safety Check",
      description: "Incoming text is scanned for secrets, credentials, and API keys. AI tags risk factors.",
      color: "bg-[var(--purple)] text-white",
      icon: ShieldCheck,
      preview: (
        <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0_black] flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <span className="font-black text-sm text-black">Safety Boundary</span>
            <span className="badge badge-danger text-black">Scanning</span>
          </div>
          <div className="font-mono text-[10px] text-red-600 border border-red-200 bg-red-50 p-2 rounded">
            <div>[WARNING] API Key detected: tg_live_xxx</div>
            <div className="font-bold mt-1">Status: Blocked & flagged for admin review</div>
          </div>
        </div>
      )
    },
    {
      title: "3. Admin Review (HITL)",
      description: "Organization administrators approve, reject, or edit context before it enters the brain.",
      color: "bg-[var(--yellow)]",
      icon: Settings,
      preview: (
        <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0_black] flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <span className="font-black text-sm">Approvals Queue</span>
            <span className="badge badge-review">1 Pending</span>
          </div>
          <div className="p-2 border border-black bg-[var(--paper)] text-xs">
            <div className="font-bold text-[10px] opacity-60">PROPOSED CONTEXT</div>
            <p className="font-medium text-[11px] truncate">Database connection URI for staging...</p>
            <div className="flex gap-1.5 mt-2">
              <button disabled className="bg-[var(--coral)] text-white text-[9px] font-black border border-black px-1.5 py-0.5 shadow-[1px_1px_0_black]">REJECT</button>
              <button disabled className="bg-[var(--lime)] text-black text-[9px] font-black border border-black px-1.5 py-0.5 shadow-[1px_1px_0_black]">APPROVE</button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "4. Graphiti Indexing",
      description: "Approved items are ingested into Neo4j using Graphiti, linking temporal events and facts.",
      color: "bg-[var(--lime)]",
      icon: Network,
      preview: (
        <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0_black] flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-black/10 pb-2">
            <span className="font-black text-sm">Temporal Graph</span>
            <span className="badge bg-[var(--purple)] text-white">Indexed</span>
          </div>
          <div className="flex justify-center py-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[var(--purple)] flex items-center justify-center text-white text-[8px] font-bold">U</div>
              <div className="w-6 border-b-2 border-black border-dashed" />
              <div className="w-5 h-5 rounded-full bg-[var(--cyan)] flex items-center justify-center text-black text-[8px] font-bold">P</div>
              <div className="w-6 border-b-2 border-black border-dashed" />
              <div className="w-5 h-5 rounded-full bg-[var(--yellow)] flex items-center justify-center text-black text-[8px] font-bold">F</div>
            </div>
          </div>
          <div className="font-mono text-[9px] text-center opacity-75 text-black">{"Created link: USER -> WORKSPACE -> FACT"}</div>
        </div>
      )
    }
  ];

  const faqs = [
    {
      q: "How does TeamGraph prevent API keys and secrets from leaking into the AI?",
      a: "Every single context piece uploaded, whether from manual input, file uploads, or connected adapters, is automatically passed through a regex-based and AI-based safety pipeline. If it contains secret-shaped strings, it is blocked from the graph and sent directly to the Admin approvals queue, preventing unauthorized ingestion."
    },
    {
      q: "What is Graphiti, and how does it relate to Neo4j?",
      a: "Graphiti is an open-source library for building and querying temporal knowledge graphs. TeamGraph uses Graphiti as the semantic and temporal translation layer, storing the actual graph data (nodes, relationships, episodes) inside a dedicated Neo4j instance to retrieve chronologically grounded context."
    },
    {
      q: "Can I use TeamGraph with my own external agents?",
      a: "Yes! TeamGraph features a fully integrated API Keys management console. You can generate custom API keys, configure them for specific projects, and query the TeamGraph API to feed highly grounded context directly into your custom LangChain, LlamaIndex, or AutoGPT agents."
    },
    {
      q: "How do I configure new integrations like Gmail?",
      a: "Simply configure the client credentials in your server's .env file. Once the keys are set, the integration automatically changes status from 'Soon' to 'Ready' on the dashboard. Administrators can then click 'Connect' to securely authenticate using standard OAuth."
    }
  ];

  return (
    <main className="min-h-screen bg-[var(--paper)] selection:bg-[var(--yellow)] selection:text-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex h-20 items-center justify-between border-b-2 border-black bg-[var(--surface)] px-5 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-[-.05em] text-black">
          <span>TEAMGRAPH</span><span className="text-[var(--purple)]">.</span>
        </Link>
        
        <div className="hidden items-center gap-8 md:flex text-black">
          <a href="#features" className="text-sm font-black hover:text-[var(--purple)] transition-colors">Features</a>
          <a href="#pipeline" className="text-sm font-black hover:text-[var(--purple)] transition-colors">How it Works</a>
          <a href="#faq" className="text-sm font-black hover:text-[var(--purple)] transition-colors">FAQ</a>
          <Link href="/docs" className="text-sm font-black hover:text-[var(--purple)] transition-colors">Documentation</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-black hover:underline text-black">Sign in</Link>
          <Link href="/login" className="btn-primary py-2 px-5 text-sm shadow-[3px_3px_0_black]">
            Open Brain <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b-2 border-black bg-[var(--surface)] py-20 px-5 md:px-10 lg:py-28">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #000 10%, transparent 11%)", backgroundSize: "20px 20px" }} />

        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative z-10 text-black">
            <div className="inline-flex items-center gap-1.5 badge badge-live mb-6">
              <Sparkles size={12} className="animate-spin text-black" /> Continuous Ingestion Engine
            </div>
            
            <h1 className="text-5xl font-black leading-[0.9] tracking-[-.06em] sm:text-7xl lg:text-[80px] text-black">
              Your team knows more than its chat history.
            </h1>
            
            <p className="mt-8 max-w-xl text-lg font-bold leading-relaxed text-[var(--muted)]">
              TeamGraph turns raw company interactions into a secure, approved, and queryable temporal knowledge graph. Perfect for team search and LLM agents.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/login" className="btn-primary px-8 py-4 text-base shadow-[5px_5px_0_black]">
                Build Your Brain <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link href="/docs" className="btn-secondary px-8 py-4 text-base">
                Read Tech Specs
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-6 border-t-2 border-black/10 pt-8">
              <div>
                <div className="text-2xl font-black tracking-tight">Neo4j + Graphiti</div>
                <div className="text-xs font-mono text-[var(--muted)]">Temporal Memory Stack</div>
              </div>
              <div className="h-8 w-0.5 bg-black/10" />
              <div>
                <div className="text-2xl font-black tracking-tight">100% Secure</div>
                <div className="text-xs font-mono text-[var(--muted)]">Human-in-the-Loop</div>
              </div>
            </div>
          </div>

          {/* Interactive Hero Graphic */}
          <div className="relative">
            <div className="relative border-2 border-black bg-black p-5 shadow-[10px_10px_0_var(--purple)]">
              <div className="mono mb-5 flex justify-between text-xs font-black uppercase text-white">
                <span>Active Knowledge Plane</span>
                <span className="text-[var(--lime)] animate-pulse">● online</span>
              </div>
              
              <div className="relative h-[360px] bg-[var(--paper)] border-2 border-black flex flex-col justify-between p-4 overflow-hidden">
                {/* SVG Connections */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
                  <path d="M120 70 L260 140 M120 70 L90 260 M260 140 L90 260 M260 140 L280 270 M90 260 L280 270" stroke="#111" strokeWidth="2.5" fill="none" strokeDasharray="6 6" />
                </svg>

                {/* Nodes */}
                <div className="absolute top-[40px] left-[50px] border-2 border-black bg-[var(--yellow)] px-3 py-1.5 font-black text-xs shadow-[3px_3px_0_black] flex items-center gap-1 text-black">
                  <Brain size={14} /> TeamGraph Brain
                </div>

                <div className="absolute top-[120px] right-[40px] border-2 border-black bg-[var(--cyan)] px-3 py-1.5 font-bold text-xs shadow-[3px_3px_0_black] flex items-center gap-1 text-black">
                  <Plug size={14} /> Integrations
                </div>

                <div className="absolute bottom-[80px] left-[30px] border-2 border-black bg-[var(--lime)] px-3 py-1.5 font-bold text-xs shadow-[3px_3px_0_black] flex items-center gap-1 text-black">
                  <ShieldCheck size={14} /> Safe Ingest
                </div>

                <div className="absolute bottom-[70px] right-[50px] border-2 border-black bg-[var(--coral)] px-3 py-1.5 font-bold text-xs shadow-[3px_3px_0_black] flex items-center gap-1 text-black">
                  <Database size={14} /> Neo4j Graph
                </div>

                {/* Simulated Console overlay */}
                <div className="mt-auto border-t border-black/15 pt-3 bg-white/40 p-2 font-mono text-[10px] text-black">
                  <div className="flex items-center gap-1.5 text-green-700 font-bold">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-ping" />
                    <span>Ingesting: GitHub repository commits...</span>
                  </div>
                  <div className="opacity-60">Linked 14 episodes to Core Platform.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Stats Bar */}
      <section className="border-b-2 border-black bg-[var(--yellow)] text-black">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          {[
            [ShieldCheck, "Secret Scanning Boundary", "Protects credentials before they hit any AI models."],
            [Network, "Temporal Neo4j Memory", "Links episodes chronologically to understand changes over time."],
            [Brain, "Grounded AI Chat & API", "Fetches clean facts to construct highly truthful AI answers."]
          ].map(([Icon, title, desc], index) => {
            const CurrentIcon = Icon as any;
            return (
              <div 
                key={title} 
                className={`flex flex-col justify-center p-8 ${index < 2 ? "border-b-2 border-black md:border-b-0 md:border-r-2" : ""}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CurrentIcon size={24} strokeWidth={2.5} />
                  <b className="text-xl font-black tracking-tight">{title}</b>
                </div>
                <p className="text-sm font-medium opacity-80 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-5 md:px-10 border-b-2 border-black text-black">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="badge badge-safe mb-3">Enterprise Grade</span>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Feature-rich control plane for organization data</h2>
            <p className="mt-4 text-base font-bold text-[var(--muted)]">Manage how knowledge is mapped, filtered, approved, and integrated.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <article className="panel p-6 hover:bg-[var(--cyan)] transition-colors duration-200 group">
              <div className="w-12 h-12 rounded bg-black/5 flex items-center justify-center border border-black mb-6 group-hover:bg-white transition-colors">
                <Plug size={22} />
              </div>
              <h3 className="text-xl font-black">App Connectors</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-black/75">
                OAuth connections for GitHub, Slack, Gmail, Google Drive, and Notion. Sync adapters import context from your team's live daily streams.
              </p>
            </article>

            {/* Feature 2 */}
            <article className="panel p-6 hover:bg-[var(--lime)] transition-colors duration-200 group">
              <div className="w-12 h-12 rounded bg-black/5 flex items-center justify-center border border-black mb-6 group-hover:bg-white transition-colors">
                <Lock size={22} />
              </div>
              <h3 className="text-xl font-black">Secret Scanning</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-black/75">
                Automatically blocks tokens, keys, and confidential credentials. Safeguards company privacy before any data enters the embedding model.
              </p>
            </article>

            {/* Feature 3 */}
            <article className="panel p-6 hover:bg-[var(--yellow)] transition-colors duration-200 group">
              <div className="w-12 h-12 rounded bg-black/5 flex items-center justify-center border border-black mb-6 group-hover:bg-white transition-colors">
                <Layers size={22} />
              </div>
              <h3 className="text-xl font-black">Human-in-the-Loop</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-black/75">
                An administrator Approvals Queue ensures that risky or questionable context is reviewed, approved, or edited before ingestion.
              </p>
            </article>

            {/* Feature 4 */}
            <article className="panel p-6 hover:bg-[var(--purple)] hover:text-white transition-colors duration-200 group">
              <div className="w-12 h-12 rounded bg-black/5 flex items-center justify-center border border-black mb-6 group-hover:bg-white group-hover:text-black transition-colors">
                <Network size={22} />
              </div>
              <h3 className="text-xl font-black">Graphiti Live Memory</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed group-hover:text-white/90 transition-colors">
                Ingested information maps into Neo4j nodes and temporal relationships, creating an interconnected web of semantic truths.
              </p>
            </article>

            {/* Feature 5 */}
            <article className="panel p-6 hover:bg-[var(--coral)] transition-colors duration-200 group">
              <div className="w-12 h-12 rounded bg-black/5 flex items-center justify-center border border-black mb-6 group-hover:bg-white transition-colors">
                <Brain size={22} />
              </div>
              <h3 className="text-xl font-black">Query Playground</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-black/75">
                Search and chat directly with your organization graph. Retrieve exact citations, timeline events, and relevant nodes with ease.
              </p>
            </article>

            {/* Feature 6 */}
            <article className="panel p-6 hover:bg-white transition-colors duration-200 group">
              <div className="w-12 h-12 rounded bg-black/5 flex items-center justify-center border border-black mb-6 group-hover:bg-[var(--purple)] group-hover:text-white transition-colors">
                <Sparkles size={22} />
              </div>
              <h3 className="text-xl font-black">Developer API Keys</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-black/75">
                Generate project-scoped API keys to query TeamGraph directly from external AI agents, terminals, or custom scripts.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Interactive Pipeline Showcase */}
      <section id="pipeline" className="py-20 px-5 md:px-10 border-b-2 border-black bg-[var(--surface)] text-black">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="badge badge-review mb-3">Workflow</span>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">The Ingestion Pipeline</h2>
              <p className="mt-4 text-base font-medium text-[var(--muted)]">
                Trace how raw team text securely transitions from workspace connections into Neo4j nodes. Click through the stages below:
              </p>

              <div className="mt-8 space-y-4">
                {pipelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = activeStep === idx;
                  return (
                    <button
                      key={step.title}
                      onClick={() => setActiveStep(idx)}
                      className={`w-full text-left p-4 border-2 border-black flex items-start gap-4 transition-all duration-150 ${
                        isActive 
                          ? "bg-black text-white shadow-[4px_4px_0_var(--purple)] -translate-y-1" 
                          : "bg-[var(--surface)] text-black hover:bg-black/5"
                      }`}
                    >
                      <span className={`p-1.5 border border-black rounded ${isActive ? "bg-white text-black" : "bg-black/5"}`}>
                        <Icon size={18} />
                      </span>
                      <div>
                        <h4 className="font-black text-base">{step.title}</h4>
                        <p className={`text-xs mt-1 leading-relaxed ${isActive ? "text-white/80" : "text-[var(--muted)]"}`}>
                          {step.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Preview Container */}
            <div className="flex flex-col justify-center">
              <div className="border-2 border-black bg-[var(--paper)] p-6 shadow-[8px_8px_0_black] min-h-[300px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-4 text-xs font-mono font-bold uppercase opacity-60 text-black">
                    <Sparkles size={12} /> Pipeline Simulation Output
                  </div>
                  <h3 className="text-xl font-black mb-3">
                    {pipelineSteps[activeStep].title.replace(/^\d\.\s/, "")}
                  </h3>
                  <p className="text-sm text-[var(--muted)] font-medium leading-relaxed mb-6">
                    Real-time sandbox representation of what happens in the backend storage system during this step.
                  </p>
                </div>
                {pipelineSteps[activeStep].preview}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-5 md:px-10 border-b-2 border-black text-black">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="badge badge-danger mb-3">FAQ</span>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Common Inquiries</h2>
            <p className="mt-4 text-base font-bold text-[var(--muted)]">Everything you need to know about the TeamGraph AI platform.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className="border-2 border-black bg-[var(--surface)] shadow-[4px_4px_0_black]">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 font-black text-left text-base sm:text-lg focus:outline-none text-black"
                  >
                    <span>{faq.q}</span>
                    <span className="ml-4 border border-black rounded-full p-1 bg-[var(--paper)]">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-black/15 text-sm font-medium leading-relaxed text-[var(--muted)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20 px-5 md:px-10 border-b-2 border-black text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #fff 10%, transparent 11%)", backgroundSize: "20px 20px" }} />
        
        <div className="mx-auto max-w-4xl relative z-10">
          <span className="badge bg-white text-black font-black mb-4">Start Ingestion</span>
          <h2 className="text-4xl font-black tracking-tight sm:text-6xl text-white">Get started with TeamGraph AI today</h2>
          <p className="mt-6 max-w-xl mx-auto text-base font-medium text-white/70">
            Build your private temporal memory graph. Ingest safe facts, monitor approvals, and empower your LLM agents with ultimate accuracy.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/login" className="btn-primary bg-[var(--lime)] text-black border-2 border-white px-8 py-4 text-base shadow-[5px_5px_0_white] hover:bg-white hover:text-black">
              Sign up for free <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
            <Link href="/docs" className="btn-secondary bg-transparent text-white border-2 border-white px-8 py-4 text-base hover:bg-white hover:text-black">
              Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black px-5 py-12 text-sm text-white md:px-10 border-t-2 border-black/20">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <b className="text-lg font-black tracking-[-.05em] text-white">TEAMGRAPH<span className="text-[var(--purple)]">.</span></b>
            <span className="text-xs text-white/60">Grounded Temporal Knowledge Architecture</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/80 font-mono">
            <span>Graphiti + Neo4j Live Memory</span>
            <span>•</span>
            <span>FastAPI Permission boundary</span>
            <span>•</span>
            <span>React Control Panel</span>
          </div>

          <div className="text-xs text-white/40">
            &copy; 2026 TeamGraph AI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
