from typing import Optional

from fastapi import Depends, Header, HTTPException


def _build_user(id: str, email: str, role: str, project_ids: list[str], project_names: list[str]) -> dict:
    return {
        "id": id,
        "email": email,
        "role": role,
        "org_id": "org_1",
        "org_name": "Acme AI Lab",
        "project_ids": project_ids,
        "project_names": project_names,
    }


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ")[1]

    if token == "demo_admin_token":
        return _build_user(
            "usr_admin",
            "admin@teamgraph.local",
            "admin",
            ["proj_1", "proj_2"],
            ["Core Platform", "Agent Workflows"],
        )
    if token == "demo_member_token":
        return _build_user(
            "usr_member",
            "member@teamgraph.local",
            "member",
            ["proj_1"],
            ["Core Platform"],
        )

    raise HTTPException(status_code=401, detail="Invalid token")


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
