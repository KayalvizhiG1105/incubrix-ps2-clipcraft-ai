import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ffmpeg"] == "available"
    assert data["ffprobe"] == "available"

def test_parse_prompt_api(client):
    payload = {"prompt": "Trim the video to the first 15 seconds."}
    response = client.post("/api/parse-prompt", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["operations"]) == 1
    assert data["operations"][0]["type"] == "trim"

def test_parse_unsupported_prompt_api(client):
    payload = {"prompt": "Add cool vintage filters and upbeat music."}
    response = client.post("/api/parse-prompt", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert len(data["unsupported_intents"]) > 0

def test_sample_video_endpoint(client):
    response = client.post("/api/sample-video")
    assert response.status_code == 200
    data = response.json()
    assert "video_id" in data
    assert data["metadata"]["width"] == 1280
    assert data["metadata"]["height"] == 720

def test_render_api_flow(client):
    # 1. Load sample video
    s_res = client.post("/api/sample-video")
    video_id = s_res.json()["video_id"]

    # 2. Render request (trim to 3 seconds and mute)
    payload = {
        "video_id": video_id,
        "project_title": "API Test Project",
        "prompt": "Trim to 3 seconds and mute",
        "operations": [
            {"type": "trim", "start_seconds": 0.0, "end_seconds": 3.0, "duration": 3.0},
            {"type": "mute_audio", "mute": True}
        ]
    }
    r_res = client.post("/api/render", json=payload)
    assert r_res.status_code == 200
    job = r_res.json()
    assert job["status"] == "completed"
    assert job["output_metadata"]["has_audio"] is False
    assert abs(job["output_metadata"]["duration"] - 3.0) <= 0.4
    assert job["processing_time_ms"] > 0
    assert job["download_url"] is not None

def test_history_endpoint(client):
    response = client.get("/api/history")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    assert len(history) >= 1
