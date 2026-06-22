import os
import tempfile
import unittest


database_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
database_file.close()
os.environ["DATABASE_URL"] = f"sqlite:///{database_file.name}"
os.environ["DEMO_MODE"] = "false"
os.environ["GEMINI_API_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["NEO4J_URI"] = "bolt://127.0.0.1:1"

from fastapi.testclient import TestClient

from main import app
from models import ApiKeyRecord, Base
from postgres import SessionLocal, engine


class CoreFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        engine.dispose()
        os.unlink(database_file.name)

    def test_auth_organization_context_and_mcp(self):
        signup = self.client.post(
            "/auth/signup",
            json={"name": "Test Admin", "email": "admin@example.com", "password": "password123"},
        )
        self.assertEqual(signup.status_code, 200, signup.text)
        token = signup.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        self.assertTrue(signup.json()["user"]["onboarding_required"])

        setup = self.client.post(
            "/onboarding/organization",
            headers=headers,
            json={"organization_name": "Test Lab", "project_name": "Core Platform"},
        )
        self.assertEqual(setup.status_code, 200, setup.text)
        project_id = setup.json()["project"]["id"]

        upload = self.client.post(
            "/context/upload",
            headers=headers,
            json={
                "title": "Release process",
                "content": "Releases use a staged rollout with health checks and an automatic rollback window.",
                "project": project_id,
                "visibility": "project",
            },
        )
        self.assertEqual(upload.status_code, 200, upload.text)
        self.assertEqual(upload.json()["decision"], "auto_curate")

        risky = self.client.post(
            "/context/upload",
            headers=headers,
            json={
                "title": "Short note",
                "content": "Needs review.",
                "project": project_id,
                "visibility": "project",
            },
        )
        self.assertEqual(risky.status_code, 200, risky.text)
        self.assertEqual(risky.json()["decision"], "review")

        approvals = self.client.get("/approvals/", headers=headers)
        self.assertEqual(approvals.status_code, 200, approvals.text)
        self.assertEqual(len(approvals.json()), 1)

        key_response = self.client.post(
            "/api-keys/",
            headers=headers,
            json={"purpose": "Test agent", "scopes": ["context.read", "context.write"]},
        )
        self.assertEqual(key_response.status_code, 200, key_response.text)
        raw_key = key_response.json()["raw_key"]
        with SessionLocal() as session:
            stored = session.get(ApiKeyRecord, key_response.json()["id"])
            self.assertIsNotNone(stored)
            self.assertNotEqual(stored.key_hash, raw_key)

        mcp_headers = {"Authorization": f"Bearer {raw_key}"}
        projects = self.client.get("/mcp/tool/list-projects", headers=mcp_headers)
        self.assertEqual(projects.status_code, 200, projects.text)
        self.assertEqual(projects.json()["projects"][0]["name"], "Core Platform")


if __name__ == "__main__":
    unittest.main()
