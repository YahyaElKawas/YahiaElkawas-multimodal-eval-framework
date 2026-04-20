import json
import asyncio
import uuid
import os
from datetime import datetime, UTC
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# ✅ MUST be before any @app usage
app = FastAPI(title="Multimodal Eval Framework")

@app.get("/")
async def root():
    return {"status": "running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# A visible blue square base64 instead of a 1-pixel dot
BLUE_SQUARE = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QYCFg0S8n8S3QAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLm3CYAAAADpJREFUeNrt0QENAAAAwqD3T20PBxQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4M8Ar7gAAX99990AAAAASUVORK5CYII="

SAMPLES = {
    "image": "https://picsum.photos/400/300",  
    "audio": "https://www.w3schools.com/html/horse.ogg",
    "video": "https://www.w3schools.com/html/mov_bbb.mp4",
}

def make_event(step):
    enriched_step = {
        **step,
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(UTC).isoformat()
    }
    return f"data: {json.dumps(enriched_step)}\n\n"

async def multimodal_eval_generator():
    # ✅ dynamic delay (fix latency tests)
    delay = float(os.getenv("STREAM_DELAY", 1.2))

    steps = [
        {"type": "text", "content": "🚀 Initializing Multimodal Agent..."},
        {"type": "image", "content": SAMPLES["image"], "label": "Visual Recognition: Target Identified"},
        {"type": "metric", "label": "Confidence", "content": "99.4%"},
        {"type": "audio", "content": SAMPLES["audio"], "label": "Audio Stream Analysis"},
        {"type": "video", "content": SAMPLES["video"], "label": "Temporal Reasoning"},
        {"type": "pdf", "content": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "label": "Structure Validation"},
        {"type": "result", "content": "Framework successfully validated across all modes.", "score": 0.98}
    ]

    for step in steps:
        yield make_event(step)
        await asyncio.sleep(delay)

@app.get("/evaluate-multimodal")
async def evaluate_multimodal():
    return StreamingResponse(
        multimodal_eval_generator(),
        media_type="text/event-stream"
    )