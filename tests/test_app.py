import os
import tempfile

from app import create_app


def test_routes_and_api():
    handle, path = tempfile.mkstemp(suffix=".db")
    os.close(handle)
    app = create_app({"TESTING": True, "DATABASE": path})
    client = app.test_client()
    for route in ["/", "/login", "/register", "/symptom-checker", "/wellness", "/habits", "/health-info", "/emergency", "/feedback", "/dashboard"]:
        assert client.get(route).status_code == 200
    assert client.post("/api/symptom-check", json={}).status_code == 400
    assert client.post("/api/symptom-check", json={"symptoms": "mild headache"}).get_json()["risk_level"] == "CONTACT A HEALTHCARE PROFESSIONAL"
    assert client.post("/api/symptom-check", json={"symptoms": "severe chest pain"}).get_json()["is_emergency"] is True
    assert client.post("/api/wellness", json={"message": "How can I improve sleep?"}).status_code == 200
    assert client.post("/api/habits", json={"name": "Drink water", "category": "Hydration"}).status_code == 200
    assert client.post("/api/feedback", json={"feedback": "Helpful demo", "rating": 5}).status_code == 200
    os.remove(path)
