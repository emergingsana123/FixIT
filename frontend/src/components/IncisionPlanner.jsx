import { useState } from 'react';
import { Line } from '@react-three/drei';
import './IncisionPlanner.css';

export function IncisionPlanner({ 
  modelUrl, 
  structures, 
  meshData,
  pathPoints,
  isDrawingPath,
  onStartDrawing,
  onFinishDrawing,
  onClearPath
}) {
  const [pathAnalysis, setPathAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFinishDrawing = async () => {
    if (pathPoints.length < 2) {
      alert('Need at least 2 points to create an incision path');
      onClearPath();
      return;
    }

    // Analyze the path
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/analyze-incision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path_points: pathPoints,
          annotations: structures || [],
          mesh_vertices: meshData?.vertices || []
        })
      });

      const analysis = await res.json();
      setPathAnalysis(analysis);
      onFinishDrawing();
    } catch (error) {
      console.error('Path analysis failed:', error);
      alert('Failed to analyze path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearPath = () => {
    setPathAnalysis(null);
    onClearPath();
  };

  const getSegmentColor = (confidence) => {
    if (confidence >= 0.80) return '#2E7D32';  // Safe green
    if (confidence >= 0.60) return '#F57C00';  // Caution orange
    return '#C62828';  // Danger red
  };

  const getSegmentStatus = (confidence) => {
    if (confidence >= 0.80) return 'safe';
    if (confidence >= 0.60) return 'caution';
    return 'danger';
  };

  const getClearanceFromConfidence = (confidence) => {
    // Map confidence to approximate mm clearance
    if (confidence >= 0.90) return '>15mm';
    if (confidence >= 0.80) return '12-15mm';
    if (confidence >= 0.70) return '8-12mm';
    if (confidence >= 0.60) return '5-8mm';
    return '<5mm';
  };

  return (
    <div className="path-planner-container">
      <h3 className="path-planner-title">
        SURGICAL CORRIDOR PLANNING
      </h3>

      {/* Controls */}
      <div className="path-controls">
        {!isDrawingPath && pathPoints.length === 0 && (
          <button
            onClick={onStartDrawing}
            className="medical-btn medical-btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            📍 Plan Access Path
          </button>
        )}

        {isDrawingPath && (
          <>
            <button
              onClick={handleFinishDrawing}
              disabled={pathPoints.length < 2}
              className="medical-btn"
              style={{
                padding: '10px 20px',
                background: pathPoints.length < 2 ? '#666' : '#2E7D32',
                fontSize: '14px',
                fontWeight: 'bold',
                flex: 1
              }}
            >
              ✓ Validate Path ({pathPoints.length} points)
            </button>
            <button
              onClick={handleClearPath}
              className="medical-btn medical-btn-danger"
              style={{
                padding: '10px 20px',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </>
        )}

        {!isDrawingPath && pathPoints.length > 0 && (
          <button
            onClick={handleClearPath}
            className="medical-btn"
            style={{
              padding: '10px 20px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear Path
          </button>
        )}
      </div>

      {/* Instructions */}
      {isDrawingPath && (
        <div className="path-instruction">
          👆 Click on the 3D model to add waypoints to your surgical corridor. Minimum 2 points required.
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="path-loading">
          <div>Analyzing surgical corridor safety...</div>
          <div className="path-loading-detail">
            Computing clearance for {pathPoints.length - 1} segments
          </div>
        </div>
      )}

      {/* Path Analysis Results */}
      {pathAnalysis && !loading && (
        <div className={`path-analysis ${
          pathAnalysis.recommendation === 'SPECIALIST_REQUIRED' ? 'danger' :
          pathAnalysis.recommendation === 'CAUTION' ? 'caution' :
          'safe'
        }`}>
          {/* Overall Assessment */}
          <div className={`path-assessment ${
            pathAnalysis.recommendation === 'SPECIALIST_REQUIRED' ? 'danger' :
            pathAnalysis.recommendation === 'CAUTION' ? 'caution' :
            'safe'
          }`}>
            <div className={`path-assessment-title ${
              pathAnalysis.recommendation === 'SPECIALIST_REQUIRED' ? 'danger' :
              pathAnalysis.recommendation === 'CAUTION' ? 'caution' :
              'safe'
            }`}>
              {pathAnalysis.recommendation === 'SPECIALIST_REQUIRED' ? '🔴 SPECIALIST REQUIRED' :
               pathAnalysis.recommendation === 'CAUTION' ? '🟡 PROCEED WITH CAUTION' :
               '🟢 PATH APPROVED'}
            </div>
            <div className="path-confidence">
              Overall Safety: {(pathAnalysis.overall_confidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Alternative Paths Suggestion - Show when path is unsafe */}
          {pathAnalysis.overall_confidence < 0.80 && (
            <div className="alternative-paths">
              <div className="alternative-paths-title">
                💡 Alternative Paths Available
              </div>
              <div className="alternative-paths-description">
                {pathAnalysis.overall_confidence < 0.60 
                  ? '3 safer corridors identified with >15mm clearance from critical structures'
                  : '2 optimized paths available with improved safety margins'}
              </div>
              <button
                className="alternative-paths-button"
                onClick={() => alert('Alternative path visualization (Demo feature)')}
              >
                📊 View Alternative Corridors
              </button>
            </div>
          )}

          {/* Path Metrics */}
          <div className="path-metrics">
            <strong className="path-metrics-title">
              Corridor Metrics:
            </strong>
            <div className="path-metrics-grid">
              <div className="path-metric-item">
                <div className="path-metric-label">Total Length</div>
                <div className="path-metric-value">
                  {pathAnalysis.path_length_mm}<span className="path-metric-unit">mm</span>
                </div>
              </div>
              <div className="path-metric-item">
                <div className="path-metric-label">Waypoints</div>
                <div className="path-metric-value">
                  {pathAnalysis.num_segments + 1}
                </div>
              </div>
              <div className="path-metric-item">
                <div className="path-metric-label">Maximum Depth</div>
                <div className="path-metric-value">
                  {pathAnalysis.max_depth_mm}<span className="path-metric-unit">mm</span>
                </div>
              </div>
              <div className="path-metric-item">
                <div className="path-metric-label">Risk Level</div>
                <div className="path-metric-value" style={{ 
                  color: pathAnalysis.risk_level === 'high' ? '#C62828' :
                         pathAnalysis.risk_level === 'medium' ? '#F57C00' : '#2E7D32'
                }}>
                  {pathAnalysis.risk_level.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Segment Breakdown */}
          <div className="path-segments">
            <strong className="path-segments-title">
              Segment Analysis ({pathAnalysis.segments.length} segments):
            </strong>
            {pathAnalysis.segments.map((seg, idx) => {
              const status = getSegmentStatus(seg.confidence);
              const clearance = getClearanceFromConfidence(seg.confidence);
              
              return (
                <div key={idx} className={`path-segment ${status}`}>
                  <div className="path-segment-header">
                    <span className="path-segment-label">
                      Segment {seg.segment_index[0]} → {seg.segment_index[1]}
                    </span>
                    <span className={`path-segment-confidence ${status}`}>
                      {(seg.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="path-segment-details">
                    Length: {seg.length_mm}mm
                    <span className={`path-segment-clearance ${status}`}>
                      ↔ {clearance} clearance
                    </span>
                  </div>
                  {seg.risks && seg.risks.length > 0 && (
                    <div className="path-segment-risks">
                      {seg.risks.map((risk, ridx) => (
                        <div key={ridx} className="path-segment-risk">
                          ⚠️ {risk}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          {pathAnalysis.recommendations && pathAnalysis.recommendations.length > 0 && (
            <div className="path-recommendations">
              <strong className="path-recommendations-title">
                Clinical Recommendations:
              </strong>
              {pathAnalysis.recommendations.map((rec, idx) => (
                <div key={idx} className="path-recommendation-item">
                  💡 {rec}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {pathAnalysis.recommendation === 'SPECIALIST_REQUIRED' && (
            <button
              className="specialist-request-button"
              onClick={() => {
                if (window.medicalLayout) {
                  window.medicalLayout.incrementActions();
                }
                alert('� Specialist consultation request logged to session DEMO-5892\n\nRequesting:\n- Senior surgeon review\n- Alternative corridor planning\n- Risk mitigation protocol\n\n(Demo feature)');
              }}
            >
              🚨 Request Specialist Consultation
            </button>
          )}

          {pathAnalysis.recommendation === 'CAUTION' && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="medical-btn"
                style={{
                  padding: '10px 20px',
                  background: '#F57C00',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flex: 1
                }}
                onClick={() => {
                  if (window.medicalLayout) {
                    window.medicalLayout.incrementActions();
                  }
                  alert('⚠️ Path marked for cautious execution\n\nProcedure notes:\n- Continuous monitoring required\n- Strict clearance adherence\n- Imaging verification at each waypoint\n\n(Demo feature)');
                }}
              >
                ⚠️ Proceed with Monitoring
              </button>
              <button
                className="medical-btn medical-btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flex: 1
                }}
                onClick={() => alert('📊 Optimizing corridor trajectory... (Demo feature)')}
              >
                🔄 Optimize Path
              </button>
            </div>
          )}

          {pathAnalysis.overall_confidence >= 0.80 && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="medical-btn medical-btn-primary"
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flex: 1
                }}
                onClick={() => {
                  if (window.medicalLayout) {
                    window.medicalLayout.incrementActions();
                  }
                  alert('✅ Surgical corridor approved and locked\n\nTrajectory ID: TRAJ-' + Date.now().toString().slice(-6) + '\nSafety: ' + (pathAnalysis.overall_confidence * 100).toFixed(0) + '%\nStatus: READY FOR EXECUTION\n\n(Demo feature)');
                }}
              >
                ✅ Approve & Lock Trajectory
              </button>
              <button
                className="medical-btn"
                style={{
                  padding: '12px 20px',
                  background: '#666',
                  fontSize: '14px',
                  flex: 1
                }}
                onClick={() => alert('📊 Viewing alternative safe corridors... (Demo feature)')}
              >
                📊 View Alternatives
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Path rendering component for Three.js (to be used in ModelViewer)
export function PathLines({ pathPoints, segments }) {
  if (!pathPoints || pathPoints.length < 2) return null;

  const getSegmentColor = (confidence) => {
    if (confidence >= 0.80) return '#2E7D32';  // Safe green
    if (confidence >= 0.60) return '#F57C00';  // Caution orange
    return '#C62828';  // Danger red
  };

  return (
    <group>
      {/* Draw each segment with its own color */}
      {segments && segments.map((seg, idx) => (
        <Line
          key={idx}
          points={[seg.start, seg.end]}
          color={getSegmentColor(seg.confidence)}
          lineWidth={3}
        />
      ))}

      {/* Draw waypoint markers */}
      {pathPoints.map((point, idx) => (
        <mesh key={idx} position={point}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color={
            idx === 0 ? '#2E7D32' :  // Start point - green
            idx === pathPoints.length - 1 ? '#C62828' :  // End point - red
            '#F57C00'  // Mid points - orange
          } />
        </mesh>
      ))}
    </group>
  );
}
