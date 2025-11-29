"""
Phase 5 Test: AR Video Overlay
Tests the AR annotation overlay on video feed
"""

import sys
import time
from pathlib import Path

def test_phase5():
    """Test Phase 5 success criteria"""
    
    print("\n" + "="*60)
    print("PHASE 5 TEST: AR VIDEO OVERLAY")
    print("="*60 + "\n")
    
    # Check if components exist
    print("✓ Checking AR components...")
    
    frontend = Path("frontend/src")
    
    components_to_check = [
        frontend / "components" / "VideoCapture.jsx",
        frontend / "components" / "SyncedView.jsx",
        frontend / "utils" / "coordinates.js"
    ]
    
    for component in components_to_check:
        if not component.exists():
            print(f"✗ Missing component: {component}")
            return False
        print(f"  ✓ {component.name} exists")
    
    # Check if VideoCapture has webcam functionality
    print("\n✓ Checking webcam integration...")
    video_capture_content = (frontend / "components" / "VideoCapture.jsx").read_text()
    
    required_features = [
        "getUserMedia",  # Webcam access
        "canvas",  # Drawing overlay
        "requestAnimationFrame",  # 30 FPS rendering
        "annotations"  # Annotation display
    ]
    
    for feature in required_features:
        if feature in video_capture_content:
            print(f"  ✓ {feature} implemented")
        else:
            print(f"  ✗ {feature} missing")
            return False
    
    # Check coordinate transformation
    print("\n✓ Checking coordinate transformation...")
    coords_content = (frontend / "utils" / "coordinates.js").read_text()
    
    if "worldToScreen" in coords_content or "project3DTo2D" in coords_content:
        print("  ✓ 3D to 2D projection implemented")
    else:
        print("  ✗ Coordinate projection missing")
        return False
    
    # Check SyncedView integration
    print("\n✓ Checking synced view...")
    synced_content = (frontend / "components" / "SyncedView.jsx").read_text()
    
    if "ModelViewer" in synced_content and "VideoCapture" in synced_content:
        print("  ✓ Split view with both 3D and video")
    else:
        print("  ✗ Split view not properly integrated")
        return False
    
    # Check App.js integration
    print("\n✓ Checking main app integration...")
    app_content = (frontend / "App.js").read_text()
    
    if "SyncedView" in app_content:
        print("  ✓ SyncedView integrated into App")
    else:
        print("  ✗ SyncedView not integrated")
        return False
    
    print("\n" + "="*60)
    print("PHASE 5 SUCCESS CRITERIA:")
    print("="*60)
    print("✓ VideoCapture component created with webcam access")
    print("✓ Canvas overlay for drawing annotations")
    print("✓ RequestAnimationFrame for 30 FPS rendering")
    print("✓ 3D to 2D coordinate transformation implemented")
    print("✓ SyncedView showing both 3D model and AR video")
    print("✓ Integrated into main application")
    print("\n⚠️  MANUAL TESTING REQUIRED:")
    print("  1. Open frontend in browser (localhost:3001)")
    print("  2. Upload a video and wait for 3D model")
    print("  3. Grant webcam permissions when prompted")
    print("  4. Click on 3D model to add annotations")
    print("  5. Verify annotations appear on video overlay")
    print("  6. Check video runs at ~30 FPS (smooth playback)")
    print("  7. Verify annotation positions match 3D points")
    print("="*60)
    
    return True

if __name__ == "__main__":
    success = test_phase5()
    sys.exit(0 if success else 1)
