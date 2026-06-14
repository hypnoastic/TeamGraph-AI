from typing import Any

from database import neo4j_db


def list_team_members() -> list[dict[str, Any]]:
    query = """
    MATCH (o:Organization {id: 'org_1'})-[:HAS_MEMBER]->(u:User)
    OPTIONAL MATCH (u)-[:CAN_ACCESS]->(p:Project)
    RETURN u, collect(DISTINCT p.name) AS projects
    ORDER BY u.role ASC, u.email ASC
    """
    results = neo4j_db.execute_query(query)
    members: list[dict[str, Any]] = []
    for record in results:
        user = record["u"]
        members.append(
            {
                "id": user.get("id"),
                "email": user.get("email"),
                "name": user.get("name", user.get("email")),
                "role": user.get("role", "member"),
                "projects": [project for project in record.get("projects", []) if project],
            }
        )
    return members


def get_user_project_names(user: dict) -> list[str]:
    if user.get("role") == "admin":
        query = "MATCH (p:Project) RETURN p.name AS name ORDER BY p.name ASC"
        results = neo4j_db.execute_query(query)
        return [record["name"] for record in results]

    query = """
    MATCH (u:User {id: $user_id})-[:CAN_ACCESS]->(p:Project)
    RETURN p.name AS name
    ORDER BY p.name ASC
    """
    results = neo4j_db.execute_query(query, {"user_id": user.get("id")})
    names = [record["name"] for record in results]
    return names or user.get("project_names", [])


def user_can_access_project(user: dict, project_name: str | None) -> bool:
    if not project_name:
        return True
    if user.get("role") == "admin":
        return True
    return project_name in get_user_project_names(user)
