import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.agents.reconstruction_agent import ReconstructionAgent
from backend.agents.medical_agent import MedicalAnalysisAgent

async def test_phase2_reconstruction():
    """Test Phase 2: Real Dedalus reconstruction agent."""
    
    print("🧪 Testing Phase 2: Video Reconstruction Agent\n")
    
    agent = ReconstructionAgent()
    
    # Test 1: Check if Dedalus client is initialized
    print("Test 1: Dedalus client initialization")
    assert agent.client is not None
    assert agent.runner is not None
    print("✓ Dedalus client initialized\n")
    
    # Test 2: Test with a simple mock video path (real reconstruction)
    print("Test 2: Testing REAL reconstruction (not fallback)")
    print("This will call Dedalus API...\n")
    
    try:
        # Create a dummy video file for testing
        Path("temp").mkdir(exist_ok=True)
        test_video = "temp/test_video.mp4"
        Path(test_video).touch()  # Create empty file
        
        result = await agent.process_video(test_video)
        
        if result.get('method') == 'fallback':
            print("⚠️  WARNING: Fell back to mock reconstruction")
            print("   This means Dedalus API call failed")
            print(f"   Result: {result}\n")
            return False
        else:
            print("✓ Real Dedalus reconstruction worked!")
            print(f"   Result: {result}\n")
            return True
            
    except Exception as e:
        print(f"✗ Reconstruction failed with error: {e}\n")
        return False

async def test_phase6_medical_ai():
    """Test Phase 6: Real AI medical guidance."""
    
    print("🧪 Testing Phase 6: AI Medical Guidance\n")
    
    agent = MedicalAnalysisAgent()
    
    # Test annotations
    annotations = [
        {"position": [0, 0, 0], "label": "Point A"},
        {"position": [1, 0, 0], "label": "Point B"}
    ]
    
    print("Test: Real AI analysis (not fallback)")
    print("Calling Dedalus API...\n")
    
    try:
        result = await agent.analyze_annotations(annotations, "What is the distance between these points?")
        
        if result.get('method') == 'fallback':
            print("⚠️  WARNING: Fell back to mock response")
            print("   This means Dedalus API call failed")
            print(f"   Result: {result}\n")
            return False
        else:
            print("✓ Real AI analysis worked!")
            print(f"   Guidance: {result['guidance']}")
            print(f"   Confidence: {result['confidence']}")
            print(f"   Method: {result['method']}\n")
            return True
            
    except Exception as e:
        print(f"✗ AI analysis failed with error: {e}\n")
        return False

async def main():
    print("=" * 60)
    print("TESTING REAL DEDALUS FUNCTIONALITY (NOT FALLBACKS)")
    print("=" * 60)
    print()
    
    # Test Phase 2
    phase2_pass = await test_phase2_reconstruction()
    
    # Test Phase 6  
    phase6_pass = await test_phase6_medical_ai()
    
    print("=" * 60)
    print("RESULTS:")
    print("=" * 60)
    print(f"Phase 2 (Reconstruction): {'✅ PASS' if phase2_pass else '❌ FAIL (using fallback)'}")
    print(f"Phase 6 (Medical AI): {'✅ PASS' if phase6_pass else '❌ FAIL (using fallback)'}")
    print()
    
    if not phase2_pass or not phase6_pass:
        print("⚠️  SOME TESTS FAILED - Fix these before proceeding!")
        print("\nPossible issues:")
        print("1. Check DEDALUS_API_KEY is set correctly in .env")
        print("2. Check internet connection")
        print("3. Check Dedalus API status")
        print("4. The Dedalus SDK might have API changes - check docs")
    else:
        print("✅ ALL TESTS PASSED - Ready to proceed to next phase!")

if __name__ == "__main__":
    asyncio.run(main())
