from database import neo4j_db
import uuid
import datetime

def run_optimizer(project: str | None = None):
    run_id = f"opt_{uuid.uuid4().hex[:12]}"
    now = datetime.datetime.utcnow().isoformat()
    
    # Simple heuristic optimization for P0
    # 1. Update retrieval priority for recent context
    opt_query = """
    MATCH (c:Context)
    WHERE c.status = 'trusted'
    SET c.retrievalPriority = CASE
        WHEN c.createdAt > datetime() - duration('P7D') THEN 1.0
        ELSE 0.5
    END
    RETURN count(c) as updated_count
    """
    res = neo4j_db.execute_query(opt_query)
    updated = res[0]["updated_count"] if res else 0
    
    # 2. Record run
    run_query = """
    CREATE (g:GraphOptimizationRun {
        id: $run_id,
        mode: 'manual',
        summary: $summary,
        changesApplied: $changes,
        createdAt: $now
    })
    RETURN g
    """
    neo4j_db.execute_query(run_query, {
        "run_id": run_id,
        "summary": "Ran heuristic priority optimization.",
        "changes": updated,
        "now": now
    })
    
    return {
        "run_id": run_id,
        "status": "success",
        "changes": updated,
        "summary": "Ran heuristic priority optimization."
    }
