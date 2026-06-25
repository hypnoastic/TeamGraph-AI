import pytest


def test_google_login_missing_credential(client):
    """POST /auth/google with empty body should return 422 (missing 'credential' field)."""
    response = client.post("/auth/google", json={})
    assert response.status_code == 422


def test_verify_session_missing_token(client):
    """GET /auth/me without a bearer token should return 401."""
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert "Missing or invalid token" in response.json()["detail"]


def test_logout_requires_auth(client):
    """POST /auth/logout without auth should return 401."""
    response = client.post("/auth/logout")
    assert response.status_code == 401


def test_health_endpoint(client):
    """GET /health should return 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
