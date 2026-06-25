# Contributing to TeamGraph AI

Thank you for your interest in contributing to TeamGraph AI!

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- Postgres (local or hosted)
- Neo4j (optional; `docker compose up -d neo4j`)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/yashkumar/TeamGraph-AI.git
cd TeamGraph-AI

# Backend
cp .env.example .env
cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000

# Frontend
cd apps/web
npm ci
npm run dev

# MCP CLI
cd packages/teamgraph-mcp
npm ci && npm run build
```

## Making Changes

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-change`
3. Make your changes and write tests.
4. Run the health report: `make health`
5. Verify checks pass: `make test && make lint && make build`
6. Commit and push your branch.
7. Open a Pull Request targeting `master`.

## Code Style

- **Python**: Follow PEP 8. Use type hints.
- **TypeScript**: Follow the project ESLint configuration.
- **Commits**: Use conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`).

## Testing

Run the full test suite locally:
```bash
make test
make test:coverage
```

## Reporting Issues

Use GitHub Issues. Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Python version, Node version)
