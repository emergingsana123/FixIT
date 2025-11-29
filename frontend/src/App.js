import { useState } from 'react';
// import ModelViewer from './components/ModelViewer';
import { SyncedView } from './components/SyncedView';
import { DecisionSupport } from './components/DecisionSupport';
import { IncisionPlanner } from './components/IncisionPlanner';
import { StructurePanel } from './components/StructurePanel';
import { MedicalLayout } from './components/MedicalLayout';
import { useWebSocket } from './hooks/useWebSocket';
import { useAnnotations } from './hooks/useAnnotations';
import './App.css';

function App() {
  const [modelUrl, setModelUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [clientId] = useState(() => `client_${Date.now()}`)
  const [meshData, setMeshData] = useState(null)
  const [isDrawingPath, setIsDrawingPath] = useState(false)
  const [pathPoints, setPathPoints] = useState([])
  
  const { ws, connected } = useWebSocket(clientId)
  const { annotations, addAnnotation, removeAnnotation } = useAnnotations(ws)
  
  const handleMeshLoaded = (data) => {
    console.log('Mesh loaded:', data.vertexCount, 'vertices');
    setMeshData(data);
  };
  
  const handlePathPointClick = (point) => {
    if (isDrawingPath) {
      setPathPoints([...pathPoints, point.position]);
    } else {
      // Normal annotation mode
      addAnnotation(point);
    }
  };
  
  const handleVideoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    setUploading(true)
    setProgress({ step: 'Uploading video', percentage: 0 })
    
    try {
      // Upload video
      const formData = new FormData()
      formData.append('video', file)
      
      const uploadResponse = await fetch('http://localhost:8000/upload-video', {
        method: 'POST',
        body: formData
      })
      
      const { job_id } = await uploadResponse.json()
      
      setProgress({ step: 'Processing video', percentage: 10 })
      
      // Start reconstruction
      const reconstructResponse = await fetch(
        `http://localhost:8000/reconstruct/${job_id}`,
        { method: 'POST' }
      )
      
      const { model_path } = await reconstructResponse.json()
      
      // Set model URL
      const filename = model_path.split('/').pop()
      setModelUrl(`http://localhost:8000/models/${filename}`)
      setProgress({ step: 'Complete', percentage: 100 })
      
      setTimeout(() => {
        setUploading(false)
        setProgress(null)
      }, 1000)
      
    } catch (error) {
      console.error('Upload failed:', error)
      setUploading(false)
      setProgress(null)
      alert('Failed to process video. Please try again.')
    }
  }
  
  const resetApp = () => {
    setModelUrl(null)
    removeAnnotation(null) // Clear all
  }
  
  return (
    <div className="app">
      {!modelUrl && !uploading && (
        <>
          <header className="app-header">
            <h1>🏥 Surgical AR Guidance Demo</h1>
            <div className="connection-status">
              <span className={connected ? 'status-connected' : 'status-disconnected'}>
                {connected ? '● Connected' : '○ Disconnected'}
              </span>
            </div>
          </header>
          
          <div className="app-content">
            <div className="upload-section">
              <h2>Upload Surgical Video</h2>
              <p>Upload a video to generate a 3D reconstruction</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="file-input"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="btn-primary">
                Choose Video File
              </label>
            </div>
          </div>
        </>
      )}
      
      {uploading && progress && (
        <>
          <header className="app-header">
            <h1>🏥 Surgical AR Guidance Demo</h1>
          </header>
          <div className="app-content">
            <div className="progress-section">
              <h2>Processing...</h2>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p>{progress.step}</p>
            </div>
          </div>
        </>
      )}
      
      {modelUrl && (
        <MedicalLayout
          planningPanel={
            <SyncedView
              modelUrl={modelUrl}
              annotations={annotations}
              onAnnotationClick={handlePathPointClick}
              onRemoveAnnotation={removeAnnotation}
              onMeshLoaded={handleMeshLoaded}
              pathPoints={pathPoints}
              isDrawingPath={isDrawingPath}
              showVideoPanel={false}
            />
          }
          guidancePanel={
            <SyncedView
              modelUrl={modelUrl}
              annotations={annotations}
              onAnnotationClick={handlePathPointClick}
              onRemoveAnnotation={removeAnnotation}
              onMeshLoaded={handleMeshLoaded}
              pathPoints={pathPoints}
              isDrawingPath={isDrawingPath}
              showModelPanel={false}
            />
          }
          analysisPanel={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <StructurePanel structures={annotations} onRemove={removeAnnotation} />
              <DecisionSupport structures={annotations} meshData={meshData} />
              <IncisionPlanner
                modelUrl={modelUrl}
                structures={annotations}
                meshData={meshData}
                pathPoints={pathPoints}
                isDrawingPath={isDrawingPath}
                onStartDrawing={() => {
                  setIsDrawingPath(true);
                  setPathPoints([]);
                }}
                onFinishDrawing={() => setIsDrawingPath(false)}
                onClearPath={() => {
                  setPathPoints([]);
                  setIsDrawingPath(false);
                }}
              />
            </div>
          }
        />
      )}
    </div>
  )
}

export default App;
