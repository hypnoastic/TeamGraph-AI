# DELIVERY_CHECKLIST.md — TeamGraph Live Brain P0

## Root

- [ ] Root docs exist.
- [ ] CONTEXT.md exists.
- [ ] `.env.example` exists.
- [ ] `.gitignore` exists.
- [ ] Docker Compose exists.
- [ ] README complete.

## Neo4j

- [ ] Neo4j starts with Docker Compose.
- [ ] Browser works on 7474.
- [ ] Bolt works on 7687.
- [ ] Constraints created.
- [ ] Seed graph created.
- [ ] RawContext, Context, ReviewItem, CuratorRun, SafetySignal nodes exist.

## Backend

- [ ] FastAPI runs on 8000.
- [ ] Health endpoint works.
- [ ] Demo login works.
- [ ] API key generation works.
- [ ] API key validation works.
- [ ] Context upload creates RawContext.
- [ ] Mock curator works without Gemini key.
- [ ] Gemini curator works if key exists.
- [ ] Safety rules detect obvious secrets/injection.
- [ ] Safe context auto-curates.
- [ ] Risky context enters review.
- [ ] Quarantined context works.
- [ ] Approve/reject/edit approve works.
- [ ] Brain query returns answer + citations.
- [ ] Graph optimizer creates run.
- [ ] MCP backend endpoints work.

## Frontend

- [ ] Landing page polished.
- [ ] Login works.
- [ ] Brain Chat main page works.
- [ ] Graph visualization works.
- [ ] Context Inbox lanes work.
- [ ] Approvals page works.
- [ ] API key page works.
- [ ] Connectors dummy page works.
- [ ] Team roles page works.
- [ ] Activity page works.
- [ ] Settings page shows Neo4j/Gemini mode.
- [ ] UI is dark, clean, simple, premium.
- [ ] No lorem ipsum.
- [ ] No broken navigation.

## MCP CLI

- [ ] package exists.
- [ ] npm install works.
- [ ] npm run build works.
- [ ] npm link works.
- [ ] teamgraph-mcp login works.
- [ ] status works.
- [ ] serve works.
- [ ] get-context works.
- [ ] upload-context works.
- [ ] optimize works if implemented.
- [ ] MCP tools use API key.

## Demo Loop

- [ ] Login admin.
- [ ] Ask Brain Chat “Why did we choose Neo4j?”
- [ ] Create API key.
- [ ] Login CLI.
- [ ] Get context from CLI.
- [ ] Upload context from CLI.
- [ ] Curator runs.
- [ ] Context auto-curates or enters review.
- [ ] Approve risky context.
- [ ] Graph updates.
- [ ] Run optimizer.
- [ ] Brain Chat answers based on new context.

## Git

- [ ] Many meaningful commits.
- [ ] No secrets committed.
- [ ] No `.env` committed.
- [ ] No node_modules committed.
- [ ] No build artifacts committed.
- [ ] CONTEXT.md updated.
