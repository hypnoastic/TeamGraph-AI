from pydantic import BaseModel
from typing import List, Optional
import uuid
import datetime
from database import neo4j_db
from services.curator.graph_harness import curate_context
import json

class UploadContextRequest(BaseModel):
    title: str
    content: str
    project: str | None = None
    type: str = "note"
    visibility: str = "project"
    source: str = "api"
    sourceType: str = "mcp_upload"
    tags: List[str] = []

def process_upload(request: UploadContextRequest, user: dict):
    raw_id = f"raw_{uuid.uuid4().hex[:12]}"
    now = datetime.datetime.utcnow().isoformat()
    
    # 1. Create RawContext
    raw_query = """
    MATCH (u:User {id: $user_id})
    CREATE (r:RawContext {
        id: $raw_id,
        title: $title,
        content: $content,
        source: $source,
        sourceType: $sourceType,
        visibilityRequested: $visibility,
        createdAt: $now
    })
    MERGE (u)-[:UPLOADED]->(r)
    RETURN r
    """
    neo4j_db.execute_query(raw_query, {
        "user_id": user["id"],
        "raw_id": raw_id,
        "title": request.title,
        "content": request.content,
        "source": request.source,
        "sourceType": request.sourceType,
        "visibility": request.visibility,
        "now": now
    })
    
    # 2. Curator Harness
    input_data = {
        "raw_context_id": raw_id,
        "uploaded_by": user["email"],
        "project": request.project,
        "visibility_requested": request.visibility,
        "content": request.content,
        "title": request.title
    }
    
    curator_output = curate_context(input_data)
    
    # 3. Create CuratorRun
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    run_query = """
    MATCH (r:RawContext {id: $raw_id})
    CREATE (c:CuratorRun {
        id: $run_id,
        mode: 'auto',
        laneDecision: $lane,
        confidence: $confidence,
        createdAt: $now
    })
    MERGE (r)-[:ANALYZED_BY]->(c)
    """
    neo4j_db.execute_query(run_query, {
        "raw_id": raw_id,
        "run_id": run_id,
        "lane": curator_output.lane.decision,
        "confidence": curator_output.relationships[0].confidence if curator_output.relationships else 1.0,
        "now": now
    })
    
    # 4. Apply Graph Changes based on Lane
    decision = curator_output.lane.decision
    
    if decision == "auto_curate":
        ctx_id = f"ctx_{uuid.uuid4().hex[:12]}"
        ctx_query = """
        MATCH (r:RawContext {id: $raw_id})
        CREATE (c:Context {
            id: $ctx_id,
            title: $title,
            type: $type,
            summary: $summary,
            content: $content,
            visibility: $visibility,
            qualityScore: $quality,
            status: 'trusted',
            createdAt: $now,
            updatedAt: $now
        })
        MERGE (r)-[:CURATED_INTO]->(c)
        """
        neo4j_db.execute_query(ctx_query, {
            "raw_id": raw_id,
            "ctx_id": ctx_id,
            "title": curator_output.classification.canonical_title,
            "type": curator_output.classification.context_type,
            "summary": curator_output.classification.summary,
            "content": request.content,
            "visibility": curator_output.classification.suggested_visibility,
            "quality": curator_output.quality.score,
            "now": now
        })
        
        if request.project:
            proj_query = """
            MATCH (c:Context {id: $ctx_id})
            MATCH (p:Project {name: $project})
            MERGE (c)-[:BELONGS_TO]->(p)
            MERGE (p)-[:HAS_CONTEXT]->(c)
            """
            neo4j_db.execute_query(proj_query, {"ctx_id": ctx_id, "project": request.project})
            
    elif decision in ["review", "quarantine"]:
        rev_id = f"rev_{uuid.uuid4().hex[:12]}"
        rev_status = "quarantined" if decision == "quarantine" else "pending"
        rel_type = "QUARANTINED_AS" if decision == "quarantine" else "QUEUED_AS"
        
        rev_query = f"""
        MATCH (r:RawContext {{id: $raw_id}})
        CREATE (ri:ReviewItem {{
            id: $rev_id,
            status: $status,
            reason: $reason,
            riskTags: $risk_tags,
            qualityScore: $quality,
            createdAt: $now,
            proposedOperations: $ops
        }})
        MERGE (r)-[:{rel_type}]->(ri)
        """
        neo4j_db.execute_query(rev_query, {
            "raw_id": raw_id,
            "rev_id": rev_id,
            "status": rev_status,
            "reason": curator_output.lane.reason,
            "risk_tags": curator_output.safety.risk_tags,
            "quality": curator_output.quality.score,
            "ops": json.dumps([op.model_dump() for op in curator_output.graph_operations]),
            "now": now
        })
        
    return {
        "status": "success",
        "raw_id": raw_id,
        "decision": decision,
        "reason": curator_output.lane.reason
    }
