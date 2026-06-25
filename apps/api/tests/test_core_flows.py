import os

from models import ApiKeyRecord
from postgres import SessionLocal

def test_auth_organization_context_and_mcp(client):
    signup = client.post(
        "/auth/signup",
        json={"name": "Test Admin", "email": "admin@example.com", "password": "password123"},
    )
    assert signup.status_code == 200, signup.text
    token = signup.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert signup.json()["user"]["onboarding_required"]

    setup = client.post(
        "/onboarding/organization",
        headers=headers,
        json={"organization_name": "Test Lab", "project_name": "Core Platform"},
    )
    assert setup.status_code == 200, setup.text
    project_id = setup.json()["project"]["id"]

    upload = client.post(
        "/context/upload",
        headers=headers,
        json={
            "title": "Release process",
            "content": "Releases use a staged rollout with health checks and an automatic rollback window.",
            "project": project_id,
            "visibility": "project",
        },
    )
    assert upload.status_code == 200, upload.text
    assert upload.json()["decision"] == "auto_curate"

    risky = client.post(
        "/context/upload",
        headers=headers,
        json={
            "title": "Short note",
            "content": "Needs review.",
            "project": project_id,
            "visibility": "project",
        },
    )
    assert risky.status_code == 200, risky.text
    assert risky.json()["decision"] == "review"

    approvals = client.get("/approvals/", headers=headers)
    assert approvals.status_code == 200, approvals.text
    assert len(approvals.json()) == 1

    key_response = client.post(
        "/api-keys/",
        headers=headers,
        json={"purpose": "Test agent", "scopes": ["context.read", "context.write"]},
    )
    assert key_response.status_code == 200, key_response.text
    raw_key = key_response.json()["raw_key"]
    
    with SessionLocal() as session:
        stored = session.get(ApiKeyRecord, key_response.json()["id"])
        assert stored is not None
        assert stored.key_hash != raw_key

    mcp_headers = {"Authorization": f"Bearer {raw_key}"}
    projects = client.get("/mcp/tool/list-projects", headers=mcp_headers)
    assert projects.status_code == 200, projects.text
    assert projects.json()["projects"][0]["name"] == "Core Platform"
