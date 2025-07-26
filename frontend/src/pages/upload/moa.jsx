import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopbarSidebar from '../../components/topbarSidebar';
import './moa.css';

const MOAUpload = () => {
  const navigate = useNavigate();
  const [withMou, setWithMou] = useState(false);
  const [selectedMou, setSelectedMou] = useState('');

  const mouOptions = [
    'MOU - Japan Exchange',
    'MOU - CHED Partnership',
    'MOU - Local Internship',
    'MOU - ASEAN Cooperation',
  ];

  return (
    <TopbarSidebar>
      <div className="mou-upload-container">
        <form className="initial-form">
          <h3 className="form-title">MOA Initial Form</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Source (Campus/College Dept)</label>
              <select defaultValue="" required>
                <option value="" disabled>Select source</option>
                <option value="CTHTM">CTHTM</option>
                <option value="COC">COC</option>
                <option value="COE">COE</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date (ULCO Approval)</label>
              <input type="date" />
            </div>

            <div className="form-group">
              <label>Point Person Position</label>
              <input type="text" />
            </div>

            <div className="form-group">
              <label>Date (PUP Official Signed)</label>
              <input type="date" />
            </div>

            <div className="form-group">
              <label>DTS No.</label>
              <input type="text" required />
            </div>

            <div className="form-group">
              <label>DTS Status</label>
              <input type="text" required />
            </div>

            <div className="form-group full-width">
              <label>Remarks:</label>
              <textarea rows="3" />
            </div>

            <div className="form-group full-width with-mou-section">
            <div className="checkbox-group-inline">
              <input
                type="checkbox"
                id="withMou"
                checked={withMou}
                onChange={() => setWithMou(!withMou)}
              />
              <label htmlFor="withMou">With MOU</label>
            </div>

            {withMou && (
              <div className="form-group mou-dropdown">
                <label>Select Related MOU</label>
                <select
                  value={selectedMou}
                  onChange={(e) => setSelectedMou(e.target.value)}
                >
                  <option value="" disabled>Select MOU</option>
                  {mouOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          </div>

          <p
            className="manual-entry-note"
            onClick={() => navigate('/upload/manualEntryMOA')}
          >
            Manual Entry
          </p>
        </form>

        <div className="upload-box">
          <h3>Upload File</h3>
          <p>Select MOA file</p>

          <div className="file-drop-area">
            <p>Select a file</p>
            <small>DOCX, PDF or Scanned PDF, file size no more than 20MB</small>
            <input type="file" id="moaFile" />
          </div>

          <button
            className="submit-btn"
            onClick={() => navigate('/upload/extractedEntryMoa')}
          >
            Submit
          </button>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default MOAUpload;
