# UI_STITCH_DESIGN_BRIEF.md — TeamGraph Live Brain UI

## 1. Design Goal

Design a simple, dark, premium web app for a live organization context brain.

The app should feel like:

- calm
- minimal
- technical
- premium
- graph-native
- trustworthy
- developer-friendly
- not overdone

It should not feel like a generic SaaS template.

## 2. References

Use as inspiration, not copying:

- Award-winning minimal websites: clean hierarchy, spacing, restraint.
- Clean dark websites: high contrast and simple layout.
- Raycast-like productivity polish: command-style workflow, speed, technical clarity.
- Linear-like restraint: subtle borders, quiet cards, confident spacing.
- Cursor-like developer workflow: code/config blocks, AI-agent clarity.

## 3. Visual Style

Colors:

```txt
Background: #07080A, #0B0D10
Cards: #12151A, #171B21
Borders: rgba(255,255,255,0.08)
Text primary: #F5F7FA
Text secondary: #A7AFBC
Muted: #6F7785

Brain/Graph: #7DD3FC
MCP/API: #A78BFA
Safe: #22C55E
Review/Warning: #F59E0B
Unsafe/Revoke: #F43F5E
```

Typography:

- Inter, Geist, or system sans
- restrained headings
- readable body text
- compact uppercase labels
- monospaced code blocks

Motion:

- page fade
- card hover
- graph node pulse
- curator status transition
- API key reveal
- review approval animation

## 4. Pages to Design

1. Landing
2. Login
3. Brain Chat
4. Graph
5. Context Inbox
6. Approvals
7. API Keys
8. Connectors
9. Team
10. Activity/Settings

## 5. Stitch Prompt

Paste this into Stitch MCP:

```txt
Design a dark, minimal, premium web app called TeamGraph AI.

TeamGraph AI is a live organization context brain for humans and AI agents. It ingests context from dummy connectors, MCP uploads, and future workplace tools; stores raw context; uses a Gemini curator to classify safety, summarize, tag, detect duplicates/conflicts, and place context into a Neo4j graph; then lets users chat with the approved graph and lets external AI agents retrieve context through an npm MCP CLI.

The app is not a generic chatbot and not a generic SaaS dashboard. It is a control plane for a live context brain.

Style:
Clean dark UI inspired by award-winning minimal websites, Raycast-like productivity polish, Linear-like restraint, and Cursor-like technical clarity. Do not copy any brand. Use near-black backgrounds, charcoal panels, subtle borders, high-contrast text, clean icons, and restrained accents.

Screens:
1. Landing page with headline: "A live context brain for every teammate and every AI agent." Show architecture: Connectors + MCP Uploads → Raw Context → Gemini Curator → Review/Auto-curate → Neo4j Brain Graph → Brain Chat + MCP Agents.
2. Login page with demo admin/member login.
3. Brain Chat main page with chat area, source-backed answer, related graph nodes, citations, confidence, and timeline side panel.
4. Graph page with Neo4j-style graph visualization, filters for Raw/Curated/Pending/Unsafe/UserGraph/ProjectGraph, selected node details.
5. Context Inbox with lanes: Auto-curated, Pending review, Quarantined, Duplicate/conflict.
6. Approvals page with curator summary, risk tags, proposed graph operations, approve/reject/edit actions.
7. API Keys page with scoped key creation, one-time reveal, revoke, MCP config block.
8. Connectors page with dummy cards for Slack, GitHub, Google Drive, Notion, Jira, Teams, Outlook, Docs Upload.
9. Team page with admin/member access.
10. Activity/settings page with curator runs, MCP calls, graph optimizer status.

Components:
Sidebar, topbar, role badge, brain chat panel, source citation card, graph canvas, node details drawer, context lane board, approval card, API key card, code block, connector card, activity feed.

Make the UI simple, polished, and buildable in Next.js + Tailwind.
```
