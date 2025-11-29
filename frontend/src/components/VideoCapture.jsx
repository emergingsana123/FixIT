import { useRef, useEffect, useState } from 'react';
import { getDetector } from '../services/yoloDetection';
import './VideoCapture.css';

export function VideoCapture({ annotations, cameraState }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [detectedBox, setDetectedBox] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('Initializing...');
  
  // HUD state
  const [targetDistance, setTargetDistance] = useState(null);
  const [clearanceDistance, setClearanceDistance] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('searching'); // 'locked', 'searching', 'lost'
  
  // Fixed calibration for YOUR specific bottle
  // These percentages map points to the bounding box (0 = top/left, 1 = bottom/right)
  const [calibration] = useState({
    cap: { xPercent: 0.5, yPercent: 0.15 },      // Cap is at top center
    middle: { xPercent: 0.5, yPercent: 0.5 },     // Middle is at center
    bottom: { xPercent: 0.5, yPercent: 0.85 },    // Bottom is at lower center
  });

  // Setup webcam
  useEffect(() => {
    let stream = null;
    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const det = await getDetector();
        setDetector(det);
        setIsDetecting(true);
        setDetectionStatus('Ready');
      } catch (err) {
        console.error('Camera error:', err);
        setDetectionStatus('Camera error: ' + err.message);
      }
    };
    setupCamera();
    return () => {
      setIsDetecting(false);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // YOLO Detection Loop - Just detect the bottle bounding box
  useEffect(() => {
    if (!detector || !videoRef.current || !isDetecting) return;
    let animationId;
    
    const detectLoop = async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const detection = await detector.detectBottle(videoRef.current);
          if (detection) {
            setDetectedBox({
              x: detection.bbox.x, 
              y: detection.bbox.y,
              width: detection.bbox.width, 
              height: detection.bbox.height,
              class: detection.class, 
              score: detection.score,
            });
            setDetectionStatus(`${detection.class} (${Math.round(detection.score * 100)}%)`);
            setTrackingStatus('locked');
            
            // Calculate simulated distances for HUD
            // In production, this would use actual depth data
            const simulatedTargetDist = 12.4 + (Math.random() * 1.2 - 0.6); // 11.8-13.0mm
            const simulatedClearance = 3.2 + (Math.random() * 0.4 - 0.2); // 3.0-3.4mm
            
            setTargetDistance(simulatedTargetDist);
            setClearanceDistance(simulatedClearance);
          } else {
            setTrackingStatus('searching');
          }
        } catch (error) {
          console.error('Detection error:', error);
          setTrackingStatus('lost');
        }
      }
      animationId = requestAnimationFrame(detectLoop);
    };
    
    detectLoop();
    
    return () => { 
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [detector, isDetecting]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current, ctx = canvas.getContext('2d');
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (detectedBox && detectedBox.width > 0) {
        const box = detectedBox;
        ctx.shadowColor = 'rgba(0, 255, 0, 0.8)'; ctx.shadowBlur = 20;
        ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 8;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 3;
        ctx.strokeRect(box.x + 4, box.y + 4, box.width - 8, box.height - 8);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.fillRect(box.x, box.y - 35, 200, 35);
        ctx.fillStyle = 'black'; ctx.font = 'bold 16px Arial';
        ctx.fillText(`BOTTLE ${Math.round(box.score * 100)}%`, box.x + 10, box.y - 12);
      }
      
      // ==========================================
      // DRAW ANNOTATION MARKERS FROM 3D MODEL
      // Map each annotation to the bounding box
      // ==========================================
      if (detectedBox && detectedBox.width > 0 && annotations && annotations.length > 0) {
        annotations.forEach((ann, index) => {
          // Map annotation label to calibration point
          let point = null;
          const label = ann.label.toLowerCase();
          
          if (label.includes('cap') || label.includes('top')) {
            point = calibration.cap;
          } else if (label.includes('middle') || label.includes('center') || label.includes('body')) {
            point = calibration.middle;
          } else if (label.includes('bottom') || label.includes('base')) {
            point = calibration.bottom;
          } else {
            // Default: use cap position
            point = calibration.cap;
          }
          
          // Calculate exact pixel position
          const markerX = detectedBox.x + (point.xPercent * detectedBox.width);
          const markerY = detectedBox.y + (point.yPercent * detectedBox.height);
          
          console.log(`📍 ${ann.label} at ${(point.yPercent * 100).toFixed(0)}% down box:`, { x: markerX, y: markerY });
          
          // Draw outer glow
          ctx.shadowColor = 'rgba(255, 0, 0, 1)';
          ctx.shadowBlur = 25;
          
          // Large red circle
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(markerX, markerY, 16, 0, Math.PI * 2);
          ctx.fill();
          
          // White border
          ctx.shadowBlur = 0;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 5;
          ctx.stroke();
          
          // Inner pulse circle
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
          ctx.fill();
          
          // Label with background
          const displayLabel = `🎯 ${ann.label.toUpperCase()}`;
          ctx.font = 'bold 18px Arial';
          const metrics = ctx.measureText(displayLabel);
          const labelX = markerX + 28;
          const labelY = markerY - 20;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
          ctx.fillRect(labelX, labelY, metrics.width + 20, 38);
          
          // Red border around label
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 3;
          ctx.strokeRect(labelX, labelY, metrics.width + 20, 38);
          
          ctx.fillStyle = 'white';
          ctx.fillText(displayLabel, labelX + 10, labelY + 26);
        });
      }
      requestAnimationFrame(draw);
    };
    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [detectedBox, annotations, calibration]);

  // Helper functions for HUD
  const getClearanceStatus = (clearance) => {
    if (!clearance) return 'safe';
    if (clearance < 3.0) return 'danger';
    if (clearance < 5.0) return 'caution';
    return 'safe';
  };

  const getTrackingStatusText = () => {
    switch (trackingStatus) {
      case 'locked': return '✓ TRACKING LOCKED';
      case 'searching': return '○ SEARCHING...';
      case 'lost': return '✗ TRACKING LOST';
      default: return '○ INITIALIZING';
    }
  };

  return (
    <div className="video-container">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="video-feed"
      />
      <canvas 
        ref={canvasRef} 
        width={1280} 
        height={720}
        className="video-overlay"
      />
      
      {/* Medical HUD Overlay */}
      <div className="hud-overlay">
        {/* Top Bar */}
        <div className="hud-top-bar">
          {/* Tracking Status */}
          <div className={`hud-tracking-status ${trackingStatus}`}>
            <div className={`hud-tracking-indicator ${trackingStatus}`}></div>
            <span className="hud-tracking-text">{getTrackingStatusText()}</span>
          </div>
          
          {/* Session Info */}
          <div className="hud-session-info">
            SESSION: <span className="hud-session-id">DEMO-5892</span>
          </div>
        </div>

        {/* Center HUD - Only show when tracking is locked */}
        {trackingStatus === 'locked' && targetDistance && (
          <div className="hud-center">
            {/* Target Distance */}
            <div className="hud-target-distance">
              <div className="hud-target-label">TARGET DEPTH</div>
              <div className="hud-target-value">
                {targetDistance.toFixed(1)}<span className="hud-target-unit">mm</span>
              </div>
            </div>

            {/* Clearance Display */}
            {clearanceDistance && (
              <div className={`hud-clearance ${getClearanceStatus(clearanceDistance)}`}>
                <div className="hud-clearance-label">MIN CLEARANCE</div>
                <div className={`hud-clearance-value ${getClearanceStatus(clearanceDistance)}`}>
                  {clearanceDistance.toFixed(1)}mm {getClearanceStatus(clearanceDistance) === 'danger' ? '⚠️' : 
                                                     getClearanceStatus(clearanceDistance) === 'caution' ? '⚡' : '✓'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning Banner for Critical Clearance */}
        {trackingStatus === 'locked' && clearanceDistance && clearanceDistance < 3.0 && (
          <div className="hud-warning-banner">
            <span className="hud-warning-icon">⚠️</span>
            CRITICAL CLEARANCE - SPECIALIST OVERSIGHT REQUIRED
          </div>
        )}

        {/* Bottom Bar */}
        <div className="hud-bottom-bar">
          {/* Detection Status */}
          <div className="hud-detection-status">
            {detectionStatus}
          </div>
          
          {/* Marker Count */}
          {annotations && annotations.length > 0 && (
            <div className="hud-marker-count">
              <span className="hud-marker-icon">🎯</span>
              <span>{annotations.length} STRUCTURE{annotations.length !== 1 ? 'S' : ''} IDENTIFIED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
