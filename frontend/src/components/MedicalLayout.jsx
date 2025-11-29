import { useState, useEffect } from 'react';
import './MedicalLayout.css';

export function MedicalLayout({ 
  planningPanel, 
  guidancePanel, 
  analysisPanel 
}) {
  const [sessionStart] = useState(Date.now());
  const [sessionTime, setSessionTime] = useState('0m 0s');
  const [actionCount, setActionCount] = useState(0);
  const [aiAnalysisCount, setAIAnalysisCount] = useState(0);

  // Update session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setSessionTime(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStart]);

  // Expose methods to increment counters
  useEffect(() => {
    window.medicalLayout = {
      incrementActions: () => setActionCount(prev => prev + 1),
      incrementAIAnalyses: () => setAIAnalysisCount(prev => prev + 1),
      getStats: () => ({ actionCount, aiAnalysisCount, sessionTime })
    };
  }, [actionCount, aiAnalysisCount, sessionTime]);

  return (
    <div className="medical-layout">
      {/* Header */}
      <header className="medical-header">
        <div className="medical-header-left">
          <h1 className="medical-title">
            <span className="medical-icon">🏥</span>
            SURGICAL AR GUIDANCE SYSTEM
          </h1>
        </div>
        <div className="medical-header-right">
          <span className="session-badge">Demo Mode</span>
          <span className="session-id">Session: DEMO-5892</span>
          <span className="session-time">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </header>

      {/* Three-Panel Grid */}
      <div className="medical-grid">
        {/* Left Panel: Preoperative Planning */}
        <div className="medical-panel medical-panel-planning">
          <div className="panel-header">
            <h2 className="panel-title">PREOPERATIVE PLANNING</h2>
            <span className="panel-subtitle">Anatomical Model Analysis</span>
          </div>
          <div className="panel-content">
            {planningPanel}
          </div>
        </div>

        {/* Center Panel: Intraoperative Guidance */}
        <div className="medical-panel medical-panel-guidance">
          <div className="panel-header">
            <h2 className="panel-title">REAL-TIME GUIDANCE</h2>
            <span className="panel-subtitle">AR Navigation Overlay</span>
          </div>
          <div className="panel-content">
            {guidancePanel}
          </div>
        </div>

        {/* Right Panel: AI Decision Support */}
        <div className="medical-panel medical-panel-analysis">
          <div className="panel-header">
            <h2 className="panel-title">AI DECISION SUPPORT</h2>
            <span className="panel-subtitle">Safety Analysis & Recommendations</span>
          </div>
          <div className="panel-content panel-content-scrollable">
            {analysisPanel}
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="medical-footer">
        <div className="footer-section">
          <span className="footer-label">Session Duration:</span>
          <span className="footer-value">{sessionTime}</span>
        </div>
        <div className="footer-divider">|</div>
        <div className="footer-section">
          <span className="footer-label">Actions:</span>
          <span className="footer-value">{actionCount}</span>
        </div>
        <div className="footer-divider">|</div>
        <div className="footer-section">
          <span className="footer-label">AI Analyses:</span>
          <span className="footer-value">{aiAnalysisCount}</span>
        </div>
        <div className="footer-divider">|</div>
        <div className="footer-section">
          <span className="footer-label">Model:</span>
          <span className="footer-value">Demo Object</span>
        </div>
        <div className="footer-divider">|</div>
        <div className="footer-section">
          <span className="footer-label">System Status:</span>
          <span className="footer-value footer-status-healthy">● Operational</span>
        </div>
      </footer>
    </div>
  );
}
