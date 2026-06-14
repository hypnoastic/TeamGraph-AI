export type HealthResponse = {
  status: string;
  service: string;
  postgres: {
    status: string;
  };
  neo4j: {
    status: string;
    reason?: string;
  };
  graphiti: {
    mode: string;
    provider: string;
    status: string;
    reason?: string | null;
    initialized_at?: string | null;
    group_id: string;
  };
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

export type BrainCitation = {
  context_id?: string | null;
  graphiti_episode_uuid?: string | null;
  title: string;
  summary?: string | null;
  source_type?: string | null;
  project_name?: string | null;
  uploader_email?: string | null;
  created_at?: string | null;
  score?: number | null;
};

export type RelatedFact = {
  id: string;
  label: string;
  kind: string;
  summary?: string | null;
};

export type BrainResponse = {
  answer: string;
  confidence: number;
  citations: BrainCitation[];
  related_facts: RelatedFact[];
  timeline: Array<{ event: string; context_id?: string | null }>;
  suggested_next_actions: string[];
  mode: string;
  provider: string;
};

export type InboxItem = {
  raw: Record<string, any>;
  context?: Record<string, any> | null;
  review_item?: Record<string, any> | null;
  lane: string;
};

export type ApiKeyRecord = {
  id: string;
  key_prefix: string;
  purpose: string;
  scopes: string[];
  status: string;
  project_name?: string | null;
  created_at: string;
  last_used_at?: string | null;
  raw_key?: string | null;
};

export type GraphVisualization = {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    meta?: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    summary?: string;
    projectName?: string;
    sourceType?: string;
    createdAt?: string;
  }>;
};

export type ConnectorRecord = {
  key: string;
  name: string;
  description: string;
  state: string;
  mode: string;
  todo: string;
  auth_url?: string | null;
  ready?: boolean;
  connected_account?: string | null;
  last_synced_at?: string | null;
};

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  projects: string[];
};

export type ActivityRecord = {
  id: string;
  type: string;
  title: string;
  description: string;
  actorId?: string | null;
  actorEmail?: string | null;
  metadataJson?: string | null;
  createdAt: string;
};
