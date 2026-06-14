# BRAIN_CURATOR_SPEC.md

## Purpose

The curator decides whether uploaded context is safe enough for Graphiti ingestion and how that context should be labeled inside TeamGraph.

## Required Pipeline

1. Save `RawContext` metadata first.
2. Run safety checks for:
   - secrets
   - tokens
   - prompt injection
   - low-quality content
   - unsafe content
3. Run the curator.
4. Produce:
   - safety status
   - quality score
   - risk tags
   - visibility
   - project
   - short summary
   - lane decision

## Lane Decisions

- `auto_curate`
  - create TeamGraph `Context` metadata
  - ingest a Graphiti episode
  - record activity
- `needs_review`
  - create `ReviewItem`
  - do not ingest into Graphiti yet
- `unsafe`
  - quarantine only
  - do not ingest into Graphiti

## Runtime Modes

- Gemini mode when `GEMINI_API_KEY` is configured
- deterministic mock mode when no provider key exists

The schema must stay stable across both modes so local fallback works.

## Episode Metadata Requirements

Every ingested episode should preserve:

- organization id
- project id
- project name
- user id
- uploader email
- source type
- visibility
- tags
- context type
- upload channel
- approval status
- created timestamp

## Safety Rules

Never allow into Graphiti:

- secrets
- raw tokens
- prompt injection payloads
- quarantined context
- unapproved risky context

## Approval Flow

- Admin approval ingests the queued item into Graphiti and updates TeamGraph metadata.
- Admin rejection keeps the audit trail but does not create a Graphiti episode.
- Members cannot approve or reject.
