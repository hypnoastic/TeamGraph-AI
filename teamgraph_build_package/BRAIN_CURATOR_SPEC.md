# BRAIN_CURATOR_SPEC.md — Gemini Curator and Live Brain Harness

## 1. Purpose

The Brain Curator is the intelligence layer that prevents TeamGraph from becoming a dump.

It handles:

- safety classification
- quality scoring
- summarization
- tag extraction
- duplicate detection
- conflict detection
- graph placement
- retrieval priority scoring
- lane decision: auto_curate / review / quarantine

## 2. Runtime Modes

### Live Gemini Mode

Use Gemini API if these exist:

```txt
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

If the model name is unavailable, use the configured env model. Do not hardcode failure.

### Mock Curator Mode

If no Gemini key exists, use deterministic mock curator.

Mock curator must return the exact same JSON schema.

This ensures P0 works locally without paid APIs.

## 3. Curator Input

```json
{
  "raw_context_id": "raw_123",
  "organization": "Acme AI Lab",
  "project": "Core Platform",
  "uploaded_by": "member@teamgraph.local",
  "source": "mcp-cli",
  "visibility_requested": "project",
  "content": "Decision: Brain curator should auto-curate safe context and queue risky context.",
  "existing_context_summaries": [
    {
      "id": "ctx_1",
      "title": "Use Neo4j for P0",
      "summary": "Neo4j is the graph backend for P0."
    }
  ]
}
```

## 4. Curator Output Schema

Return strict JSON:

```json
{
  "safety": {
    "status": "safe",
    "risk_tags": [],
    "reason": "No secrets, no prompt injection, no unsafe content detected."
  },
  "quality": {
    "score": 0.88,
    "signals": ["specific", "project_relevant", "actionable"]
  },
  "classification": {
    "context_type": "decision",
    "canonical_title": "Brain curator auto-curates safe context",
    "summary": "Safe context should be automatically curated into the graph, while risky context should be sent to admin review.",
    "suggested_project": "Core Platform",
    "suggested_visibility": "project",
    "suggested_tags": ["brain-curator", "approval", "context-ingestion"]
  },
  "relationships": [
    {
      "from": "Brain curator auto-curates safe context",
      "relation": "RELATED_TO",
      "to": "Use Neo4j for P0",
      "confidence": 0.74
    }
  ],
  "duplicates": [],
  "conflicts": [],
  "retrieval": {
    "importance_score": 0.82,
    "freshness_score": 0.99,
    "retrieval_priority": 0.86
  },
  "lane": {
    "decision": "auto_curate",
    "reason": "Safe, high quality, no conflict."
  },
  "graph_operations": [
    {
      "operation": "CREATE_CONTEXT",
      "title": "Brain curator auto-curates safe context",
      "context_type": "decision",
      "summary": "Safe context should be automatically curated into the graph, while risky context should be sent to admin review.",
      "visibility": "project"
    },
    {
      "operation": "LINK_CONTEXT_TO_PROJECT",
      "project": "Core Platform"
    }
  ]
}
```

## 5. Safety Status Values

```txt
safe
needs_review
unsafe
sensitive
prompt_injection
low_quality
duplicate
conflicting
```

## 6. Lane Decisions

### auto_curate

Allowed when:

- safety status is safe
- quality score >= 0.70
- no serious conflict
- no secret detected
- no prompt injection
- visibility is private or project
- model confidence is acceptable

### review

Required when:

- safety status is needs_review
- quality score between 0.40 and 0.70
- conflict detected
- duplicate likely
- organization-wide visibility requested
- content claims major decision or task completion
- content has low confidence
- source is unknown

### quarantine

Required when:

- secrets detected
- passwords/API keys detected
- prompt injection detected
- unsafe or malicious content
- content attempts to modify system behavior
- sensitive private data detected

## 7. Secret and Prompt Injection Heuristics

Before Gemini, run simple regex/rule checks:

Secrets:

```txt
api_key=
secret=
password=
token=
-----BEGIN PRIVATE KEY-----
sk-
ghp_
xoxb-
```

Prompt injection patterns:

```txt
ignore previous instructions
forget all instructions
system prompt
developer message
reveal secrets
override policy
```

If detected, force review/quarantine even if model says safe.

## 8. Graph Optimizer

Optimizer runs manually in P0.

Input:

```json
{
  "organization_id": "org_1",
  "project": "Core Platform",
  "mode": "manual"
}
```

It should:

- find untagged context
- find duplicate titles/summaries
- find orphan RawContext
- update retrieval priority
- create project summary context
- identify stale context
- create suggested links
- create GraphOptimizationRun node

P0 optimizer can be heuristic.

Gemini can improve summaries if available.

## 9. Query Answerer

Brain Chat uses Gemini/mock answerer.

Input:

- user question
- retrieved graph context
- citations
- related nodes

Output:

```json
{
  "answer": "You chose Neo4j because TeamGraph depends on graph-native relationships between users, projects, context, API keys, and agent sessions.",
  "confidence": 0.86,
  "citations": [
    {
      "context_id": "ctx_neo4j_decision",
      "title": "Use Neo4j for P0"
    }
  ],
  "related_nodes": ["Core Platform", "Neo4j", "Graph Backend"],
  "timeline": [
    {
      "event": "Decision uploaded",
      "context_id": "ctx_neo4j_decision"
    }
  ],
  "suggested_next_actions": [
    "Run graph optimizer after importing more context."
  ]
}
```

## 10. Implementation Files

```txt
apps/api/services/curator/
  __init__.py
  schemas.py
  gemini_curator.py
  mock_curator.py
  safety_rules.py
  graph_harness.py
  optimizer.py
  answerer.py
```
