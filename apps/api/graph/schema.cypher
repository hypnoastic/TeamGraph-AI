// constraints and indexes

CREATE CONSTRAINT organization_id IF NOT EXISTS
FOR (o:Organization) REQUIRE o.id IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT user_email IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

CREATE CONSTRAINT project_id IF NOT EXISTS
FOR (p:Project) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT raw_context_id IF NOT EXISTS
FOR (r:RawContext) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT context_id IF NOT EXISTS
FOR (c:Context) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT review_item_id IF NOT EXISTS
FOR (r:ReviewItem) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT curator_run_id IF NOT EXISTS
FOR (c:CuratorRun) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT api_key_ref_id IF NOT EXISTS
FOR (k:ApiKeyRef) REQUIRE k.id IS UNIQUE;

CREATE CONSTRAINT tag_name IF NOT EXISTS
FOR (t:Tag) REQUIRE t.name IS UNIQUE;

CREATE INDEX context_title IF NOT EXISTS
FOR (c:Context) ON (c.title);

CREATE INDEX context_type IF NOT EXISTS
FOR (c:Context) ON (c.type);

CREATE INDEX context_status IF NOT EXISTS
FOR (c:Context) ON (c.status);

CREATE INDEX context_visibility IF NOT EXISTS
FOR (c:Context) ON (c.visibility);

CREATE INDEX raw_context_source IF NOT EXISTS
FOR (r:RawContext) ON (r.sourceType);

CREATE INDEX review_status IF NOT EXISTS
FOR (r:ReviewItem) ON (r.status);
