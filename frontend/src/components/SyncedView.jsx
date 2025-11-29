import { useState } from 'react';
import ModelViewer from './ModelViewer';
import { VideoCapture } from './VideoCapture';

export function SyncedView({ 
  modelUrl, 
  onAnnotationClick, 
  annotations, 
  selectedAnnotation,
  onMeshLoaded,
  pathPoints,
  isDrawingPath,
  showModelPanel = true,
  showVideoPanel = true
}) {
  const [cameraState, setCameraState] = useState(null);

  const handleCameraUpdate = (camera) => {
    setCameraState(camera);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', width: '100%', height: '100%' }}>
      {/* 3D Model Viewer */}
      {showModelPanel && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ModelViewer 
            modelUrl={modelUrl} 
            annotations={annotations}
            onAddAnnotation={onAnnotationClick}
            onCameraUpdate={handleCameraUpdate}
            onMeshLoaded={onMeshLoaded}
            pathPoints={pathPoints}
            isDrawingPath={isDrawingPath}
          />
        </div>
      )}

      {/* AR Video Overlay */}
      {showVideoPanel && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <VideoCapture 
            annotations={annotations} 
            cameraState={cameraState}
          />
          {!cameraState && (
            <p style={{ color: '#9AA0A6', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
              Waiting for camera sync...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
