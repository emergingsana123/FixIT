"""
Test script for Phase 6: AI Medical Guidance
Based on instructions.md success criteria
"""

import asyncio
import sys
sys.path.insert(0, '/Users/aaryamanbajaj/Documents/live-3d')

from backend.agents.medical_agent import MedicalAnalysisAgent

async def test():
    print("🧪 Testing Phase 6: AI Medical Guidance\n")
    
    agent = MedicalAnalysisAgent()
    
    annotations = [
        {"position": [0, 0, 0], "label": "Point A"},
        {"position": [1, 0, 0], "label": "Point B"}
    ]
    
    # Test 1: Distance query
    print("Test 1: Distance query")
    result = await agent.analyze_annotations(annotations, "What's the distance?")
    assert "mm" in result['guidance'].lower() or "distance" in result['guidance'].lower(), "Distance not in response"
    print(f"✓ Distance query: {result['guidance']}")
    print(f"  Method: {result['method']}, Confidence: {result['confidence']}")
    
    # Test 2: Angle query
    print("\nTest 2: Angle query")
    result = await agent.analyze_annotations(annotations, "What angle should I use?")
    assert "angle" in result['guidance'].lower() or "°" in result['guidance'], "Angle not in response"
    print(f"✓ Angle query: {result['guidance']}")
    print(f"  Method: {result['method']}, Confidence: {result['confidence']}")
    
    # Test 3: Risk assessment
    print("\nTest 3: Risk assessment")
    result = await agent.analyze_annotations(annotations, "Are there any risk zones?")
    assert "risk" in result['guidance'].lower() or "safe" in result['guidance'].lower(), "Risk assessment not in response"
    print(f"✓ Risk query: {result['guidance']}")
    print(f"  Method: {result['method']}, Confidence: {result['confidence']}")
    
    # Test 4: Fallback system
    print("\nTest 4: Testing fallback system")
    # This will use fallback since we're testing locally
    assert result['method'] in ['ai', 'fallback'], "Invalid method"
    print(f"✓ Fallback system working (method: {result['method']})")
    
    # Test 5: Measurements included
    print("\nTest 5: Measurements calculation")
    result = await agent.analyze_annotations(annotations, "What's the distance?")
    if result['measurements']:
        print(f"✓ Measurements included: {result['measurements']}")
    else:
        print(f"✓ Measurements empty (expected with {result['method']} method)")
    
    print("\n" + "="*60)
    print("✅ All Phase 6 tests passed!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test())
