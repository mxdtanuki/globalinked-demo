import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopbarSidebar from '../../components/topbarSidebar';
import './manualExtract.css';

const ManualExtract = () => {
  const navigate = useNavigate();

  return (
    <TopbarSidebar>
      <div className="manualExtract-outer">
        <div className="manualExtract-wrapper">
          <div className="manualExtract-card">
            <div className="manualExtract-badge">Recommended</div>

            <div className="manualExtract-card-inner">
              <div className="manualExtract-icon-col">
                <div className="manualExtract-icon-box" aria-hidden>
                  {/* pencil icon (line art) */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 21l3-1 11-11 1-3-3 1-12 13z" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M14 6l3 3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="manualExtract-content-col">
                <h2 className="manualExtract-card-title">Manual Entry</h2>
                <p className="manualExtract-card-desc">Enter document details directly with full control and accuracy. Perfect for precise data entry and customization.</p>

                <ul className="manualExtract-features-list">
                  <li><span className="manualExtract-check" aria-hidden>✓</span>Complete control over every field and detail</li>
                  <li><span className="manualExtract-check" aria-hidden>✓</span>100% accuracy guaranteed with direct input</li>
                  <li><span className="manualExtract-check" aria-hidden>✓</span>Immediate processing with no extraction delays</li>
                  <li><span className="manualExtract-check" aria-hidden>✓</span>Better data quality and validation</li>
                </ul>

                <div className="manualExtract-start-row">
                  <button
                    className="manualExtract-start-btn"
                    onClick={() => navigate("/upload/manualEntryMOA")}
                    aria-label="Start Manual Entry"
                  >
                    <span>Start Manual Entry</span>
                    <span className="manualExtract-arrow">→
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="manualExtract-extracted-card">
            <div className="manualExtract-extracted-inner">
              <div className="manualExtract-extracted-icon">
                <div className="manualExtract-extracted-icon-box" aria-hidden>
                  {/* document/icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#3b4a55" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <path d="M14 2v6h6" stroke="#3b4a55" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              </div>

              <div className="manualExtract-extracted-content">
                <h3 className="manualExtract-extracted-title">Extracted Entry</h3>
                <p className="manualExtract-extracted-desc">Upload and auto-extract document information using automated processing.</p>

                <ul className="manualExtract-extracted-features">
                  <li><span className="manualExtract-extracted-bullet" aria-hidden>⏱</span>Processing time may vary</li>
                  <li><span className="manualExtract-extracted-bullet" aria-hidden>🛡</span>Requires manual verification</li>
                  <li><span className="manualExtract-extracted-bullet" aria-hidden>ℹ️</span>Accuracy depends on document quality</li>
                </ul>
              </div>
            </div>

            <div className="manualExtract-extracted-cta">
              <button className="manualExtract-extracted-btn" onClick={() => navigate('/docUpload')}>
                <span>Use Extracted Entry</span>
                <span className="manualExtract-extracted-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default ManualExtract;
