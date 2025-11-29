# Surgical AR Guidance Demo

A hackathon proof-of-concept for a surgical AR guidance system that enables remote experts to guide rural surgeons by annotating 3D reconstructions that appear as AR overlays on live video.

## Tech Stack

- **Backend**: FastAPI, WebSockets, Python
- **AI Orchestration**: Dedalus Labs (multi-model support)
- **3D Processing**: OpenCV, NumPy
- **Frontend**: React, Three.js, React Three Fiber (to be added)

## Setup Instructions

### 1. Environment Setup

```bash
# Create virtual environment (already done)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (already done)
pip install -r requirements.txt
```

### 2. Configure API Keys

Edit `.env` file and add your Dedalus API key:
```
DEDALUS_API_KEY=your_key_here
```

Get your API key from [dedaluslabs.ai](https://dedaluslabs.ai)

### 3. Add 3D Models

Place GLB format 3D models in `assets/models/`:
- `bottle_small.glb`
- `bottle_medium.glb`
- `bottle_large.glb`

You can:
- Use Polycam app to scan objects
- Download from Sketchfab (free models)
- Create in Blender and export as GLB

### 4. Run the Backend

```bash
# Activate virtual environment
source venv/bin/activate

# Start the server
uvicorn backend.api.server:app --reload
```

Server will run at http://localhost:8000

### 5. Test the Setup

```bash
# Test Dedalus connection
python test_dedalus.py

# Run integration tests
python tests/integration_test.py

# Run performance benchmark
python tests/performance_test.py
```

## Project Structure

```
surgical-ar-demo/
├── backend/
│   ├── agents/
│   │   ├── reconstruction_agent.py  # 3D reconstruction with fallback
│   │   └── medical_agent.py         # AI medical guidance
│   ├── api/
│   │   └── server.py                # FastAPI server with WebSockets
│   ├── tools/
│   │   ├── video_tools.py           # Video processing utilities
│   │   └── measurement_tools.py     # 3D measurement calculations
│   └── utils/
│       └── demo_monitor.py          # Demo logging and monitoring
├── assets/
│   ├── models/                      # 3D models (.glb files)
│   └── videos/                      # Test videos
├── tests/
│   ├── integration_test.py          # End-to-end tests
│   └── performance_test.py          # Performance benchmarks
├── temp/                            # Temporary files
├── logs/                            # Demo logs
└── frontend/                        # React app (to be created)
```

## API Endpoints

- `GET /health` - Health check
- `POST /upload-video` - Upload surgical video
- `POST /reconstruct/{job_id}` - Start 3D reconstruction
- `POST /analyze` - Get AI medical guidance
- `POST /suggest-entry-point` - Get optimal entry point suggestion
- `WS /ws/{client_id}` - WebSocket for real-time updates

## Development Status

### ✅ Completed
- [x] Phase 0: Foundation Setup
- [x] Phase 1: Backend Infrastructure
- [x] Phase 2: Dedalus Agent - Video Reconstruction
- [x] Phase 3: 3D Model Fallback System (placeholder)
- [x] Phase 6: AI Medical Guidance

### 🚧 To Do
- [ ] Phase 4: Frontend 3D Viewer (React + Three.js)
- [ ] Phase 5: AR Video Overlay
- [ ] Phase 7: End-to-End Integration
- [ ] Phase 8: Polish & Demo Preparation
- [ ] Add actual 3D models
- [ ] Record demo video

## Next Steps

1. **Add your Dedalus API key** to `.env`
2. **Add 3D models** to `assets/models/`
3. **Build the frontend**:
   ```bash
   npx create-react-app frontend
   cd frontend
   npm install three @react-three/fiber @react-three/drei
   ```
4. **Test the backend** with the integration tests
5. **Create demo video** for backup

## Demo Script

See `instructions.md` Phase 8 for the complete demo script (2 minutes).

## Troubleshooting

### Dedalus API not working
- Check your API key in `.env`
- System automatically falls back to mock responses for demo reliability

### 3D models not loading
- Ensure GLB files are in `assets/models/`
- Files should be under 10MB each
- Validate GLB format

### WebSocket disconnects
- Check CORS settings in server.py
- Ensure frontend is connecting to correct URL

## License

Hackathon POC - Educational purposes only
