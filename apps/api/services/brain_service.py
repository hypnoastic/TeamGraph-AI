from pydantic import BaseModel
from typing import List
from database import neo4j_db
from config import settings
from google import genai
import json

class BrainQueryRequest(BaseModel):
    query: str
    project: str | None = None

class Citation(BaseModel):
    context_id: str
    title: str

class TimelineEvent(BaseModel):
    event: str
    context_id: str

class BrainQueryResponse(BaseModel):
    answer: str
    confidence: float
    citations: List[Citation]
    related_nodes: List[str]
    timeline: List[TimelineEvent]
    suggested_next_actions: List[str]

def execute_brain_query(request: BrainQueryRequest, user: dict) -> BrainQueryResponse:
    # 1. Retrieve Graph Context
    query = """
    CALL db.index.fulltext.queryNodes("context_title", $query) YIELD node, score
    MATCH (node)-[r]-(related)
    WHERE node.status = 'trusted'
    RETURN node, score, collect(related.title) as related_titles
    ORDER BY score DESC LIMIT 5
    """
    # For simplicity without fulltext index, we do a basic search
    basic_query = """
    MATCH (c:Context)
    WHERE c.status = 'trusted' AND toLower(c.content) CONTAINS toLower($query) OR toLower(c.title) CONTAINS toLower($query)
    RETURN c
    LIMIT 5
    """
    
    results = neo4j_db.execute_query(basic_query, {"query": request.query})
    
    contexts = [rec["c"] for rec in results]
    
    citations = [{"context_id": c["id"], "title": c["title"]} for c in contexts]
    related_nodes = list(set([c.get("project", "General") for c in contexts]))
    
    # 2. Synthesize Answer
    if not contexts:
        return BrainQueryResponse(
            answer="I couldn't find any relevant context in the live brain for your query.",
            confidence=0.0,
            citations=[],
            related_nodes=[],
            timeline=[],
            suggested_next_actions=["Upload relevant context using the MCP CLI."]
        )
        
    context_text = "\n\n".join([f"Title: {c['title']}\nSummary: {c['summary']}\nContent: {c['content']}" for c in contexts])
    
    answer_text = ""
    if settings.gemini_api_key:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = f"""
        You are the Brain Answerer for TeamGraph AI.
        Answer the user's query using ONLY the provided context from the Neo4j live brain.
        
        Query: {request.query}
        
        Context:
        {context_text}
        
        Return a clear, concise answer.
        """
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt
        )
        answer_text = response.text
    else:
        answer_text = f"[Mock Answer based on {len(contexts)} sources]\n\n" + contexts[0].get("summary", "No summary available.")
        
    return BrainQueryResponse(
        answer=answer_text,
        confidence=0.9,
        citations=citations,
        related_nodes=related_nodes,
        timeline=[],
        suggested_next_actions=["Run graph optimizer to improve retrieval."]
    )
