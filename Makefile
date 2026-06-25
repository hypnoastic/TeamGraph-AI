.PHONY: test lint typecheck build health security test\:coverage test\:api test\:web test\:coverage\:web

# ─── Test ─────────────────────────────────────────────────────────────
test: test\:api test\:web

test\:api:
	cd apps/api && python -m pytest tests/ -v --tb=short

test\:web:
	cd apps/web && npm run test

test\:coverage:
	cd apps/api && python -m pytest tests/ --cov=. --cov-report=term-missing --cov-report=html:../../reports/latest/htmlcov -q

test\:coverage\:web:
	cd apps/web && npm run test:coverage

# ─── Lint ─────────────────────────────────────────────────────────────
lint: lint\:api lint\:web

lint\:api:
	cd apps/api && python -m compileall -q .

lint\:web:
	cd apps/web && npm run lint

# ─── Typecheck ────────────────────────────────────────────────────────
typecheck:
	cd apps/web && npx tsc --noEmit

# ─── Build ────────────────────────────────────────────────────────────
build: build\:web build\:mcp

build\:web:
	cd apps/web && npm run build

build\:mcp:
	cd packages/teamgraph-mcp && npm run build

# ─── Security ─────────────────────────────────────────────────────────
security:
	cd apps/web && npm audit --omit=dev || true
	cd packages/teamgraph-mcp && npm audit --omit=dev || true
	cd apps/api && python -m pip check || true

# ─── Health Report ────────────────────────────────────────────────────
health:
	python scripts/project_health.py

health\:ci:
	python scripts/project_health.py --ci
