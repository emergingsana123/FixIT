from fastapi import FastAPI, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uuid
import os
from pathlib import Path
from typing import Dict
from backend.agents.reconstruction_agent import ReconstructionAgent
from backend.agents.advanced_medical_agent import AdvancedMedicalAgent
from backend.services.vision_detector import detect_bottle_with_vision, detect_bottle_fast

app = FastAPI()
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Store active connections
connections: Dict[str, WebSocket] = {}

# Initialize agents
reconstruction_agent = ReconstructionAgent()
medical_agent = AdvancedMedicalAgent()

# Mount static files for models
Path("temp").mkdir(exist_ok=True)
app.mount("/models", StaticFiles(directory="assets/models"), name="models")

@app.get("/health")
async def health():
    return {"status": "healthy", "dedalus": "connected"}

@app.post("/upload-video")
async def upload_video(video: UploadFile):
    job_id = str(uuid.uuid4())
    # Save video temporarily
    video_path = f"temp/{job_id}.mp4"
    with open(video_path, "wb") as f:
        f.write(await video.read())
    
    return {"job_id": job_id, "status": "queued"}

@app.post("/reconstruct/{job_id}")
async def start_reconstruction(job_id: str):
    video_path = f"temp/{job_id}.mp4"
    
    async def progress_callback(update):
        # Broadcast to WebSocket clients
        await broadcast_to_all({"type": "progress", "data": update})
    
    result = await reconstruction_agent.process_video(
        video_path, 
        callback=progress_callback
    )
    
    return result

@app.post("/analyze")
async def analyze_annotations(request: dict):
    """Analyze annotations and provide medical guidance.
    
    Request body:
    {
        "annotations": [...],
        "query": "What's the safest approach?",
        "mesh_vertices": [[x,y,z], ...] (optional)
    }
    """
    annotations = request.get('annotations', [])
    query = request.get('query', 'Provide guidance')
    mesh_vertices = request.get('mesh_vertices', [])
    
    # Pass mesh data to agent for geometric analysis
    result = await medical_agent.analyze_annotations(
        annotations, 
        query,
        mesh_data={'vertices': mesh_vertices} if mesh_vertices else None
    )
    
    return result

@app.post("/suggest-entry-point")
async def suggest_entry_point(request: dict):
    """Suggest optimal surgical entry point on 3D model.
    
    Request body:
    {
        "model_id": "...", (optional)
        "mesh_vertices": [[x,y,z], ...], (optional)
        "annotations": [...] (optional, existing annotations to avoid)
    }
    """
    model_id = request.get('model_id', 'default')
    mesh_vertices = request.get('mesh_vertices', [])
    annotations = request.get('annotations', [])
    
    # Pass mesh data to agent for real geometric analysis
    result = await medical_agent.suggest_optimal_entry_point(
        annotations=annotations,
        mesh_data={'vertices': mesh_vertices, 'id': model_id}
    )
    
    # Broadcast to all clients
    await broadcast_to_all({
        "type": "suggested_annotation",
        "annotation": {
            "position": result.get("position", result.get("entry_point", [0, 0, 0])),
            "label": f"Suggested Entry ({result.get('confidence', 0):.0%} confidence)",
            "color": "green",
            "auto_generated": True
        }
    })
    
    return result


@app.post("/analyze-incision")
async def analyze_incision(request: dict):
    """Analyze a multi-point incision path for surgical planning.
    
    Request body:
    {
        "path_points": [[x1,y1,z1], [x2,y2,z2], ...],
        "annotations": [...], (optional, existing vessel annotations)
        "mesh_vertices": [[x,y,z], ...] (optional)
    }
    
    Returns:
        Segment-by-segment analysis with overall risk assessment
    """
    path_points = request.get('path_points', [])
    annotations = request.get('annotations', [])
    mesh_vertices = request.get('mesh_vertices', [])
    
    if len(path_points) < 2:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Need at least 2 points to define an incision path",
                "path_length_mm": 0,
                "overall_confidence": 0
            }
        )
    
    # Analyze the path using advanced agent
    result = await medical_agent.analyze_incision_path(
        path_points=path_points,
        annotations=annotations,
        mesh_data={'vertices': mesh_vertices} if mesh_vertices else None
    )
    
    return result


class VisionDetectionRequest(BaseModel):
    image: str  # Base64 encoded image
    mode: str = "full"  # "full" or "fast"


@app.post("/detect-bottle")
async def detect_bottle(request: VisionDetectionRequest):
    """
    Detect bottle in webcam frame using GPT-4 Vision
    
    Args:
        image: Base64 encoded JPEG image
        mode: "full" (with parts) or "fast" (just bbox)
    
    Returns:
        Detection result with bounding box and part coordinates
    """
    
    try:
        if request.mode == "fast":
            result = detect_bottle_fast(request.image)
        else:
            result = detect_bottle_with_vision(request.image)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "detected": False,
                "error": str(e),
                "bbox": {"x": 0, "y": 0, "width": 0, "height": 0},
                "confidence": 0.0
            }
        )


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    connections[client_id] = websocket
    print(f"INFO:     WebSocket client connected: {client_id}")
    
    try:
        while True:
            data = await websocket.receive_json()
            # Handle annotation updates
            await broadcast_to_others(client_id, data)
    except WebSocketDisconnect as e:
        # Client disconnected normally
        print(f"INFO:     WebSocket client disconnected: {client_id} (code: {e.code})")
        if client_id in connections:
            del connections[client_id]
    except Exception as e:
        print(f"ERROR:    WebSocket error for {client_id}: {e}")
        # Clean up on any error
        if client_id in connections:
            del connections[client_id]
    finally:
        # Final cleanup to ensure connection is removed
        if client_id in connections:
            del connections[client_id]
        print(f"INFO:     WebSocket cleanup completed for {client_id}")

async def broadcast_to_others(sender_id: str, data: dict):
    disconnected = []
    for client_id, ws in connections.items():
        if client_id != sender_id:
            try:
                await ws.send_json(data)
            except:
                disconnected.append(client_id)
    
    # Clean up disconnected clients
    for client_id in disconnected:
        del connections[client_id]

async def broadcast_to_all(data: dict):
    disconnected = []
    for client_id, ws in connections.items():
        try:
            await ws.send_json(data)
        except:
            disconnected.append(client_id)
    
    # Clean up disconnected clients
    for client_id in disconnected:
        del connections[client_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
