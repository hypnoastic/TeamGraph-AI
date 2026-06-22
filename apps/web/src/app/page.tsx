import Link from "next/link";
import { ArrowRight, Brain, Network, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <nav className="flex h-18 items-center justify-between border-b-2 border-black bg-[var(--surface)] px-5 md:px-10">
        <b className="text-xl tracking-[-.05em]">TEAMGRAPH<span className="text-[var(--purple)]">.</span></b>
        <div className="flex items-center gap-3">
          <Link href="/login" className="font-bold">Sign in</Link>
          <Link href="/login" className="btn-primary">Open brain <ArrowRight size={16} /></Link>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <span className="badge badge-live">Graphiti live memory</span>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[.93] tracking-[-.075em] sm:text-7xl">Your team knows more than its chat history.</h1>
          <p className="mt-6 max-w-xl text-lg font-medium">TeamGraph turns approved context into a searchable organization brain for people and AI agents.</p>
          <Link href="/login" className="btn-primary mt-8 px-6 py-4">Build your graph <ArrowRight size={18} /></Link>
        </div>
        <div className="relative min-h-[430px] border-2 border-black bg-black p-5 shadow-[10px_10px_0_var(--purple)]">
          <div className="mono mb-5 flex justify-between text-xs font-bold uppercase text-white"><span>Live brain map</span><span className="text-[var(--lime)]">● online</span></div>
          <div className="relative h-[350px] bg-[var(--surface)]">
            <div className="absolute left-[8%] top-[18%] border-2 border-black bg-[var(--yellow)] p-4 font-black shadow-[4px_4px_0_black]"><Brain /> TeamGraph</div>
            <div className="absolute right-[8%] top-[12%] border-2 border-black bg-[var(--cyan)] p-3 font-bold">Projects</div>
            <div className="absolute bottom-[16%] left-[14%] border-2 border-black bg-[var(--lime)] p-3 font-bold">Approved facts</div>
            <div className="absolute bottom-[11%] right-[10%] border-2 border-black bg-[var(--coral)] p-3 font-bold">AI agents</div>
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true"><path d="M140 100 L330 75 M140 115 L150 280 M190 280 L350 285" stroke="#111" strokeWidth="3" fill="none" strokeDasharray="8 7" /></svg>
          </div>
        </div>
      </section>
      <section className="border-y-2 border-black bg-[var(--yellow)]">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          {[[ShieldCheck, "Safe ingestion"], [Network, "Temporal graph"], [Brain, "Grounded answers"]].map(([Icon, label], index) => (
            <div key={String(label)} className={`flex items-center gap-3 p-6 ${index < 2 ? "border-b-2 border-black md:border-b-0 md:border-r-2" : ""}`}><Icon size={26} /><b className="text-lg">{String(label)}</b></div>
          ))}
        </div>
      </section>
      <footer className="flex justify-between bg-black px-5 py-7 text-sm text-white md:px-10"><b>TeamGraph AI</b><span className="mono">Graphiti + Neo4j</span></footer>
    </main>
  );
}
