# Testing & Quality Matrix

## Testing Philosophy

TeamGraph AI uses automated project health reporting to track quality across all layers of the monorepo. Every push and pull request to `master` triggers a comprehensive health report.

## Testing Matrix

| Area | What is Tested | Tool | CI Required | Target |
|------|---------------|------|-------------|--------|
| Unit | API core flows (auth, context, MCP) | `pytest` | Yes | 60%+ coverage |
| Integration | Full signup → context → approval → MCP flow | `pytest` + `TestClient` | Yes | Main flows pass |
| Type Safety | Web + MCP TypeScript types | `tsc --noEmit` | Yes | No type errors |
| Lint | Python compile + ESLint | `compileall`, `eslint` | Yes | Clean |
| Security | Secrets, dependencies, committed files | Custom scanner + `npm audit` | Yes | No critical issues |
| Package | MCP CLI build + pack | `npm pack --dry-run` | Yes | Pack succeeds |
| Reliability | Dockerfiles, env, lockfiles | Custom checks | Yes | All present |
| OSS Readiness | README, LICENSE, CONTRIBUTING, SECURITY | File presence | Yes | All present |

## Coverage Thresholds

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Statement coverage | ~48% | 60% | Achievable by adding auth + approval tests |
| Build success | Yes | Yes | API compiles, MCP builds |
| Security audit | Monitored | No critical | npm high vulns tracked |

## Running Locally

```bash
make test           # Run API tests
make test:coverage  # Run with coverage report
make lint           # Lint all components
make build          # Build web + MCP
make security       # Security audits
make health         # Full health report
```

## Report Outputs

After running `make health`, reports are generated at:
- `reports/latest/health-report.md` — Markdown report
- `reports/latest/health-report.json` — Machine-readable JSON
- `reports/latest/health-report.html` — Styled HTML report

## Raising Coverage

To improve coverage from 48% toward the 60% target:
1. Add tests for individual routers (auth, approvals, team, brain).
2. Add tests for the curator and context service.
3. Add MCP endpoint-specific tests.
