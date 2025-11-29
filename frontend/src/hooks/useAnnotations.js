import { useState, useCallback, useEffect } from 'react'

export function useAnnotations(websocket) {
  const [annotations, setAnnotations] = useState([])
  
  const addAnnotation = useCallback((annotation) => {
    const newAnn = { ...annotation, id: annotation.id || Date.now() }
    setAnnotations(prev => [...prev, newAnn])
    
    // Send to other clients via WebSocket
    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'annotation_added',
        annotation: newAnn
      }))
    }
  }, [websocket])
  
  const removeAnnotation = useCallback((id) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id))
    
    // Send removal to other clients
    if (websocket?.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'annotation_removed',
        id: id
      }))
    }
  }, [websocket])
  
  // Listen for annotations from other clients
  useEffect(() => {
    if (!websocket) return
    
    const handleMessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'annotation_added') {
        setAnnotations(prev => [...prev, data.annotation])
      } else if (data.type === 'annotation_removed') {
        setAnnotations(prev => prev.filter(ann => ann.id !== data.id))
      }
    }
    
    websocket.addEventListener('message', handleMessage)
    return () => websocket.removeEventListener('message', handleMessage)
  }, [websocket])
  
  return { annotations, addAnnotation, removeAnnotation }
}
