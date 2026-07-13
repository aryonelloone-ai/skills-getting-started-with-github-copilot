import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Ensure tests run with a fresh copy of the in-memory activities DB.

    Arrange: take a deep copy of the module-level `activities` dict and restore
    it after each test so tests remain isolated.
    """
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities = original


def test_get_activities():
    # Arrange: TestClient is ready
    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    assert "Chess Club" in resp.json()


def test_signup_and_unregister_flow():
    # Arrange
    activity = "Chess Club"
    email = "pytest_user@example.com"

    # Act: sign up
    signup = client.post(f"/activities/{activity}/signup", params={"email": email})

    # Assert signup succeeded and participant added
    assert signup.status_code == 200
    assert email in app_module.activities[activity]["participants"]

    # Act: unregister
    unregister = client.post(f"/activities/{activity}/unregister", params={"email": email})

    # Assert unregister succeeded and participant removed
    assert unregister.status_code == 200
    assert email not in app_module.activities[activity]["participants"]


def test_signup_already_registered_returns_400():
    # Arrange: pick an existing participant
    activity = "Chess Club"
    existing = app_module.activities[activity]["participants"][0]

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": existing})

    # Assert
    assert resp.status_code == 400


def test_activity_not_found_returns_404():
    # Arrange / Act
    resp = client.post("/activities/Nonexistent/signup", params={"email": "a@b.com"})

    # Assert
    assert resp.status_code == 404
