import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, Line } from '@react-three/drei';
import { useState, useEffect } from 'react';

function Model({ url, onModelClick, onMeshLoaded, pathPoints = [], isDrawingPath = false }) {
  const { scene } = useGLTF(url);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Extract mesh vertices when model loads
  useEffect(() => {
    if (scene && onMeshLoaded) {
      const vertices = [];
      scene.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const positions = child.geometry.attributes.position;
          if (positions) {
            // Convert to array of [x, y, z] coordinates
            for (let i = 0; i < positions.count; i++) {
              vertices.push([
                positions.getX(i),
                positions.getY(i),
                positions.getZ(i)
              ]);
            }
          }
        }
      });
      
      console.log(`Extracted ${vertices.length} vertices from mesh`);
      onMeshLoaded({ vertices, vertexCount: vertices.length });
    }
  }, [scene, onMeshLoaded]);
  
  const handleClick = (event) => {
    // Get 3D coordinates of click
    const point = event.point;
    console.log('Clicked 3D position:', point.toArray());
    onModelClick({
      position: [point.x, point.y, point.z],
      id: Date.now(),
      label: 'Annotation'
    });
  };

  const handlePointerMove = (event) => {
    if (event.intersections.length > 0) {
      setHoveredPoint(event.point);
    }
  };

  const handlePointerOut = () => {
    setHoveredPoint(null);
  };
  
  return (
    <group>
      <primitive 
        object={scene} 
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      />
      
      {/* Show hover preview */}
      {hoveredPoint && !isDrawingPath && (
        <mesh position={hoveredPoint}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.5} />
        </mesh>
      )}
      
      {/* Render incision path */}
      {pathPoints.length > 0 && (
        <>
          {/* Path points */}
          {pathPoints.map((point, idx) => (
            <mesh key={idx} position={point}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial 
                color={
                  idx === 0 ? '#0066cc' : // Blue for start
                  idx === pathPoints.length - 1 ? '#ff3b30' : // Red for end
                  '#ffcc00' // Yellow for middle points
                } 
              />
            </mesh>
          ))}
          
          {/* Connected lines */}
          {pathPoints.length > 1 && (
            <Line
              points={pathPoints}
              color="#0066cc"
              lineWidth={3}
              dashed={isDrawingPath}
            />
          )}
        </>
      )}
      
      {/* Drawing mode cursor */}
      {isDrawingPath && hoveredPoint && (
        <mesh position={hoveredPoint}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#0066cc" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

function Annotation({ position, label, id }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>
      {/* Text label could be added using HTML overlay */}
    </group>
  );
}

// Component to track camera changes and send them to parent
function CameraTracker({ onCameraUpdate }) {
  const { camera } = useThree();
  
  useFrame(() => {
    if (onCameraUpdate) {
      onCameraUpdate({
        position: camera.position.clone(),
        rotation: camera.rotation.clone(),
        quaternion: camera.quaternion.clone(),
        fov: camera.fov,
        aspect: camera.aspect,
        near: camera.near,
        far: camera.far,
        projectionMatrix: camera.projectionMatrix.clone(),
        matrixWorldInverse: camera.matrixWorldInverse.clone()
      });
    }
  });
  
  return null;
}

export default function ModelViewer({ 
  modelUrl, 
  annotations, 
  onAddAnnotation, 
  onCameraUpdate, 
  onMeshLoaded,
  pathPoints,
  isDrawingPath 
}) {
  return (
    <Canvas style={{ height: '600px', background: '#1a1a1a' }}>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} />
      
      {/* Debugging helpers */}
      <axesHelper args={[2]} />
      <gridHelper args={[4, 10]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} />
      
      {modelUrl && (
        <Model 
          url={modelUrl} 
          onModelClick={onAddAnnotation} 
          onMeshLoaded={onMeshLoaded}
          pathPoints={pathPoints}
          isDrawingPath={isDrawingPath}
        />
      )}
      
      {annotations.map(ann => (
        <Annotation key={ann.id} {...ann} />
      ))}
      
      <OrbitControls />
      
      {onCameraUpdate && <CameraTracker onCameraUpdate={onCameraUpdate} />}
    </Canvas>
  );
}
