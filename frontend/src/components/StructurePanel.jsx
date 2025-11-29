import './StructurePanel.css';

export function StructurePanel({ structures = [], onRemove }) {
  const getStructureType = (label) => {
    if (label.toLowerCase().includes('vessel') || label.toLowerCase().includes('artery') || label.toLowerCase().includes('vein')) {
      return 'vessel';
    }
    if (label.toLowerCase().includes('nerve')) {
      return 'nerve';
    }
    if (label.toLowerCase().includes('target') || label.toLowerCase().includes('tumor')) {
      return 'target';
    }
    return 'other';
  };

  const getStructureIcon = (type) => {
    switch (type) {
      case 'vessel': return '🩸';
      case 'nerve': return '⚡';
      case 'target': return '🎯';
      default: return '📍';
    }
  };

  const getStructureColor = (type) => {
    switch (type) {
      case 'vessel': return '#C62828';
      case 'nerve': return '#F57C00';
      case 'target': return '#1976D2';
      default: return '#9AA0A6';
    }
  };

  return (
    <div className="structure-panel">
      <div className="structure-header">
        <h3 className="structure-title">IDENTIFIED STRUCTURES</h3>
        <span className="structure-count">{structures.length} marked</span>
      </div>

      {structures.length === 0 ? (
        <div className="structure-empty">
          <p>No critical structures identified</p>
          <span className="structure-hint">Click on the anatomical model to mark critical structures</span>
        </div>
      ) : (
        <div className="structure-list">
          {structures.map((structure, idx) => {
            const type = getStructureType(structure.label);
            const icon = getStructureIcon(type);
            const color = getStructureColor(type);

            return (
              <div key={structure.id} className="structure-item">
                <div className="structure-item-header">
                  <span className="structure-icon" style={{ color }}>
                    {icon}
                  </span>
                  <div className="structure-info">
                    <span className="structure-name">
                      Critical Structure #{idx + 1}
                    </span>
                    <span className="structure-type" style={{ color }}>
                      {type.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(structure.id)}
                    className="structure-remove"
                    title="Remove structure"
                  >
                    ×
                  </button>
                </div>
                <div className="structure-coordinates">
                  <span className="coord-label">Position:</span>
                  <code className="coord-value">
                    [{structure.position.map(p => p.toFixed(2)).join(', ')}]
                  </code>
                </div>
                <div className="structure-metadata">
                  <span className="metadata-item">
                    <span className="metadata-label">Clearance Required:</span>
                    <span className="metadata-value">&gt;5mm</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {structures.length > 0 && (
        <div className="structure-footer">
          <div className="structure-stats">
            <div className="stat-item">
              <span className="stat-label">Total Structures:</span>
              <span className="stat-value">{structures.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Min. Clearance:</span>
              <span className="stat-value stat-warning">5mm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
