# CONTEXT.md — TeamGraph Live Brain Handoff

Maintain this file after every major implementation phase.

## Current Status

Not started.

## Completed Work

None yet.

## Architecture

- Frontend: Next.js + TypeScript + Tailwind + React Flow
- Backend: FastAPI
- Graph: Neo4j via Docker Compose
- Curator: Gemini if configured, deterministic mock fallback otherwise
- MCP CLI: TypeScript npm package at `packages/teamgraph-mcp`
- Main app page: Brain Chat
- Safety: model proposals validated by graph harness

## Product Decisions

- P0 uses admin/member roles only.
- P0 uses dummy connectors.
- Neo4j is required.
- RawContext is immutable.
- Safe context can auto-curate.
- Risky context goes to review.
- Unsafe context goes to quarantine.
- Gemini never executes raw Cypher.
- API keys are hashed and scoped.
- External agents connect via npm MCP CLI.
- No hosting in P0.

## Latest Commit

None yet.

## Files Changed

None yet.

## Known Issues

None yet.

## Run Commands

To be filled by implementation agent.

## Next Recommended Steps

1. Initialize repository.
2. Add Neo4j Docker Compose.
3. Build backend scaffold.
4. Seed Neo4j graph.
5. Build curator/mock curator.
6. Build context upload/lane flow.
7. Build MCP CLI.
8. Build frontend.
