export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  org_id: string | null;
  org_name: string | null;
  project_ids: string[];
  project_names: string[];
  is_demo: boolean;
  onboarding_required: boolean;
};

export type Project = { id: string; name: string; visibility: string };

export type HealthResponse = {
  status: string;
  service: string;
  postgres: { status: string };
  neo4j: { status: string; reason?: string };
  graphiti: { mode: string; provider: string; status: string; reason?: string | null; initialized_at?: string | null; group_id: string };
};

export type SettingsResponse = {
  organization: string;
  postgres_status: string;
  neo4j_status: string;
  graphiti_mode: string;
  graphiti_provider: string;
  graphiti_reason?: string | null;
  latest_episode_ingested?: string | null;
  pending_approvals: number;
  auto_curated_count: number;
  quarantined_count: number;
  project_count: number;
  raw_context_count: number;
  gemini_mode: string;
};

export type BrainCitation = { context_id?: string | null; graphiti_episode_uuid?: string | null; title: string; summary?: string | null; source_type?: string | null; project_name?: string | null; uploader_email?: string | null; created_at?: string | null; score?: number | null };
export type RelatedFact = { id: string; label: string; kind: string; summary?: string | null };
export type BrainResponse = { answer: string; confidence: number; citations: BrainCitation[]; related_facts: RelatedFact[]; timeline: Array<{ event: string; context_id?: string | null }>; suggested_next_actions: string[]; mode: string; provider: string };

export type RawContext = { id: string; title: string; content: string; sourceType: string; contextType: string; projectRequested?: string | null; createdAt: string; approvalStatus: string };
export type CuratedContext = { id: string; brainMode: string; graphitiEpisodeUuid?: string | null; summary?: string; projectName?: string | null };
export type ReviewItem = { id: string; reason: string; riskTags: string[]; qualityScore: number; status: string };
export type InboxItem = { raw: RawContext; context?: CuratedContext | null; review_item?: ReviewItem | null; lane: string };

export type ApiKeyRecord = { id: string; key_prefix: string; purpose: string; scopes: string[]; status: string; project_name?: string | null; created_at: string; last_used_at?: string | null; raw_key?: string | null };
export type GraphVisualization = {
  nodes: Array<{ id: string; label: string; type: string; meta?: JsonObject }>;
  edges: Array<{ id: string; source: string; target: string; label: string }>;
  timeline: Array<{ id: string; title: string; summary?: string; projectName?: string; sourceType?: string; createdAt?: string }>;
};
export type ConnectorRecord = { key: string; name: string; description: string; state: string; mode: string; todo: string; auth_url?: string | null; ready?: boolean; connected_account?: string | null; last_synced_at?: string | null };
export type TeamMember = { id: string; email: string; name: string; role: string; projects: string[]; project_ids?: string[] };
export type TeamInvitation = { id: string; email: string; role: string; status: string; project_ids: string[]; expires_at: string };
export type ActivityRecord = { id: string; type: string; title: string; description: string; actorId?: string | null; actorEmail?: string | null; metadataJson?: string | null; createdAt: string };
export type DashboardSummary = {
  trusted_memories: number;
  pending_approvals: number;
  projects: number;
  agent_keys: number;
  recent_context: Array<{ id: string; title: string; type: string; source: string; project?: string | null; created_at: string }>;
  recent_activity: ActivityRecord[];
};
