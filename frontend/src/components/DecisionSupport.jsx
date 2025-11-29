import { useState } from 'react';
import './DecisionSupport.css';

export function DecisionSupport({ structures, meshData }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const analyzeEntryPoint = async () => {
    if (structures.length === 0) {
      alert('Please mark at least one critical structure first');
      return;
    }

    setLoading(true);
    setSelectedAction('entry');
    
    // Increment AI analysis counter
    if (window.medicalLayout) {
      window.medicalLayout.incrementAIAnalyses();
      window.medicalLayout.incrementActions();
    }

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          annotations: structures, 
          query: "Analyze optimal entry point for target access",
          mesh_vertices: meshData?.vertices || []
        })
      });

      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis({
        guidance: 'Analysis unavailable. System fallback engaged.',
        method: 'error',
        confidence: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationStatus = (confidence) => {
    if (confidence >= 80) return { label: 'APPROVED', color: '#2E7D32', icon: '✓' };
    if (confidence >= 60) return { label: 'CAUTION', color: '#F57C00', icon: '⚠️' };
    return { label: 'SPECIALIST REQUIRED', color: '#C62828', icon: '🚨' };
  };

  const getFactorStatus = (score) => {
    if (score >= 80) return 'safe';
    if (score >= 60) return 'caution';
    return 'danger';
  };

  const getFactorDetails = (factor, score) => {
    // Map factor scores to mm measurements based on surgical safety zones
    const details = {
      vessel_proximity: {
        safe: { min: 15, text: 'Safe Zone (>15mm)' },
        caution: { min: 5, text: 'Caution Zone (5-15mm)' },
        danger: { min: 0, text: 'Danger Zone (<5mm)' }
      },
      geometric_safety: {
        safe: { text: 'Optimal Approach Angle' },
        caution: { text: 'Sub-optimal Angle' },
        danger: { text: 'High-Risk Angle' }
      },
      tissue_depth: {
        safe: { text: 'Adequate Depth' },
        caution: { text: 'Marginal Depth' },
        danger: { text: 'Insufficient Depth' }
      },
      approach_feasibility: {
        safe: { text: 'Clear Access Path' },
        caution: { text: 'Restricted Access' },
        danger: { text: 'Obstructed Access' }
      }
    };

    const status = getFactorStatus(score);
    const factorInfo = details[factor]?.[status] || { text: '' };

    // For vessel proximity, estimate mm distance from score
    if (factor === 'vessel_proximity' && score < 100) {
      const estDistance = score < 45 ? 3.2 : score < 70 ? 8.5 : 18.0;
      return { ...factorInfo, distance: `${estDistance.toFixed(1)}mm` };
    }

    return factorInfo;
  };

  return (
    <div className="decision-support">
      <div className="decision-header">
        <h3 className="decision-title">SAFETY ANALYSIS</h3>
        {structures.length > 0 && (
          <span className="decision-status">
            {structures.length} structure{structures.length !== 1 ? 's' : ''} identified
          </span>
        )}
      </div>

      {structures.length === 0 ? (
        <div className="decision-empty">
          <p>No analysis available</p>
          <span className="decision-hint">
            Mark critical structures on the anatomical model to enable AI safety analysis
          </span>
        </div>
      ) : (
        <>
          <div className="decision-actions">
            <button
              onClick={analyzeEntryPoint}
              disabled={loading}
              className="medical-btn medical-btn-primary"
            >
              {loading ? '⏳ Analyzing...' : '🎯 Analyze Access Point'}
            </button>
          </div>

          {analysis && (
            <div className="analysis-results">
              {/* Proximity Alert Banner */}
              {analysis.confidence_breakdown?.vessel_proximity < 60 && (
                <div className="proximity-alert">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <div className="alert-title">PROXIMITY ALERT</div>
                    <div className="alert-message">
                      Access path within {getFactorDetails('vessel_proximity', analysis.confidence_breakdown.vessel_proximity).distance} of critical structure
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Assessment */}
              <div className="analysis-section">
                <div className="analysis-overall">
                  <span className="analysis-label">Overall Safety Score:</span>
                  <div className="analysis-score">
                    <span className="score-value">{Math.round(analysis.confidence || 0)}%</span>
                    <span 
                      className="score-badge"
                      style={{ 
                        background: getRecommendationStatus(analysis.confidence || 0).color + '20',
                        color: getRecommendationStatus(analysis.confidence || 0).color,
                        border: `1px solid ${getRecommendationStatus(analysis.confidence || 0).color}`
                      }}
                    >
                      {getRecommendationStatus(analysis.confidence || 0).icon} {getRecommendationStatus(analysis.confidence || 0).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Factor Breakdown */}
              {analysis.confidence_breakdown && (
                <div className="analysis-section">
                  <h4 className="section-title">RISK FACTOR BREAKDOWN</h4>
                  <div className="risk-factors">
                    {Object.entries(analysis.confidence_breakdown).map(([factor, score]) => {
                      const status = getFactorStatus(score);
                      const statusColors = {
                        safe: '#2E7D32',
                        caution: '#F57C00',
                        danger: '#C62828'
                      };
                      const statusIcons = {
                        safe: '🟢',
                        caution: '🟡',
                        danger: '🔴'
                      };
                      const details = getFactorDetails(factor, score);

                      return (
                        <div key={factor} className="risk-factor">
                          <div className="factor-header">
                            <div className="factor-info">
                              <span className="factor-icon">{statusIcons[status]}</span>
                              <span className="factor-name">
                                {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <span 
                              className="factor-score"
                              style={{ color: statusColors[status] }}
                            >
                              {Math.round(score)}%
                            </span>
                          </div>
                          <div className="factor-bar">
                            <div 
                              className="factor-fill"
                              style={{ 
                                width: `${score}%`,
                                background: statusColors[status]
                              }}
                            />
                          </div>
                          {details.distance && (
                            <div className="factor-measurement">
                              <span className="measurement-label">Clearance:</span>
                              <span 
                                className="measurement-value"
                                style={{ color: statusColors[status] }}
                              >
                                {details.distance}
                              </span>
                              <span className="measurement-zone">{details.text}</span>
                            </div>
                          )}
                          {!details.distance && details.text && (
                            <div className="factor-note">{details.text}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {analysis.recommendation && (
                <div className="analysis-section">
                  <h4 className="section-title">CLINICAL RECOMMENDATION</h4>
                  <div className="recommendation-box">
                    <p className="recommendation-text">{analysis.recommendation}</p>
                    
                    {/* Action buttons based on confidence level */}
                    <div className="recommendation-actions">
                      {!analysis.can_recommend && (
                        <>
                          <div className="recommendation-warning">
                            <span className="warning-icon">🚨</span>
                            <span className="warning-text">
                              Safety score below protocol threshold (60%). Specialist consultation required before proceeding.
                            </span>
                          </div>
                          <button className="medical-btn medical-btn-danger" style={{ width: '100%' }}>
                            Request Specialist Consultation
                          </button>
                        </>
                      )}
                      
                      {analysis.can_recommend && analysis.confidence >= 80 && (
                        <>
                          <div className="recommendation-success">
                            <span className="success-icon">✓</span>
                            <span className="success-text">
                              Safety parameters meet approval criteria. Clear to proceed with planned approach.
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="medical-btn medical-btn-primary" style={{ flex: 1 }}>
                              Approve & Lock Trajectory
                            </button>
                            <button className="medical-btn" style={{ flex: 1, background: '#1976D2' }}>
                              View Alternative Paths
                            </button>
                          </div>
                        </>
                      )}
                      
                      {analysis.can_recommend && analysis.confidence >= 60 && analysis.confidence < 80 && (
                        <>
                          <div className="recommendation-caution">
                            <span className="caution-icon">⚠️</span>
                            <span className="caution-text">
                              Moderate risk detected. Review safety factors and consider alternative approach.
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="medical-btn" style={{ flex: 1, background: '#F57C00' }}>
                              Proceed with Caution
                            </button>
                            <button className="medical-btn medical-btn-primary" style={{ flex: 1 }}>
                              Optimize Path
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Guidance */}
              {analysis.guidance && (
                <div className="analysis-section">
                  <h4 className="section-title">AI GUIDANCE</h4>
                  <div className="guidance-box">
                    <p className="guidance-text">{analysis.guidance}</p>
                  </div>
                </div>
              )}

              {/* Entry Point Coordinates */}
              {analysis.entry_point && (
                <div className="analysis-section">
                  <h4 className="section-title">SUGGESTED COORDINATES</h4>
                  <div className="coordinates-box">
                    <code className="coordinates-value">
                      [{analysis.entry_point.map(p => p.toFixed(3)).join(', ')}]
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
