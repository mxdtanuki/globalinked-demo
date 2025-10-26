import React from 'react';
import './termsModal.css';

// Modal for showing Terms or Privacy. If the URL is external (different host),
// most sites (like pup.edu.ph) block embedding via X-Frame-Options/CSP. Instead
// of trying to iframe those pages (which leads to "refused to connect" errors),
// show a helpful message and provide a link/button to open the page in a new tab.
const TermsModal = ({ show, onClose, type, url }) => {
  if (!show) return null;

  const modalTitle = type === 'terms' ? 'PUP Online Services Terms of Use' : 'PUP Online Services Privacy Statement';
  const targetUrl = url || (type === 'terms' ? 'https://www.pup.edu.ph/terms/' : 'https://www.pup.edu.ph/privacy/');

  let isExternal = true;
  try {
    const targetHost = new URL(targetUrl).host;
    isExternal = targetHost !== window.location.host;
  } catch (err) {
    // If URL parsing fails, treat as external to avoid attempting to embed.
    isExternal = true;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{modalTitle}</h2>

        {isExternal ? (
          <div className="external-note">
            <p>
              The document is hosted on an external site and cannot be displayed inside the application.
              You can open it in a new tab to view the full content.
            </p>
            <div className="external-actions">
              <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="btn-link">
                Open in new tab
              </a>
              <button className="btn-secondary" onClick={() => window.open(targetUrl, '_blank', 'noopener')}>
                Open in new tab
              </button>
            </div>
            <p style={{marginTop:12, fontSize:12, color:'#666'}}>If you expected the content to appear inline, the remote site likely prevents embedding (X-Frame-Options or Content-Security-Policy).</p>
          </div>
        ) : (
          <iframe src={targetUrl} title={modalTitle} frameBorder="0"></iframe>
        )}
      </div>
    </div>
  );
};

export default TermsModal;