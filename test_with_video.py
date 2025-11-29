import asyncio
import sys
from pathlib import Path

sys.path.insert(0, '.')
from backend.agents.reconstruction_agent import ReconstructionAgent

async def test_with_real_video():
    print('🎥 Testing Phase 2 with REAL video file')
    print('=' * 60)
    
    # Check if video exists
    video_path = 'assets/videos/test.mp4'
    
    if not Path(video_path).exists():
        print(f'\n❌ Video not found at: {video_path}')
        print('\nPlease add a video file to:')
        print('  /Users/aaryamanbajaj/Documents/live-3d/assets/videos/test.mp4')
        print('\nVideo should be:')
        print('  - Valid MP4 format')
        print('  - 5-30 seconds long')
        print('  - Under 50MB')
        return
    
    print(f'\n✓ Found video: {video_path}')
    size_mb = Path(video_path).stat().st_size / (1024 * 1024)
    print(f'  Size: {size_mb:.2f}MB')
    
    agent = ReconstructionAgent()
    
    print('\n🔄 Processing video...')
    
    async def callback(update):
        print(f'  📊 {update["step"]}: {update["percentage"]}%')
    
    import time
    start = time.time()
    result = await agent.process_video(video_path, callback=callback)
    duration = time.time() - start
    
    print(f'\n✅ Completed in {duration:.1f}s')
    print(f'\nResult:')
    print(f'  Model: {result["model_path"]}')
    print(f'  Method: {result["method"]}')
    print(f'  Status: {result["status"]}')
    
    if result["method"] == "fallback":
        print('\n⚠️  Note: Used fallback model (Dedalus reconstruction not available)')
        print('   This is expected for hackathon demo - fallback ensures reliability')
    else:
        print('\n🎉 Real Dedalus reconstruction worked!')

if __name__ == "__main__":
    asyncio.run(test_with_real_video())
