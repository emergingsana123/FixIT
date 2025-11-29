import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { useState } from 'react'
import './ModelViewer.css'

function Model({ url, onModelClick }) {
  const { scene } = useGLTF(url)
  
  const handleClick = (event) => {
    event.stopPropagation()
    const point = event.point
    onModelClick({
      position: [point.x, point.y, point.z],
      id: Date.now(),
      label: `Point ${Date.now()}`
    })
  }
  
  return <primitive object={scene} onClick={handleClick} />
}

function Annotation({ position, label, id, onClick }) {
  return (
    <group position={position}>
      <mesh onClick={() => onClick && onClick(id)}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>
      {/* Label will be rendered using HTML overlay */}
    </group>
  )
}

export default function ModelViewer({ modelUrl, annotations, onAddAnnotation, onRemoveAnnotation }) {
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null)

  if (!modelUrl) {
    return (
      <div className="model-viewer-placeholder">
        <p>Upload a video to generate 3D model</p>
      </div>
    )
  }

  return (
    <div className="model-viewer-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.3} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Model url={modelUrl} onModelClick={onAddAnnotation} />
        
        {annotations.map(ann => (
          <Annotation 
            key={ann.id} 
            {...ann}
            onClick={onRemoveAnnotation}
          />
        ))}
        
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
      
      {/* Annotation labels overlay */}
      <div className="annotation-labels">
        {annotations.map(ann => (
          <div 
            key={ann.id} 
            className="annotation-label"
            style={{
              position: 'absolute',
              color: 'white',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none'
            }}
          >
            {ann.label}
          </div>
        ))}
      </div>
    </div>
  )
}
