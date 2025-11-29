import { useRef, useEffect, useState } from 'react';

/**
 * Simplified VideoCapture without TensorFlow dependencies
 * Uses a manual calibration approach for demo purposes
 */
export function VideoCapture({ annotations, cameraState }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [bottleBox, setBottleBox] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [modelBounds] = useState({
    minX: -0.5,
    maxX: 0.5,
    minY: -1.0,  // Bottom of bottle
    maxY: 1.0,   // Top of bottle (cap)
    minZ: -0.5,
    maxZ: 0.5
  });

  // Start webcam
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
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle manual bottle region selection
  const handleCanvasClick = (e) => {
    if (!isCalibrating) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (!bottleBox) {
      // First click: set top-left corner
      setBottleBox({ x, y, width: 0, height: 0 });
    } else {
      // Second click: set bottom-right corner
      const width = x - bottleBox.x;
      const height = y - bottleBox.y;
      setBottleBox({ ...bottleBox, width, height });
      setIsCalibrating(false);
    }
  };

  // Draw annotations on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw calibration box if set
      if (bottleBox && bottleBox.width > 0 && bottleBox.height > 0) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(bottleBox.x, bottleBox.y, bottleBox.width, bottleBox.height);
      }

      // Draw annotations if bottle box is set
      if (bottleBox && bottleBox.width > 0 && bottleBox.height > 0 && annotations.length > 0) {
        annotations.forEach((ann) => {
          const [x3d, y3d, z3d] = ann.position;
          
          // Normalize 3D position to 0-1 range
          const normalizedX = (x3d - modelBounds.minX) / (modelBounds.maxX - modelBounds.minX);
          const normalizedY = (y3d - modelBounds.minY) / (modelBounds.maxY - modelBounds.minY);
          
          // Map to bottle bounding box (flip Y for video coordinates)
          const videoX = bottleBox.x + (normalizedX * bottleBox.width);
          const videoY = bottleBox.y + ((1 - normalizedY) * bottleBox.height);

          // Draw annotation marker
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(videoX, videoY, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Draw label
          const label = ann.label || 'Annotation';
          ctx.font = 'bold 16px Arial';
          
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(videoX + 15, videoY - 10, textWidth + 10, 25);
          
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
  }, [annotations, bottleBox, modelBounds]);

  return (
    <div style={{ position: 'relative' }}>
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
        onClick={handleCanvasClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          maxWidth: '1280px',
          cursor: isCalibrating ? 'crosshair' : 'default',
          pointerEvents: isCalibrating ? 'auto' : 'none'
        }}
      />
      <div style={{ marginTop: '10px' }}>
        {!bottleBox || bottleBox.width === 0 ? (
          <button 
            onClick={() => setIsCalibrating(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📍 Calibrate Bottle Position
          </button>
        ) : (
          <button 
            onClick={() => {
              setBottleBox(null);
              setIsCalibrating(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✓ Recalibrate
          </button>
        )}
        {isCalibrating && !bottleBox && (
          <p style={{ color: '#fff', marginTop: '10px' }}>
            Click top-left corner of the bottle
          </p>
        )}
        {isCalibrating && bottleBox && bottleBox.width === 0 && (
          <p style={{ color: '#fff', marginTop: '10px' }}>
            Click bottom-right corner of the bottle
          </p>
        )}
      </div>
    </div>
  );
}
