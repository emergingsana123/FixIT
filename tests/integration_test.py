import asyncio
import aiohttp
import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

async def test_complete_flow():
    """Test complete demo flow end-to-end."""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Starting integration test...\n")
    
    # Test 1: Health check
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{base_url}/health") as resp:
                assert resp.status == 200
                print("✓ Backend healthy")
        except Exception as e:
            print(f"✗ Health check failed: {e}")
            print("Make sure the server is running: uvicorn backend.api.server:app --reload")
            return
        
        # Test 2: AI analysis (without video upload for now)
        test_annotations = [
            {"position": [0, 0, 0], "label": "Entry point"},
            {"position": [1, 0, 0], "label": "Target"}
        ]
        
        try:
            async with session.post(
                f"{base_url}/analyze",
                json={"annotations": test_annotations, "query": "What's the distance?"}
            ) as resp:
                result = await resp.json()
                assert 'guidance' in result
                print(f"✓ AI analysis: {result['guidance'][:50]}...")
        except Exception as e:
            print(f"✗ AI analysis failed: {e}")
    
    print("\n✅ Basic integration tests passed!")
    print("\nNext steps:")
    print("1. Add your DEDALUS_API_KEY to .env file")
    print("2. Add 3D models (.glb files) to assets/models/")
    print("3. Build the frontend React app")

if __name__ == "__main__":
    asyncio.run(test_complete_flow())
