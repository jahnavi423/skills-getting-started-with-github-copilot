from fastapi.testclient import TestClient
import importlib

# Import the app module
app_module = importlib.import_module('src.app')
client = TestClient(app_module.app)


def setup_function():
    # Reset activities to the initial state before each test
    # Re-import the module to reset the in-memory data
    importlib.reload(app_module)


def test_get_activities():
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert 'Chess Club' in data
    assert 'Programming Class' in data


def test_signup_and_duplicate_signup():
    activity = 'Track & Field'
    email = 'teststudent@mergington.edu'

    # Ensure the student is not already signed up
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    assert email not in participants

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert 'Signed up' in resp.json()['message']

    # Signing up again should result in 400
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400


def test_unregister_participant():
    activity = 'Chess Club'
    email = 'daniel@mergington.edu'

    # Ensure the participant exists
    resp = client.get('/activities')
    participants = resp.json()[activity]['participants']
    assert email in participants

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert 'Unregistered' in resp.json()['message']

    # Unregistering again should return 404
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404


def test_unregister_nonexistent_activity():
    resp = client.delete('/activities/Nonexistent/participants?email=foo@bar.com')
    assert resp.status_code == 404
