import os
import json
import time
from datetime import datetime

os.environ["STREAM_DELAY"] = "0.01" 

from fastapi.testclient import TestClient

from main import app 

client = TestClient(app)

def parse_sse_line(line):
    """Robust SSE parser"""
    if isinstance(line, bytes):
        text = line.decode()
    else:
        text = line

    if not text.startswith("data: "):
        return None
    return json.loads(text.replace("data: ", "").strip())

def test_root():
    res = client.get("/")
    # If this still returns 404, ensure main.py has: @app.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "running"

def test_stream_starts():
    res = client.get("/evaluate-multimodal")
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]

def test_stream_schema_validation():
    with client.stream("GET", "/evaluate-multimodal") as response:
        for line in response.iter_lines():
            if not line:
                continue

            data = parse_sse_line(line)
            if not data: continue

            assert "type" in data
            assert "id" in data
            assert "timestamp" in data

            datetime.fromisoformat(data["timestamp"])

            if data["type"] == "result":
                break

def test_stream_latency_fast_mode():
    """Fast test using env override"""
    # Re-verify env is set for this specific test
    os.environ["STREAM_DELAY"] = "0.01"
    
    start = time.time()
    valid_lines_received = 0

    with client.stream("GET", "/evaluate-multimodal") as response:
        for line in response.iter_lines():
            if line:
                data = parse_sse_line(line)
                if data:
                    valid_lines_received += 1
                    # Break after 2 valid data packets to ensure speed
                    if valid_lines_received == 2:
                        break
    
    duration = time.time() - start
    # Should be very fast (~0.02s) with the override
    assert duration < 1.0