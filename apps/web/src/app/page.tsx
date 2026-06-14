import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background-base)] flex flex-col font-sans selection:bg-[var(--color-accent-brain)] selection:text-black">
      {/* Top Nav Minimal */}
      <nav className="w-full flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-[var(--color-text-primary)] font-bold tracking-tight text-xl">TeamGraph</div>
        <div className="flex space-x-6 items-center">
          <Link href="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="text-sm font-medium bg-[var(--color-text-primary)] text-black px-4 py-2 rounded-md hover:bg-white transition-colors">
            Request Access
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[var(--color-accent-brain)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl w-full space-y-10 text-center relative z-10 mt-12">
          
          <div className="inline-flex items-center space-x-2 border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] rounded-full px-4 py-1.5 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-brain)] animate-pulse"></span>
            <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-widest">Live Context Infrastructure</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-[var(--color-text-primary)] leading-[1.1]">
            A live context brain for <br className="hidden md:block"/>
            every teammate and <span className="text-[var(--color-accent-brain)]">every AI agent.</span>
          </h1>
          
          <p className="text-xl md:text-2xl font-light text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            Unified infrastructure for Model Context Protocol (MCP) and Neo4j-powered knowledge graphs. Stop searching, start building.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link href="/login" className="btn-primary text-lg px-8 py-4 bg-[var(--color-accent-brain)] text-black hover:bg-[var(--color-accent-brain)] hover:opacity-90 transition-all font-semibold rounded-md shadow-[0_0_20px_rgba(0,245,212,0.15)] hover:shadow-[0_0_30px_rgba(0,245,212,0.3)]">
              Start Building
            </Link>
            <Link href="https://github.com" target="_blank" className="btn-secondary text-lg px-8 py-4 rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-card-hover)] transition-colors text-[var(--color-text-primary)]">
              View Docs
            </Link>
          </div>

          {/* Architectural Diagram */}
          <div className="mt-24 relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background-base)] to-transparent z-10 pointer-events-none h-full w-full mt-[50%]"></div>
            
            <div className="border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] rounded-xl p-1 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-border-subtle)] to-transparent opacity-20 rounded-xl"></div>
              <div className="bg-[var(--color-background-surface)] rounded-lg p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[300px]">
                
                {/* Connector Nodes */}
                <div className="flex flex-col space-y-4 w-full md:w-1/4 z-10">
                  <div className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] rounded px-4 py-3 text-sm font-mono text-[var(--color-text-secondary)] flex items-center shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span> Jira
                  </div>
                  <div className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] rounded px-4 py-3 text-sm font-mono text-[var(--color-text-secondary)] flex items-center shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span> Slack
                  </div>
                  <div className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] rounded px-4 py-3 text-sm font-mono text-[var(--color-text-secondary)] flex items-center shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span> MCP Uploads
                  </div>
                </div>

                {/* Flow lines (abstract representation) */}
                <div className="hidden md:flex flex-1 justify-center items-center text-[var(--color-border-subtle)] z-10 text-2xl font-light">
                  →
                </div>

                {/* Processing Core */}
                <div className="w-full md:w-1/3 flex flex-col items-center justify-center my-8 md:my-0 z-10 relative">
                  <div className="absolute inset-0 bg-[var(--color-accent-brain)] opacity-[0.02] blur-[40px] rounded-full"></div>
                  <div className="border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] p-6 rounded-xl w-full text-center relative overflow-hidden group hover:border-[var(--color-accent-brain)] transition-colors">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent-brain)] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-[var(--color-accent-brain)] font-mono text-sm tracking-widest uppercase mb-2">Gemini Curator</div>
                    <div className="text-[var(--color-text-primary)] font-medium">Auto-Curate & Review</div>
                  </div>
                </div>

                {/* Flow lines */}
                <div className="hidden md:flex flex-1 justify-center items-center text-[var(--color-border-subtle)] z-10 text-2xl font-light">
                  →
                </div>

                {/* Graph Output */}
                <div className="w-full md:w-1/4 flex flex-col items-end z-10">
                  <div className="border border-[var(--color-accent-mcp)] border-opacity-30 bg-[#16161A] p-6 rounded-xl w-full text-center relative shadow-[0_0_30px_rgba(167,139,250,0.05)]">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent-mcp)] to-transparent opacity-50"></div>
                     <div className="text-[var(--color-accent-mcp)] font-mono text-sm tracking-widest uppercase mb-2">Neo4j Graph</div>
                     <div className="text-[var(--color-text-primary)] font-medium">Brain Chat</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-[var(--color-text-muted)] font-mono">
        © 2026 TeamGraph AI. Built for the Hackathon.
      </footer>
    </div>
  );
}
