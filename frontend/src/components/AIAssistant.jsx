import { useState } from 'react';

export function AIAssistant({ annotations, meshData }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (customQuery = null) => {
    const queryToUse = customQuery || query;
    if (!queryToUse.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          annotations, 
          query: queryToUse,
          mesh_vertices: meshData?.vertices || []
        })
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('AI query failed:', error);
      setResponse({
        guidance: 'Unable to analyze. Please try again.',
        method: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const quickQueries = [
    "What's the distance between these points?",
    "What's the safest approach angle?",
    "Are there any risk zones nearby?",
    "Provide surgical guidance"
  ];

  return (
    <div style={{
      background: '#2a2a2a',
      padding: '20px',
      borderRadius: '8px',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#fff' }}>🤖 AI Surgical Assistant</h3>

      <div style={{ marginBottom: '15px' }}>
        {quickQueries.map(q => (
          <button
            key={q}
            onClick={() => {
              setQuery(q);
              handleSubmit(q);
            }}
            disabled={loading || !annotations || annotations.length === 0}
            style={{
              background: '#0066cc',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              margin: '4px',
              borderRadius: '4px',
              cursor: loading || !annotations || annotations.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: loading || !annotations || annotations.length === 0 ? 0.5 : 1
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about measurements, risks, or guidance..."
          disabled={loading || !annotations || annotations.length === 0}
          style={{
            width: 'calc(100% - 100px)',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #444',
            borderRadius: '4px',
            background: '#1a1a1a',
            color: '#fff',
            marginRight: '10px'
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim() || !annotations || annotations.length === 0}
          style={{
            padding: '10px 20px',
            background: loading ? '#666' : '#00a86b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !query.trim() || !annotations || annotations.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Analyzing...' : 'Ask AI'}
        </button>
      </form>

      {!annotations || annotations.length === 0 ? (
        <div style={{
          padding: '15px',
          background: '#1a1a1a',
          borderRadius: '4px',
          color: '#a0a0a0',
          textAlign: 'center'
        }}>
          📍 Click on the 3D model to add annotations first
        </div>
      ) : null}

      {response && (
        <div style={{
          background: response.method === 'error' ? '#ff3b3033' : '#1a1a1a',
          padding: '15px',
          borderRadius: '4px',
          borderLeft: `4px solid ${
            response.method === 'error' ? '#ff3b30' : 
            response.confidence < 0.60 ? '#ff3b30' :
            response.confidence < 0.80 ? '#ff9500' : 
            '#00a86b'
          }`
        }}>
          {/* Confidence Breakdown */}
          {response.confidence_breakdown && (
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#fff', marginBottom: '8px', display: 'block' }}>
                Confidence Analysis:
              </strong>
              {Object.entries(response.confidence_breakdown).map(([factor, score]) => {
                const percentage = score * 100;
                const color = score >= 0.80 ? '#00a86b' : score >= 0.60 ? '#ff9500' : '#ff3b30';
                const emoji = score >= 0.80 ? '✓' : score >= 0.60 ? '⚠️' : '⚠️';
                const label = factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div key={factor} style={{ marginBottom: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '3px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#e0e0e0' }}>
                        {emoji} {label}
                      </span>
                      <span style={{ color, fontWeight: 'bold' }}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: '#333', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: color,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Overall Confidence Indicator */}
          {response.recommendation && (
            <div style={{
              padding: '12px',
              marginBottom: '15px',
              borderRadius: '6px',
              background: 
                response.recommendation === 'SPECIALIST_REQUIRED' ? '#ff3b3022' :
                response.recommendation === 'CAUTION' ? '#ff950022' :
                '#00a86b22',
              border: `2px solid ${
                response.recommendation === 'SPECIALIST_REQUIRED' ? '#ff3b30' :
                response.recommendation === 'CAUTION' ? '#ff9500' :
                '#00a86b'
              }`
            }}>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '15px',
                color: 
                  response.recommendation === 'SPECIALIST_REQUIRED' ? '#ff3b30' :
                  response.recommendation === 'CAUTION' ? '#ff9500' :
                  '#00a86b'
              }}>
                {response.recommendation === 'SPECIALIST_REQUIRED' ? '🔴 Specialist Required' :
                 response.recommendation === 'CAUTION' ? '🟠 Proceed with Caution' :
                 '🟢 AI Approved'}
              </div>
              <div style={{ color: '#e0e0e0', fontSize: '13px', marginTop: '5px' }}>
                Overall Confidence: {(response.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}

          {/* Rationale */}
          {response.rationale && (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#fff' }}>Analysis:</strong>
              <p style={{ color: '#e0e0e0', margin: '5px 0', fontSize: '14px' }}>
                {response.rationale}
              </p>
            </div>
          )}

          {/* Guidance (for /analyze endpoint) */}
          {response.guidance && !response.rationale && (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#fff' }}>Guidance:</strong>
              <p style={{ color: '#e0e0e0', margin: '5px 0' }}>{response.guidance}</p>
            </div>
          )}

          {response.measurements && Object.keys(response.measurements).length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#fff' }}>Measurements:</strong>
              {Object.entries(response.measurements).map(([key, value]) => (
                <div key={key} style={{ color: '#e0e0e0', marginLeft: '10px' }}>
                  • {key}: <strong>{value}</strong>
                </div>
              ))}
            </div>
          )}

          {response.warnings && response.warnings.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              {response.warnings.map((w, i) => (
                <div key={i} style={{
                  color: '#ff9500',
                  padding: '5px 10px',
                  background: '#ff950033',
                  borderRadius: '4px',
                  marginBottom: '5px'
                }}>
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {response.can_recommend === false && (
            <div style={{ marginTop: '15px' }}>
              <button
                onClick={() => alert('Specialist consultation request sent! (Demo)')}
                style={{
                  padding: '10px 20px',
                  background: '#ff3b30',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                🚨 Request Specialist Consultation
              </button>
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#ff9500', 
                textAlign: 'center' 
              }}>
                AI tried {response.alternatives_attempted || 1} alternative approaches
              </div>
            </div>
          )}

          {response.can_recommend === true && (
            <div style={{ marginTop: '15px' }}>
              <button
                style={{
                  padding: '10px 20px',
                  background: '#00a86b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                ✓ Approve & Proceed
              </button>
            </div>
          )}

          <div style={{
            color: '#a0a0a0',
            fontSize: '12px',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #444'
          }}>
            Confidence: {(response.confidence * 100).toFixed(0)}% · Method: {response.method}
          </div>
        </div>
      )}
    </div>
  );
}
