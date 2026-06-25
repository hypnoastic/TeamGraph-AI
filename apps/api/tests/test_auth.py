import pytest
from fastapi.testclient import TestClient

from main import app
from postgres import get_db

client = TestClient(app)

def override_get_db():
    try:
        yield None # Mock DB session if necessary
    finally:
        pass

app.dependency_overrides[get_db] = override_get_db

def test_login_missing_params():
    response = client.post("/auth/login/google", json={})
    assert response.status_code == 422 # Unprocessable Entity due to missing Pydantic fields

def test_verify_session_missing_cookie():
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Session token missing"

def test_logout():
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "logged_out"
