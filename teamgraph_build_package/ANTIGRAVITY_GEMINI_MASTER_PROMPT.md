# ANTIGRAVITY + GEMINI 3.1 PRO MASTER PROMPT — TeamGraph AI Live Brain P0

You are Antigravity running a high-reasoning Gemini model. Build the complete local-first P0 for **TeamGraph AI** from the markdown files in this repository root.

Read these files first, in this exact order:

1. `P0_LIVE_BRAIN_SPEC.md`
2. `PRODUCT_ARCHITECTURE.md`
3. `BRAIN_CURATOR_SPEC.md`
4. `NEO4J_LIVE_BRAIN_SCHEMA.md`
5. `MCP_NPM_CLI_SPEC.md`
6. `UI_STITCH_DESIGN_BRIEF.md`
7. `SAFETY_AND_PERMISSIONS.md`
8. `IMPLEMENTATION_PLAN.md`
9. `DELIVERY_CHECKLIST.md`

Then implement the project.

## Product Summary

TeamGraph AI is a **live organization context brain** for humans and AI agents.

It does not just dump Slack/GitHub/Jira/Drive/context data into a database. It ingests context, keeps the raw evidence, uses a Gemini-powered curator to classify safety and quality, summarizes the context, assigns tags, detects duplicates/conflicts, proposes graph placement, auto-commits safe context, sends risky context to admin review, and continuously optimizes a Neo4j memory graph so AI agents can retrieve the best context quickly through MCP.

## P0 Must Prove This Loop

```txt
Landing
→ login as admin/member
→ dummy connectors visible
→ API key creation
→ npm MCP CLI login
→ MCP get-context retrieves from Neo4j
→ MCP upload-context pushes new raw context
→ Gemini curator/mock curator analyzes it
→ safe context auto-enters curated graph, risky context goes to review
→ admin can approve/reject/edit review items
→ Brain Chat answers questions using approved graph context
→ graph visualization shows raw, curated, pending, users, projects, agent sessions, curator runs
```

## Critical Product Rules

- Build local-only. No hosting.
- Use Neo4j via Docker Compose as the real graph backend.
- Use Python FastAPI for backend.
- Use Next.js + TypeScript + Tailwind for frontend.
- Use TypeScript npm package for MCP CLI at `packages/teamgraph-mcp`.
- Use Stitch MCP for UI design if available.
- If Stitch MCP is unavailable, create `DESIGN.md` from `UI_STITCH_DESIGN_BRIEF.md` and continue.
- Use Gemini API only if env vars exist.
- If Gemini keys are missing, implement a deterministic mock curator with the same JSON output schema.
- Never let the model execute raw Cypher.
- Model can only return structured graph proposals.
- Backend graph harness validates and applies allowed operations.
- Maintain `CONTEXT.md` after every major phase.
- Make many meaningful commits after small working slices.
- Do not commit secrets, `.env`, node_modules, `.next`, virtualenvs, Neo4j data, SQLite db files, or build artifacts.

## Main P0 Pages

- Landing
- Login
- Brain Chat
- Graph
- Context Inbox
- Approvals
- API Keys
- Connectors
- Team
- Activity
- Settings

The main logged-in page should be **Brain Chat**, not a static dashboard. It should feel like chatting with the organization brain, with graph citations and related nodes, not a generic chatbot.

## Final Output Required

When finished, print:

1. What was built.
2. How to run Neo4j.
3. How to run backend.
4. How to run frontend.
5. How to build/link npm MCP CLI.
6. Demo admin/member login.
7. API key creation flow.
8. MCP client config.
9. CLI command examples.
10. Gemini curator/mock curator behavior.
11. Implemented MCP tools.
12. Git commit count and latest commits.
13. GitHub repo status if attempted.
14. Path to `CONTEXT.md`.
15. Known limitations.
