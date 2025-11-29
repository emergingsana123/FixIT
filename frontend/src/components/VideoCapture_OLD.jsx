import { useRef, useEffect, useState } from 'react';
import { getDetector } from '../services/yoloDetection';

export function VideoCapture({ annotations, cameraState }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [detectedBox, setDetectedBox] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [useVision, setUseVision] = useState(false); // Toggle for AI vision
  const [visionInterval, setVisionInterval] = useState(null);
  const [modelBounds] = useState({
    minX: -0.5,
    maxX: 0.5,
    minY: -1.0,  // Bottom of bottle
    maxY: 1.0,   // Top of bottle (cap)
    minZ: -0.5,
    maxZ: 0.5
  });

  // Start webcam and load detector
  useEffect(() => {
    let stream = null;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Load YOLO/MediaPipe detector
        const det = await getDetector();
        setDetector(det);
        setIsDetecting(true);
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsDetecting(false);
    };
  }, []);

  // Automatic bottle detection loop (COCO-SSD - fast)
  useEffect(() => {
    if (!detector || !videoRef.current || !isDetecting || useVision) return;

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
              source: 'coco-ssd'
            });
          } else {
            setDetectedBox(null);
          }
        } catch (error) {
          console.error('Detection error:', error);
        }
      }
      
      animationId = requestAnimationFrame(detectLoop);
    };

    detectLoop();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [detector, isDetecting, useVision]);

  // AI Vision detection (OpenAI GPT-4V - accurate but slower)
  useEffect(() => {
    if (!videoRef.current || !useVision) return;

    const detectWithVision = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640; // Smaller for faster upload
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      try {
        const response = await fetch('http://localhost:8000/detect-bottle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            mode: 'full' // Get bottle parts too
          })
        });
        
        const result = await response.json();
        
        if (result.detected) {
          // Scale coordinates back to 1280x720
          const scaleX = 1280 / 640;
          const scaleY = 720 / 480;
          
          setDetectedBox({
            x: result.bbox.x * scaleX,
            y: result.bbox.y * scaleY,
            width: result.bbox.width * scaleX,
            height: result.bbox.height * scaleY,
            class: 'bottle',
            score: result.confidence,
            source: 'gpt-4v',
            parts: result.parts ? {
              cap: { x: result.parts.cap.x * scaleX, y: result.parts.cap.y * scaleY },
              middle: { x: result.parts.middle.x * scaleX, y: result.parts.middle.y * scaleY },
              bottom: { x: result.parts.bottom.x * scaleX, y: result.parts.bottom.y * scaleY }
            } : null
          });
        } else {
          setDetectedBox(null);
        }
      } catch (error) {
        console.error('Vision detection error:', error);
      }
    };

    // Call every 2 seconds (vision API is slower)
    const interval = setInterval(detectWithVision, 2000);
    detectWithVision(); // Initial call
    
    setVisionInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useVision]);

  // Draw annotations on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw calibration box if set
      if (detectedBox && detectedBox.width > 0 && detectedBox.height > 0) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(detectedBox.x, detectedBox.y, detectedBox.width, detectedBox.height);
        
        // If GPT-4V detected parts, show small green markers
        if (detectedBox.parts && detectedBox.source === 'gpt-4v') {
          ctx.fillStyle = '#00ff00';
          ['cap', 'middle', 'bottom'].forEach(part => {
            if (detectedBox.parts[part]) {
              const p = detectedBox.parts[part];
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
              
              // Label the part
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              ctx.fillRect(p.x + 8, p.y - 10, 40, 16);
              ctx.fillStyle = '#00ff00';
              ctx.font = '10px Arial';
              ctx.fillText(part, p.x + 10, p.y);
            }
          });
        }
      }

      // Only draw annotations if object box is set
      if (detectedBox && detectedBox.width > 0 && detectedBox.height > 0 && annotations.length > 0) {
        annotations.forEach((ann) => {
          const [x3d, y3d] = ann.position;
          
          // Normalize 3D position to 0-1 range based on model bounds
          const normalizedX = (x3d - modelBounds.minX) / (modelBounds.maxX - modelBounds.minX);
          const normalizedY = (y3d - modelBounds.minY) / (modelBounds.maxY - modelBounds.minY);
          
          // Map to detected object bounding box
          // Flip Y because video coordinates go top-to-bottom
          // normalizedY=1.0 (cap/top) → bottleBox.y (top of box)
          // normalizedY=0.0 (bottom) → bottleBox.y + height (bottom of box)
          const videoX = detectedBox.x + (normalizedX * detectedBox.width);
          const videoY = detectedBox.y + ((1 - normalizedY) * detectedBox.height);

          // Draw annotation marker
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(videoX, videoY, 10, 0, Math.PI * 2);
          ctx.fill();

          // Add white outline
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Draw label with background
          const label = ann.label || 'Annotation';
          ctx.font = 'bold 16px Arial';
          
          // Text background
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(videoX + 15, videoY - 10, textWidth + 10, 25);
          
          // Text with outline
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.strokeText(label, videoX + 20, videoY + 7);
          ctx.fillStyle = 'white';
          ctx.fillText(label, videoX + 20, videoY + 7);
        });
      }

      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [annotations, detectedBox, modelBounds]);

  return (
    <div className="video-container" style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', maxWidth: '1280px', display: 'block' }}
      />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          width: '100%',
          maxWidth: '1280px'
        }}
      />
      
      {/* Detection info overlay */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10px', 
        left: '10px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        {detectedBox && (
          <div style={{ 
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            ✓ {detectedBox.class || 'Object'} detected ({Math.round(detectedBox.score * 100)}%)
            <br />
            <small>{detectedBox.source === 'gpt-4v' ? '🤖 AI Vision' : '⚡ Fast Detection'}</small>
          </div>
        )}
        
        {/* Toggle button */}
        <button
          onClick={() => setUseVision(!useVision)}
          style={{
            padding: '8px 16px',
            background: useVision ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {useVision ? '🤖 AI Vision ON' : '⚡ Fast Mode'}
        </button>
      </div>
    </div>
  );
}
