import pytest
from app import create_app
from app.models import db

@pytest.fixture
def client():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    with app.test_client() as client:
        yield client
    with app.app_context():
        db.session.remove()
        db.drop_all()

def test_health_and_index(client):
    assert client.get("/health").status_code == 200
    res = client.get("/")
    assert res.status_code == 200
    assert b"clouddesk" in res.data.lower()

def test_create_and_update_ticket(client):
    res = client.get("/api/tickets")
    assert res.status_code == 200
    assert res.get_json()["stats"]["total"] == 5

    create_res = client.post("/api/tickets", json={
        "title": "Printer offline on floor 2",
        "requester_name": "Kemi Ade",
        "requester_email": "kemi.ade@company.com",
        "category": "Hardware",
        "priority": "Medium",
    })
    assert create_res.status_code == 201
    created = create_res.get_json()["ticket"]
    assert created["status"] == "Open"

    patch_res = client.patch(f"/api/tickets/{created['id']}/status", json={"status": "Resolved"})
    assert patch_res.status_code == 200
    assert patch_res.get_json()["ticket"]["status"] == "Resolved"
