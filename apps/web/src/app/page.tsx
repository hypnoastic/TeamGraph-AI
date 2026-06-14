import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background-base)] flex flex-col font-sans selection:bg-[var(--color-accent-brain)] selection:text-black">
      <nav className="w-full flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-[var(--color-text-primary)] font-bold tracking-tight text-xl">TeamGraph</div>
        <div className="flex space-x-6 items-center">
          <Link href="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="text-sm font-medium bg-[var(--color-text-primary)] text-black px-4 py-2 rounded-md hover:bg-white transition-colors">
            Open Brain
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[var(--color-accent-brain)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl w-full space-y-10 text-center relative z-10 mt-12">
          <div className="inline-flex items-center space-x-2 border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] rounded-full px-4 py-1.5 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-brain)] animate-pulse" />
            <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-widest">
              Graphiti Live Brain
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-[var(--color-text-primary)] leading-[1.1]">
            A live organization brain for <br className="hidden md:block" />
            every teammate and every AI agent.
          </h1>

          <p className="text-xl md:text-2xl font-light text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            TeamGraph wraps Graphiti and Neo4j with permissions, approvals, API key control, and a clean surface for humans and external agents.
          </p>

          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link href="/login" className="btn-primary text-lg px-8 py-4 bg-[var(--color-accent-brain)] text-black hover:bg-[var(--color-accent-brain)] hover:opacity-90 transition-all font-semibold rounded-md shadow-[0_0_20px_rgba(0,245,212,0.15)]">
              Launch Brain Chat
            </Link>
          </div>

          <div className="mt-24 relative max-w-5xl mx-auto">
            <div className="border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] rounded-xl p-1 shadow-2xl relative">
              <div className="bg-[var(--color-background-surface)] rounded-lg p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[300px]">
                <div className="flex flex-col space-y-4 w-full md:w-1/4 z-10">
                  <div className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] rounded px-4 py-3 text-sm font-mono text-[var(--color-text-secondary)]">
                    Slack / GitHub / MCP
                  </div>
                  <div className="bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] rounded px-4 py-3 text-sm font-mono text-[var(--color-text-secondary)]">
                    UI Uploads / Demo Connectors
                  </div>
                </div>

                <div className="hidden md:flex flex-1 justify-center items-center text-[var(--color-border-subtle)] z-10 text-2xl font-light">
                  →
                </div>

                <div className="w-full md:w-1/3 flex flex-col items-center justify-center my-8 md:my-0 z-10 relative">
                  <div className="border border-[var(--color-border-subtle)] bg-[var(--color-card-base)] p-6 rounded-xl w-full text-center relative overflow-hidden">
                    <div className="text-[var(--color-accent-brain)] font-mono text-sm tracking-widest uppercase mb-2">
                      TeamGraph Control Layer
                    </div>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      Safety, approvals, permissions, audit
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-1 justify-center items-center text-[var(--color-border-subtle)] z-10 text-2xl font-light">
                  →
                </div>

                <div className="w-full md:w-1/4 flex flex-col items-end z-10">
                  <div className="border border-[var(--color-accent-mcp)] border-opacity-30 bg-[#16161A] p-6 rounded-xl w-full text-center">
                    <div className="text-[var(--color-accent-mcp)] font-mono text-sm tracking-widest uppercase mb-2">
                      Graphiti + Neo4j
                    </div>
                    <div className="text-[var(--color-text-primary)] font-medium">Live Brain Memory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-[var(--color-text-muted)] font-mono">
        © 2026 TeamGraph AI.
      </footer>
    </div>
  );
}
