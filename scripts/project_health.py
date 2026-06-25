#!/usr/bin/env python3
"""
TeamGraph AI — Project Health Report Generator

Runs functional, quality, security, performance, reliability, and open-source
readiness checks across the full monorepo stack and produces three report
formats: Markdown, JSON, and HTML.

Usage:
    python scripts/project_health.py          # generates reports/latest/*
    python scripts/project_health.py --ci     # same but exits non-zero on critical failures
"""

from __future__ import annotations

import argparse
import datetime
import glob
import json
import math
import os
import pathlib
import re
import shutil
import subprocess
import sys
import time
import textwrap

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = pathlib.Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
REPORT_DIR = REPO_ROOT / "reports" / "latest"
API_DIR = REPO_ROOT / "apps" / "api"
WEB_DIR = REPO_ROOT / "apps" / "web"
MCP_DIR = REPO_ROOT / "packages" / "teamgraph-mcp"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ts() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def _git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()[:10]
    except Exception:
        return "unknown"


def _git_branch() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=REPO_ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return "unknown"


def _run(cmd: list[str], *, cwd: pathlib.Path | None = None, timeout: int = 300) -> dict:
    """Run a command and return structured result."""
    start = time.monotonic()
    try:
        proc = subprocess.run(
            cmd, cwd=cwd or REPO_ROOT, capture_output=True, text=True, timeout=timeout
        )
        duration = round(time.monotonic() - start, 2)
        return {
            "passed": proc.returncode == 0,
            "exit_code": proc.returncode,
            "stdout": proc.stdout[-4000:] if proc.stdout else "",
            "stderr": proc.stderr[-4000:] if proc.stderr else "",
            "duration_s": duration,
            "command": " ".join(cmd),
        }
    except FileNotFoundError:
        return {"passed": False, "exit_code": -1, "stdout": "", "stderr": f"Command not found: {cmd[0]}", "duration_s": 0, "command": " ".join(cmd)}
    except subprocess.TimeoutExpired:
        return {"passed": False, "exit_code": -1, "stdout": "", "stderr": "Timeout", "duration_s": timeout, "command": " ".join(cmd)}


def _file_exists(path: str | pathlib.Path) -> bool:
    return (REPO_ROOT / path).exists()


def _count_pattern(pattern: str, extensions: list[str] | None = None) -> int:
    """Count occurrences of a regex pattern across source files."""
    exts = extensions or [".py", ".ts", ".tsx", ".js", ".jsx"]
    count = 0
    for ext in exts:
        for fpath in REPO_ROOT.rglob(f"*{ext}"):
            if any(skip in str(fpath) for skip in ["node_modules", ".venv", "venv", "__pycache__", ".next", "dist"]):
                continue
            try:
                text = fpath.read_text(errors="ignore")
                count += len(re.findall(pattern, text))
            except Exception:
                pass
    return count


# ---------------------------------------------------------------------------
# Category Check Runners
# ---------------------------------------------------------------------------

class CheckResult:
    def __init__(self, name: str, passed: bool, detail: str = "", risk: str = "info", command: str = "", duration: float = 0):
        self.name = name
        self.passed = passed
        self.detail = detail
        self.risk = risk  # critical, high, medium, low, info
        self.command = command
        self.duration = duration

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "passed": self.passed,
            "detail": self.detail,
            "risk": self.risk,
            "command": self.command,
            "duration_s": self.duration,
        }


def run_functional_checks() -> tuple[list[CheckResult], float]:
    """Run functional correctness checks. Returns (results, score 0-25)."""
    results: list[CheckResult] = []

    # --- Python API: compile check ---
    r = _run([sys.executable, "-m", "compileall", "-q", str(API_DIR)])
    results.append(CheckResult("API Python compile", r["passed"], r["stderr"][:300] if not r["passed"] else "All .py files compile", command=r["command"], duration=r["duration_s"]))

    # --- Python API: existing tests ---
    r = _run([sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short", "-q"], cwd=API_DIR)
    test_detail = r["stdout"][-500:] if r["stdout"] else r["stderr"][:500]
    results.append(CheckResult("API unit/integration tests", r["passed"], test_detail, risk="high" if not r["passed"] else "info", command=r["command"], duration=r["duration_s"]))

    # --- Web: lint ---
    r = _run(["npm", "run", "lint"], cwd=WEB_DIR)
    results.append(CheckResult("Web ESLint", r["passed"], r["stderr"][:300] if not r["passed"] else "Lint passed", command=r["command"], duration=r["duration_s"]))

    # --- Web: typecheck ---
    r = _run(["npx", "tsc", "--noEmit"], cwd=WEB_DIR)
    results.append(CheckResult("Web TypeScript typecheck", r["passed"], r["stderr"][:300] if not r["passed"] else "Type check passed", command=r["command"], duration=r["duration_s"]))

    # --- Web: build ---
    r = _run(["npm", "run", "build"], cwd=WEB_DIR, timeout=180)
    results.append(CheckResult("Web Next.js build", r["passed"], r["stderr"][:300] if not r["passed"] else "Build succeeded", command=r["command"], duration=r["duration_s"]))

    # --- MCP: build ---
    r = _run(["npm", "run", "build"], cwd=MCP_DIR)
    results.append(CheckResult("MCP package build", r["passed"], r["stderr"][:300] if not r["passed"] else "Build succeeded", command=r["command"], duration=r["duration_s"]))

    # Score: each check is worth equal weight out of 25
    passed = sum(1 for c in results if c.passed)
    score = round((passed / max(len(results), 1)) * 25, 1)
    return results, score


def run_coverage_checks() -> tuple[list[CheckResult], float, dict]:
    """Run coverage checks. Returns (results, score 0-20, coverage_data)."""
    results: list[CheckResult] = []
    cov_data: dict = {"statement": 0, "branch": 0, "has_data": False}

    # --- Python API coverage ---
    r = _run(
        [sys.executable, "-m", "pytest", "tests/", "--cov=.", "--cov-report=json:../../reports/latest/coverage-api.json", "--cov-report=term", "-q"],
        cwd=API_DIR, timeout=120
    )
    if r["passed"] or "TOTAL" in r["stdout"]:
        # Parse coverage from terminal output
        for line in r["stdout"].splitlines():
            if "TOTAL" in line:
                parts = line.split()
                for p in parts:
                    if p.endswith("%"):
                        try:
                            cov_data["statement"] = int(p.replace("%", ""))
                            cov_data["has_data"] = True
                        except ValueError:
                            pass
                        break
        results.append(CheckResult("API test coverage", True, f"Statement coverage: {cov_data['statement']}%", command=r["command"], duration=r["duration_s"]))
    else:
        results.append(CheckResult("API test coverage", False, r["stderr"][:300], risk="high", command=r["command"], duration=r["duration_s"]))

    # --- Web Vitest coverage ---
    r2 = _run(["npm", "run", "test:coverage", "--", "--reporter=json"], cwd=WEB_DIR, timeout=120)
    web_statement = 0
    if r2["passed"] or "Coverage enabled" in r2["stdout"] or "Coverage enabled" in r2["stderr"]:
        try:
            # We look for the JSON blob in the output
            # Vitest JSON reporter prints a JSON object with a "total" key
            match = re.search(r'(\{.*"total":.*"statements":.*\})', r2["stdout"], re.DOTALL)
            if match:
                web_cov_data = json.loads(match.group(1))
                web_statement = web_cov_data.get("total", {}).get("statements", {}).get("pct", 0)
                cov_data["web_statement"] = web_statement
                results.append(CheckResult("Web test coverage", True, f"Statement coverage: {web_statement}%", command=r2["command"], duration=r2["duration_s"]))
            else:
                # Fallback text parsing if json fails
                for line in r2["stdout"].splitlines():
                    if "All files" in line:
                        parts = [p.strip() for p in line.split("|")]
                        if len(parts) > 2:
                            web_statement = float(parts[1])
                            cov_data["web_statement"] = web_statement
                            break
                results.append(CheckResult("Web test coverage", True, f"Statement coverage: {web_statement}%", command=r2["command"], duration=r2["duration_s"]))
        except Exception as e:
            results.append(CheckResult("Web test coverage", False, f"Failed to parse coverage: {e}", risk="high", command=r2["command"], duration=r2["duration_s"]))
    else:
        results.append(CheckResult("Web test coverage", False, r2["stderr"][:300], risk="high", command=r2["command"], duration=r2["duration_s"]))

    # Score: scale statement coverage to 20 points (target 60% for this project stage)
    target = 60
    api_achieved = min(cov_data.get("statement", 0), 100)
    web_achieved = min(cov_data.get("web_statement", 0), 100)
    
    # Blended score (for now, weight API slightly higher or just average them)
    achieved = (api_achieved + web_achieved) / 2
    score = round(min((achieved / target) * 20, 20), 1)
    return results, score, cov_data


def run_security_checks() -> tuple[list[CheckResult], float]:
    """Run security checks. Returns (results, score 0-20)."""
    results: list[CheckResult] = []

    # --- Committed .env file ---
    env_in_git = _run(["git", "ls-files", "--error-unmatch", ".env"], cwd=REPO_ROOT)
    if env_in_git["passed"]:
        results.append(CheckResult(".env committed to git", False, "CRITICAL: .env file with secrets is tracked by git. Remove it immediately and rotate all secrets.", risk="critical"))
    else:
        results.append(CheckResult(".env not in git", True, ".env correctly excluded from version control"))

    # --- Private key files ---
    pem_files = list(REPO_ROOT.glob("*.pem"))
    if pem_files:
        names = ", ".join(f.name for f in pem_files)
        pem_in_git = _run(["git", "ls-files", "--error-unmatch"] + [str(f.relative_to(REPO_ROOT)) for f in pem_files], cwd=REPO_ROOT)
        if pem_in_git["passed"]:
            results.append(CheckResult("Private keys in git", False, f"CRITICAL: PEM files committed: {names}. Remove from history and rotate.", risk="critical"))
        else:
            results.append(CheckResult("Private keys check", True, f"PEM files exist locally but not tracked: {names}", risk="medium"))
    else:
        results.append(CheckResult("Private keys check", True, "No .pem files found"))

    # --- .env.example safety ---
    if _file_exists(".env.example"):
        env_example = (REPO_ROOT / ".env.example").read_text(errors="ignore")
        has_real_secrets = bool(re.search(r"(sk-[a-zA-Z0-9]{20,}|AIza[a-zA-Z0-9_-]{30,}|ghp_[a-zA-Z0-9]{36})", env_example))
        if has_real_secrets:
            results.append(CheckResult(".env.example safety", False, "Real API keys detected in .env.example", risk="high"))
        else:
            results.append(CheckResult(".env.example safety", True, ".env.example contains only placeholder values"))
    else:
        results.append(CheckResult(".env.example exists", False, "No .env.example found", risk="medium"))

    # --- Hardcoded secret patterns in source ---
    secret_patterns = [
        (r'(?:password|secret|token|api_key)\s*=\s*["\'][^"\']{8,}["\']', "Hardcoded credentials in source"),
        (r'sk-[a-zA-Z0-9]{20,}', "OpenAI API key pattern"),
        (r'AIza[a-zA-Z0-9_-]{30,}', "Google API key pattern"),
        (r'ghp_[a-zA-Z0-9]{36}', "GitHub PAT pattern"),
    ]
    total_secrets = 0
    for pattern, desc in secret_patterns:
        count = _count_pattern(pattern)
        if count > 0:
            total_secrets += count
    if total_secrets > 0:
        results.append(CheckResult("Hardcoded secrets scan", False, f"Found {total_secrets} potential hardcoded secret patterns in source files", risk="high"))
    else:
        results.append(CheckResult("Hardcoded secrets scan", True, "No hardcoded secret patterns detected"))

    # --- Python dependency check ---
    r = _run([sys.executable, "-m", "pip", "check"], cwd=API_DIR)
    results.append(CheckResult("Python dependency check", r["passed"], r["stdout"][:300] if r["passed"] else r["stderr"][:300], risk="medium" if not r["passed"] else "info", command=r["command"], duration=r["duration_s"]))

    # --- npm audit (web) ---
    r = _run(["npm", "audit", "--omit=dev", "--json"], cwd=WEB_DIR)
    try:
        audit_json = json.loads(r["stdout"])
        vulns = audit_json.get("metadata", {}).get("vulnerabilities", {})
        critical = vulns.get("critical", 0)
        high = vulns.get("high", 0)
        detail = f"Critical: {critical}, High: {high}, Moderate: {vulns.get('moderate', 0)}, Low: {vulns.get('low', 0)}"
        risk = "critical" if critical > 0 else ("high" if high > 0 else "info")
        results.append(CheckResult("Web npm audit", critical == 0 and high == 0, detail, risk=risk, command=r["command"], duration=r["duration_s"]))
    except Exception:
        results.append(CheckResult("Web npm audit", r["passed"], r["stderr"][:300], risk="medium", command=r["command"], duration=r["duration_s"]))

    # --- Dangerous committed files ---
    dangerous_patterns = ["*.pem", "*.key", "*.p12", "*.pfx", "*.sql", "*.dump"]
    found_dangerous = []
    for pat in dangerous_patterns:
        r_check = _run(["git", "ls-files", pat], cwd=REPO_ROOT)
        if r_check["stdout"].strip():
            found_dangerous.extend(r_check["stdout"].strip().splitlines())
    if found_dangerous:
        results.append(CheckResult("Dangerous files in git", False, f"Found: {', '.join(found_dangerous[:5])}", risk="critical"))
    else:
        results.append(CheckResult("Dangerous files check", True, "No dangerous file types tracked by git"))

    # Score
    critical_count = sum(1 for c in results if not c.passed and c.risk == "critical")
    high_count = sum(1 for c in results if not c.passed and c.risk == "high")
    passed = sum(1 for c in results if c.passed)
    total = len(results)
    base_score = (passed / max(total, 1)) * 20
    # Heavy penalty for critical/high
    penalty = critical_count * 5 + high_count * 2
    score = round(max(base_score - penalty, 0), 1)
    return results, score


def run_code_quality_checks() -> tuple[list[CheckResult], float]:
    """Run code quality checks. Returns (results, score 0-15)."""
    results: list[CheckResult] = []

    # --- Python code quality (compile check — no ruff dependency required) ---
    r = _run([sys.executable, "-m", "compileall", "-q", str(API_DIR)])
    results.append(CheckResult("API Python compile", r["passed"], "All .py files compile cleanly" if r["passed"] else r["stderr"][:300], command=r["command"], duration=r["duration_s"]))

    # --- Web ESLint (already in functional, but categorized here too) ---
    r = _run(["npm", "run", "lint"], cwd=WEB_DIR)
    results.append(CheckResult("Web ESLint quality", r["passed"], r["stderr"][:300] if not r["passed"] else "Clean", command=r["command"], duration=r["duration_s"]))

    # --- TODO/FIXME count ---
    todo_count = _count_pattern(r"\b(TODO|FIXME|HACK|XXX)\b")
    risk = "low" if todo_count > 20 else "info"
    results.append(CheckResult("TODO/FIXME audit", todo_count < 50, f"Found {todo_count} TODO/FIXME/HACK/XXX comments", risk=risk))

    # --- Large file check ---
    large_files = []
    for ext in [".py", ".ts", ".tsx", ".js"]:
        for fpath in REPO_ROOT.rglob(f"*{ext}"):
            if any(skip in str(fpath) for skip in ["node_modules", ".venv", "venv", ".next", "dist", "__pycache__"]):
                continue
            try:
                lines = len(fpath.read_text(errors="ignore").splitlines())
                if lines > 500:
                    large_files.append(f"{fpath.relative_to(REPO_ROOT)} ({lines} lines)")
            except Exception:
                pass
    if large_files:
        results.append(CheckResult("Large files warning", len(large_files) < 5, f"{len(large_files)} files over 500 lines: {', '.join(large_files[:3])}", risk="low"))
    else:
        results.append(CheckResult("Large files check", True, "No excessively large source files"))

    # Score
    passed = sum(1 for c in results if c.passed)
    score = round((passed / max(len(results), 1)) * 15, 1)
    return results, score


def run_performance_checks() -> tuple[list[CheckResult], float]:
    """Run performance checks. Returns (results, score 0-10)."""
    results: list[CheckResult] = []

    # --- Next.js build size (static output only, exclude cache) ---
    next_static = WEB_DIR / ".next" / "static"
    next_server = WEB_DIR / ".next" / "server"
    if next_static.exists() or next_server.exists():
        total_size = 0
        for d in [next_static, next_server]:
            if d.exists():
                total_size += sum(f.stat().st_size for f in d.rglob("*") if f.is_file())
        size_mb = round(total_size / (1024 * 1024), 1)
        results.append(CheckResult("Web build output size", size_mb < 50, f"Static + server output: {size_mb} MB", risk="low" if size_mb >= 50 else "info"))
    else:
        results.append(CheckResult("Web build output size", True, "No .next/ build found — will be measured after build", risk="info"))

    # --- MCP package dry-run ---
    r = _run(["npm", "pack", "--dry-run"], cwd=MCP_DIR)
    if r["passed"]:
        # Parse size from output
        results.append(CheckResult("MCP npm pack", True, r["stderr"][:200] or "Pack dry-run succeeded", command=r["command"], duration=r["duration_s"]))
    else:
        results.append(CheckResult("MCP npm pack", False, r["stderr"][:200], risk="medium", command=r["command"], duration=r["duration_s"]))

    # --- API startup (import check) ---
    r = _run([sys.executable, "-c", "import importlib; importlib.import_module('config')"], cwd=API_DIR, timeout=15)
    results.append(CheckResult("API import check", r["passed"], r["stderr"][:200] if not r["passed"] else "Core module imports cleanly", command=r["command"], duration=r["duration_s"]))

    passed = sum(1 for c in results if c.passed)
    score = round((passed / max(len(results), 1)) * 10, 1)
    return results, score


def run_reliability_checks() -> tuple[list[CheckResult], float]:
    """Run reliability checks. Returns (results, score 0-5)."""
    results: list[CheckResult] = []

    # --- Dockerfiles ---
    api_docker = _file_exists("apps/api/Dockerfile")
    web_docker = _file_exists("apps/web/Dockerfile")
    results.append(CheckResult("Dockerfiles present", api_docker and web_docker, f"API: {'✓' if api_docker else '✗'}, Web: {'✓' if web_docker else '✗'}"))

    # --- .env.example completeness ---
    if _file_exists(".env.example"):
        env_vars = set()
        for line in (REPO_ROOT / ".env.example").read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                env_vars.add(line.split("=", 1)[0])
        required = {"DATABASE_URL", "SECRET_KEY", "FRONTEND_ORIGIN", "NEO4J_URI", "NEO4J_PASSWORD"}
        missing = required - env_vars
        results.append(CheckResult(".env.example completeness", len(missing) == 0, f"Missing required vars: {missing}" if missing else "All required vars documented"))
    else:
        results.append(CheckResult(".env.example completeness", False, ".env.example missing", risk="medium"))

    # --- Lock files ---
    web_lock = _file_exists("apps/web/package-lock.json")
    mcp_lock = _file_exists("packages/teamgraph-mcp/package-lock.json")
    api_req = _file_exists("apps/api/requirements.txt")
    results.append(CheckResult("Lock/dependency files", web_lock and mcp_lock and api_req, f"Web lock: {'✓' if web_lock else '✗'}, MCP lock: {'✓' if mcp_lock else '✗'}, API requirements.txt: {'✓' if api_req else '✗'}"))

    # --- Docker compose ---
    results.append(CheckResult("Docker Compose present", _file_exists("docker-compose.yml"), "docker-compose.yml found" if _file_exists("docker-compose.yml") else "Missing"))

    passed = sum(1 for c in results if c.passed)
    score = round((passed / max(len(results), 1)) * 5, 1)
    return results, score


def run_oss_readiness_checks() -> tuple[list[CheckResult], float]:
    """Run open-source readiness checks. Returns (results, score 0-5)."""
    checks = {
        "README.md": "README.md",
        "LICENSE": ["LICENSE", "LICENSE.md", "packages/teamgraph-mcp/LICENSE"],
        "CONTRIBUTING.md": "CONTRIBUTING.md",
        "SECURITY.md": "SECURITY.md",
        "CODE_OF_CONDUCT.md": "CODE_OF_CONDUCT.md",
        ".github issue templates": [".github/ISSUE_TEMPLATE", ".github/ISSUE_TEMPLATE.md"],
        ".github PR template": [".github/PULL_REQUEST_TEMPLATE.md", ".github/pull_request_template.md"],
        "docs/ folder": "docs",
    }
    results: list[CheckResult] = []
    for name, paths in checks.items():
        if isinstance(paths, str):
            paths = [paths]
        found = any(_file_exists(p) for p in paths)
        results.append(CheckResult(name, found, "Found" if found else "Missing", risk="low" if not found else "info"))

    passed = sum(1 for c in results if c.passed)
    score = round((passed / max(len(results), 1)) * 5, 1)
    return results, score


# ---------------------------------------------------------------------------
# Report Generation
# ---------------------------------------------------------------------------

def _score_badge(score: float) -> str:
    if score >= 85:
        return "🟢 Excellent"
    elif score >= 70:
        return "🟡 Good"
    elif score >= 50:
        return "🟠 Needs Improvement"
    else:
        return "🔴 Critical"


def _risk_icon(risk: str) -> str:
    return {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵", "info": "⚪"}.get(risk, "⚪")


def generate_markdown(data: dict) -> str:
    ts = data["timestamp"]
    sha = data["commit_sha"]
    branch = data["branch"]
    score = data["overall_score"]

    lines = [
        f"# 🏥 TeamGraph AI — Project Health Report",
        f"",
        f"**Generated**: {ts}  ",
        f"**Commit**: `{sha}`  ",
        f"**Branch**: `{branch}`  ",
        f"**Overall Score**: **{score}/100** {_score_badge(score)}",
        f"",
        f"---",
        f"",
        f"## 📊 Category Scores",
        f"",
        f"| Category | Score | Max | Status |",
        f"|----------|-------|-----|--------|",
    ]
    for cat in data["categories"]:
        icon = "✅" if cat["score"] >= cat["max"] * 0.7 else ("⚠️" if cat["score"] >= cat["max"] * 0.4 else "❌")
        lines.append(f"| {cat['name']} | {cat['score']} | {cat['max']} | {icon} |")

    lines += ["", "---", ""]

    for section in data["sections"]:
        lines.append(f"## {section['title']}")
        lines.append("")
        lines.append("| Check | Status | Risk | Detail |")
        lines.append("|-------|--------|------|--------|")
        for check in section["checks"]:
            status = "✅ Pass" if check["passed"] else "❌ Fail"
            risk = f"{_risk_icon(check['risk'])} {check['risk'].capitalize()}"
            detail = check["detail"][:120].replace("|", "\\|").replace("\n", " ")
            lines.append(f"| {check['name']} | {status} | {risk} | {detail} |")
        lines.append("")

    # Coverage summary
    if data.get("coverage"):
        cov = data["coverage"]
        lines += [
            "## 📈 Coverage Summary",
            "",
            f"- **API Statement Coverage**: {cov.get('statement', 'N/A')}%",
            f"- **Web Statement Coverage**: {cov.get('web_statement', 'N/A')}%",
            f"- **Target**: 60% (current project stage)",
            "",
        ]

    # Recommendations
    lines += ["## 🔧 Recommendations", ""]
    recs = data.get("recommendations", [])
    for i, rec in enumerate(recs, 1):
        lines.append(f"{i}. {rec}")
    lines.append("")

    # Commands
    lines += [
        "## 🖥️ Commands",
        "",
        "```bash",
        "# Generate this report",
        "python scripts/project_health.py",
        "",
        "# Run in CI mode (fails on critical issues)",
        "python scripts/project_health.py --ci",
        "",
        "# Individual checks",
        "make test          # Run API tests",
        "make lint          # Lint all components",
        "make build         # Build all components",
        "make security      # Run security audit",
        "make health        # Generate full health report",
        "```",
        "",
        "---",
        f"*Report generated by `scripts/project_health.py`*",
    ]
    return "\n".join(lines)


def generate_html(data: dict) -> str:
    score = data["overall_score"]
    color = "#22c55e" if score >= 85 else ("#eab308" if score >= 70 else ("#f97316" if score >= 50 else "#ef4444"))

    cat_rows = ""
    for cat in data["categories"]:
        pct = round((cat["score"] / cat["max"]) * 100) if cat["max"] > 0 else 0
        cat_rows += f"""<tr>
            <td>{cat['name']}</td>
            <td>{cat['score']}/{cat['max']}</td>
            <td><div style="background:#1e293b;border-radius:4px;overflow:hidden;height:20px;"><div style="background:{'#22c55e' if pct >= 70 else '#eab308' if pct >= 40 else '#ef4444'};height:100%;width:{pct}%;border-radius:4px;"></div></div></td>
        </tr>"""

    section_html = ""
    for section in data["sections"]:
        rows = ""
        for check in section["checks"]:
            status_color = "#22c55e" if check["passed"] else "#ef4444"
            rows += f"""<tr>
                <td style="color:{status_color};">{'✅' if check['passed'] else '❌'} {check['name']}</td>
                <td>{check['risk'].upper()}</td>
                <td style="font-size:0.85em;color:#94a3b8;">{check['detail'][:150]}</td>
            </tr>"""
        section_html += f"""
        <h3>{section['title']}</h3>
        <table><thead><tr><th>Check</th><th>Risk</th><th>Detail</th></tr></thead>
        <tbody>{rows}</tbody></table>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TeamGraph AI — Health Report</title>
<style>
  *{{margin:0;padding:0;box-sizing:border-box;}}
  body{{font-family:'Inter','Segoe UI',system-ui,sans-serif;background:#0a0a0a;color:#e2e8f0;padding:2rem;}}
  h1{{font-size:1.8rem;margin-bottom:0.5rem;}}
  h2{{font-size:1.3rem;margin:2rem 0 1rem;color:#60a5fa;border-bottom:1px solid #1e293b;padding-bottom:0.5rem;}}
  h3{{font-size:1.1rem;margin:1.5rem 0 0.5rem;color:#a78bfa;}}
  table{{width:100%;border-collapse:collapse;margin-bottom:1rem;}}
  th,td{{text-align:left;padding:0.6rem 0.8rem;border-bottom:1px solid #1e293b;font-size:0.9rem;}}
  th{{color:#94a3b8;font-weight:600;}}
  .score-ring{{display:inline-flex;align-items:center;justify-content:center;width:120px;height:120px;border-radius:50%;border:6px solid {color};font-size:2rem;font-weight:700;margin:1rem 0;}}
  .meta{{color:#64748b;font-size:0.85rem;margin-bottom:1.5rem;}}
  .meta span{{margin-right:1.5rem;}}
</style>
</head>
<body>
<h1>🏥 TeamGraph AI — Project Health Report</h1>
<div class="meta">
  <span>📅 {data['timestamp']}</span>
  <span>🔗 {data['commit_sha']}</span>
  <span>🌿 {data['branch']}</span>
</div>
<div class="score-ring">{score}</div>
<span style="font-size:1.2rem;margin-left:1rem;">/100 — {_score_badge(score)}</span>

<h2>📊 Category Scores</h2>
<table><thead><tr><th>Category</th><th>Score</th><th>Progress</th></tr></thead>
<tbody>{cat_rows}</tbody></table>

{section_html}

<p style="color:#475569;margin-top:3rem;font-size:0.8rem;">Generated by <code>scripts/project_health.py</code></p>
</body></html>"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="TeamGraph AI Project Health Report")
    parser.add_argument("--ci", action="store_true", help="Exit non-zero on critical failures")
    args = parser.parse_args()

    print("🏥 TeamGraph AI — Project Health Report Generator")
    print("=" * 55)

    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    sections = []
    categories = []
    all_results: list[CheckResult] = []
    recommendations: list[str] = []
    coverage_data: dict = {}

    # 1. Functional
    print("\n⚡ Running functional correctness checks...")
    func_results, func_score = run_functional_checks()
    sections.append({"title": "⚡ Functional Correctness", "checks": [c.to_dict() for c in func_results]})
    categories.append({"name": "Functional Correctness", "score": func_score, "max": 25})
    all_results.extend(func_results)

    # 2. Coverage
    print("📈 Running coverage checks...")
    cov_results, cov_score, coverage_data = run_coverage_checks()
    sections.append({"title": "📈 Test Coverage", "checks": [c.to_dict() for c in cov_results]})
    categories.append({"name": "Test Coverage", "score": cov_score, "max": 20})
    all_results.extend(cov_results)

    # 3. Security
    print("🔒 Running security checks...")
    sec_results, sec_score = run_security_checks()
    sections.append({"title": "🔒 Security", "checks": [c.to_dict() for c in sec_results]})
    categories.append({"name": "Security", "score": sec_score, "max": 20})
    all_results.extend(sec_results)

    # 4. Code Quality
    print("🧹 Running code quality checks...")
    qual_results, qual_score = run_code_quality_checks()
    sections.append({"title": "🧹 Code Quality", "checks": [c.to_dict() for c in qual_results]})
    categories.append({"name": "Code Quality", "score": qual_score, "max": 15})
    all_results.extend(qual_results)

    # 5. Performance
    print("⚡ Running performance checks...")
    perf_results, perf_score = run_performance_checks()
    sections.append({"title": "🚀 Performance", "checks": [c.to_dict() for c in perf_results]})
    categories.append({"name": "Performance", "score": perf_score, "max": 10})
    all_results.extend(perf_results)

    # 6. Reliability
    print("🔧 Running reliability checks...")
    rel_results, rel_score = run_reliability_checks()
    sections.append({"title": "🔧 Reliability", "checks": [c.to_dict() for c in rel_results]})
    categories.append({"name": "Reliability", "score": rel_score, "max": 5})
    all_results.extend(rel_results)

    # 7. OSS Readiness
    print("📋 Running open-source readiness checks...")
    oss_results, oss_score = run_oss_readiness_checks()
    sections.append({"title": "📋 Open-Source Readiness", "checks": [c.to_dict() for c in oss_results]})
    categories.append({"name": "Open-Source Readiness", "score": oss_score, "max": 5})
    all_results.extend(oss_results)

    # Overall score
    overall_score = round(sum(c["score"] for c in categories), 1)

    # Generate recommendations
    if any(c.risk == "critical" and not c.passed for c in all_results):
        recommendations.append("🔴 **CRITICAL**: Remove committed secrets (.env, .pem files) from git history immediately and rotate all affected credentials.")
    if coverage_data.get("statement", 0) < 60:
        recommendations.append("📈 Increase API test coverage to at least 60%. Add tests for auth, context upload, approval, and MCP flows.")
    if not _file_exists("CONTRIBUTING.md"):
        recommendations.append("📝 Add CONTRIBUTING.md with development setup and PR guidelines.")
    if not _file_exists("SECURITY.md"):
        recommendations.append("🔒 Add SECURITY.md with vulnerability reporting instructions.")
    if not _file_exists("CODE_OF_CONDUCT.md"):
        recommendations.append("🤝 Add CODE_OF_CONDUCT.md for community guidelines.")

    # Build report data
    data = {
        "project": "TeamGraph AI",
        "timestamp": _ts(),
        "commit_sha": _git_sha(),
        "branch": _git_branch(),
        "overall_score": overall_score,
        "categories": categories,
        "sections": sections,
        "coverage": coverage_data,
        "recommendations": recommendations,
    }

    # Write reports
    md_path = REPORT_DIR / "health-report.md"
    json_path = REPORT_DIR / "health-report.json"
    html_path = REPORT_DIR / "health-report.html"

    md_path.write_text(generate_markdown(data), encoding="utf-8")
    json_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    html_path.write_text(generate_html(data), encoding="utf-8")

    print(f"\n{'=' * 55}")
    print(f"📊 Overall Score: {overall_score}/100 {_score_badge(overall_score)}")
    print(f"{'=' * 55}")
    for cat in categories:
        icon = "✅" if cat["score"] >= cat["max"] * 0.7 else ("⚠️" if cat["score"] >= cat["max"] * 0.4 else "❌")
        print(f"  {icon} {cat['name']}: {cat['score']}/{cat['max']}")
    print(f"\n📄 Reports written to: {REPORT_DIR}")
    print(f"   - {md_path.name}")
    print(f"   - {json_path.name}")
    print(f"   - {html_path.name}")

    # CI mode: exit non-zero on critical failures
    if args.ci:
        critical_failures = [c for c in all_results if not c.passed and c.risk == "critical"]
        if critical_failures:
            print(f"\n🔴 CI FAILURE: {len(critical_failures)} critical issue(s) found:")
            for c in critical_failures:
                print(f"   - {c.name}: {c.detail[:100]}")
            sys.exit(1)
        print("\n✅ CI: No critical failures.")

    return overall_score


if __name__ == "__main__":
    main()
