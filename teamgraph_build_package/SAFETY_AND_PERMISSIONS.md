# SAFETY_AND_PERMISSIONS.md — Safety, Access Control, and Curator Harness

## 1. Roles

Only two roles in P0:

```txt
admin
member
```

## 2. Admin Capabilities

Admin can:

- manage team
- manage dummy connectors
- create/revoke any API key
- query brain across org
- view graph
- view all context lanes
- approve/reject/edit review items
- run optimizer
- view activity

## 3. Member Capabilities

Member can:

- query accessible graph context
- create own API key if enabled
- upload context
- use MCP CLI
- view own uploads
- view project context
- cannot approve risky context
- cannot manage team
- cannot manage connectors
- cannot access another user’s private context

## 4. API Key Scopes

```txt
context:read
context:upload
graph:read
mcp:connect
brain:query
optimizer:run
```

P0 default:

- admin keys can get all scopes
- member keys get context:read, context:upload, graph:read, mcp:connect, brain:query

Only admin can run optimizer from UI. CLI optimize requires `optimizer:run`.

## 5. Context Visibility

```txt
private       → uploader + admin only
project       → project users + admin
organization  → organization users + admin
```

## 6. Curator Safety Harness

The model can only produce structured proposal JSON.

Backend validates:

- operation type allowlist
- node type allowlist
- relation type allowlist
- user permissions
- project scope
- visibility
- safety status

## 7. Allowed Operations

```txt
CREATE_CONTEXT
CREATE_TAG
LINK_CONTEXT_TO_PROJECT
LINK_CONTEXT_TO_USER_GRAPH
LINK_RELATED_CONTEXT
MARK_DUPLICATE
MARK_CONFLICT
UPDATE_CONTEXT_SUMMARY
UPDATE_RETRIEVAL_PRIORITY
CREATE_REVIEW_ITEM
QUARANTINE_CONTEXT
SUGGEST_MERGE
```

## 8. Blocked Operations

```txt
DELETE_USER
DELETE_ORGANIZATION
DELETE_PROJECT
DELETE_RAW_CONTEXT
REMOVE_EVIDENCE
CHANGE_PERMISSIONS
REVOKE_API_KEY
RUN_RAW_CYPHER
OVERWRITE_RAW_CONTEXT
AUTO_APPROVE_UNSAFE
```

## 9. Secret Detection

Before model call, check for:

```txt
password=
api_key=
secret=
token=
-----BEGIN PRIVATE KEY-----
sk-
ghp_
xoxb-
```

If matched, force review/quarantine.

## 10. Prompt Injection Detection

Check for:

```txt
ignore previous instructions
forget all previous instructions
system prompt
developer message
reveal your prompt
override policy
```

If matched, force quarantine or review.

## 11. Admin Review Required

Review required for:

- unsafe/sensitive content
- possible secrets
- prompt injection
- conflicts with existing decision
- low quality
- organization-wide context from member
- major decision
- task completion claim
- low confidence curator output

## 12. Auto-curation Allowed

Auto-curate when:

- safe
- quality score >= 0.70
- no conflict
- no secret
- no prompt injection
- project/private visibility
- valid project scope
