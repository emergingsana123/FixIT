import { useEffect, useState, useRef } from 'react'

export function useWebSocket(clientId) {
  const [ws, setWs] = useState(null)
  const [connected, setConnected] = useState(false)
  const reconnectTimeout = useRef(null)
  
  useEffect(() => {
    const connect = () => {
      const websocket = new WebSocket(
        `ws://localhost:8000/ws/${clientId}`
      )
      
      websocket.onopen = () => {
        setConnected(true)
        console.log('✓ WebSocket connected')
      }
      
      websocket.onclose = () => {
        setConnected(false)
        console.log('WebSocket disconnected, reconnecting...')
        // Reconnect after 2 seconds
        reconnectTimeout.current = setTimeout(connect, 2000)
      }
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      setWs(websocket)
    }
    
    connect()
    
    return () => {
      clearTimeout(reconnectTimeout.current)
      if (ws) {
        ws.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])
  
  return { ws, connected }
}
