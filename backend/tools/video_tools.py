import cv2
from pathlib import Path

def extract_frames(video_path: str, max_frames: int = 10) -> dict:
    """Extract frames from video for 3D reconstruction.
    
    Args:
        video_path: Path to video file
        max_frames: Maximum number of frames to extract
        
    Returns:
        Dictionary with frame count and paths
    """
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_interval = max(1, total_frames // max_frames)
    
    frames = []
    for i in range(0, total_frames, frame_interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if ret:
            frame_path = f"temp/frame_{i}.jpg"
            cv2.imwrite(frame_path, frame)
            frames.append(frame_path)
    
    cap.release()
    return {
        "frame_count": len(frames),
        "frame_paths": frames,
        "status": "extracted"
    }

def report_progress(step: str, percentage: int) -> dict:
    """Report reconstruction progress to user.
    
    Args:
        step: Current processing step
        percentage: Progress percentage (0-100)
        
    Returns:
        Progress update dictionary
    """
    return {
        "step": step,
        "percentage": percentage,
        "message": f"Processing: {step} ({percentage}%)"
    }
